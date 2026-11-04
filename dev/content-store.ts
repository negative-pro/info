import { readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { parseCategoryContent } from '../src/models/validation.ts'
import { cachePlatformThumbnail } from './platform-thumbnail.ts'
import type { ContentItem, WorkDetails, Provider, SocialAccount } from '../src/models/content.ts'

export class ContentError extends Error {
  code: 'invalid' | 'duplicate' | 'category' | 'thumbnail'
  constructor(code: ContentError['code']) { super(code); this.code = code }
}
const fail = (code: ConstructorParameters<typeof ContentError>[0] = 'invalid'): never => { throw new ContentError(code) }
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : fail()
const string = (value: unknown, required = false, max = 12000): string => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) return fail()
  return value.trim()
}
const optional = (value: unknown): string | null => value == null || value === '' ? null : string(value)
const slug = (value: unknown): string => {
  const id = string(value, true, 100)
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? id : fail()
}
const url = (value: unknown): string | null => {
  const result = optional(value)
  if (!result) return null
  try { if (new URL(result).protocol === 'https:') return result } catch { /* Invalid URL. */ }
  return fail()
}
const names = (value: unknown): string[] => Array.isArray(value) && value.length <= 100 ? value.map(item => string(item, true, 200)) : fail()
const number = (value: unknown, min: number, max: number, integer = false): number | null => {
  if (value == null || value === '') return null
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)) ? value : fail()
}
const date = (value: unknown): string | null => {
  const result = optional(value)
  return !result || (!Number.isNaN(Date.parse(result)) && /^\d{4}-\d{2}-\d{2}/.test(result)) ? result : fail()
}
function workRecord(value: unknown, providers: Provider[]): WorkDetails {
  const input = object(value)
  const type = input.type === 'film' || input.type === 'series' ? input.type : fail()
  const providerIds = names(input.providerIds)
  if (providerIds.some(id => !providers.some(provider => provider.id === id))) fail()
  let imdb: WorkDetails['imdb'] = null
  if (input.imdb) {
    const data = object(input.imdb)
    const imdbUrl = url(data.url)
    if (!imdbUrl || !/^(www\.)?imdb\.com$/.test(new URL(imdbUrl).hostname)) fail()
    imdb = { url: imdbUrl!, rating: number(data.rating, 0, 10), ratingCount: number(data.ratingCount, 0, Number.MAX_SAFE_INTEGER, true), checkedAt: date(data.checkedAt) }
  }
  if (!Array.isArray(input.sources) || input.sources.length > 30) fail()
  const sources = (input.sources as unknown[]).map(item => { const source = object(item); const sourceUrl = url(source.url); return { label: string(source.label, true, 200), url: sourceUrl ?? fail() } })
  const partNumber = number(input.partNumber, 1, Number.MAX_SAFE_INTEGER, true)
  const seasonCount = number(input.seasonCount, 1, Number.MAX_SAFE_INTEGER, true)
  const seasonNumber = number(input.seasonNumber, 1, Number.MAX_SAFE_INTEGER, true)
  const runtimeMinutes = number(input.runtimeMinutes, 1, Number.MAX_SAFE_INTEGER, true)
  if ((type === 'film' && (seasonCount !== null || seasonNumber !== null)) || (type === 'series' && (partNumber !== null || runtimeMinutes !== null))) fail()
  if (seasonNumber !== null && seasonCount !== null && seasonNumber > seasonCount) fail()
  const extra: Partial<WorkDetails> = {}
  for (const key of ['cast', 'genres', 'countries', 'languages'] as const) {
    if (input[key] !== undefined) extra[key] = names(input[key])
  }
  for (const key of ['synopsis', 'franchise'] as const) {
    if (input[key] !== undefined) extra[key] = optional(input[key])
  }
  if (input.seasonNumber !== undefined) extra.seasonNumber = seasonNumber
  if (input.runtimeMinutes !== undefined) extra.runtimeMinutes = runtimeMinutes
  return { ...extra, partNumber, seasonCount, title: string(input.title, true, 500), originalTitle: optional(input.originalTitle), type, year: number(input.year, 1888, 2200, true), directors: names(input.directors), writers: names(input.writers), editors: names(input.editors), providerIds, imdb, sources }
}

/** Append only. Resolve paths through known category files, never client paths. */
export async function saveContent(root: string, value: unknown): Promise<{ id: string; file: string }> {
  const input = object(value)
  const postInput = object(input.item)
  const directory = join(root, 'src/content/ar')
  const files = (await readdir(directory)).filter(name => name.endsWith('-movies.json'))
  const records = await Promise.all(files.map(async name => ({ name, data: parseCategoryContent(JSON.parse(await readFile(join(directory, name), 'utf8')), name) })))
  const record = records.find(item => item.data.category.id === input.categoryId)
  if (!record) return fail('category')
  const id = postInput.id == null || postInput.id === '' ? `item-${randomUUID()}` : slug(postInput.id)
  if (records.some(item => item.data.items.some(post => post.id === id))) return fail('duplicate')
  const platform = postInput.platform === 'youtube' ? 'youtube' : fail()
  const kind = postInput.kind === 'video' ? 'video' : fail()
  const externalUrl = url(postInput.externalUrl)
  if (!externalUrl) fail()
  const hostname = new URL(externalUrl!).hostname
  if (!['youtube.com', 'youtu.be'].some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) fail()
  const layout = postInput.videoLayout === 'portrait' || postInput.videoLayout === 'landscape' ? postInput.videoLayout : fail()
  if (!Array.isArray(postInput.body) || postInput.body.length > 100) fail()
  let work: WorkDetails | null = null
  if (postInput.work != null) {
    const providers = JSON.parse(await readFile(join(root, 'src/data/providers.json'), 'utf8')) as Provider[]
    work = workRecord(postInput.work, providers)
  }
  if (input.thumbnailUpload || postInput.thumbnailAsset) fail()
  const post: ContentItem = { id, work, kind, platform, title: string(postInput.title, true, 1000), description: string(postInput.description), body: (postInput.body as unknown[]).map(item => string(item, true)), externalUrl, videoLayout: layout, thumbnailAsset: null, isDemo: false, publishedAt: date(postInput.publishedAt) }
  post.thumbnailAsset = await cachePlatformThumbnail(root, post)
  record.data.items.push(post)
  const target = join(directory, record.name)
  const temporary = `${target}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(record.data, null, 2)}\n`, 'utf8')
  await rename(temporary, target)
  return { id, file: `src/content/ar/${record.name}` }
}

/** Change publication visibility without replacing editorial metadata. */
export async function setContentVisibility(root: string, value: unknown) {
  const input = object(value)
  const id = slug(input.id)
  if (typeof input.hidden !== 'boolean') fail()
  const directory = join(root, 'src/content/ar')
  const files = (await readdir(directory)).filter(name => name.endsWith('-movies.json'))
  for (const name of files) {
    const target = join(directory, name)
    const data = parseCategoryContent(JSON.parse(await readFile(target, 'utf8')), name)
    const item = data.items.find(post => post.id === id)
    if (!item) continue
    item.hidden = input.hidden as boolean
    const temporary = `${target}.${randomUUID()}.tmp`
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await rename(temporary, target)
    return { id, hidden: item.hidden }
  }
  return fail()
}

/** Update only social visibility/statistics, preserving account copy and links. */
export async function updateSocialAccount(root: string, value: unknown) {
  const input = object(value)
  const id = slug(input.id)
  const target = join(root, 'src/content/ar/social-accounts.json')
  const accounts = JSON.parse(await readFile(target, 'utf8')) as SocialAccount[]
  const account = accounts.find(item => item.id === id)
  if (!account) return fail()
  let changed = false
  if (input.hidden !== undefined) {
    if (typeof input.hidden !== 'boolean') return fail()
    account.hidden = input.hidden
    changed = true
  }
  for (const key of ['followerCount', 'subscriberCount', 'monthlyVisitors'] as const) {
    if (input[key] === undefined) continue
    if (input[key] !== null && (typeof input[key] !== 'number' || !Number.isSafeInteger(input[key]) || Number(input[key]) < 0)) return fail()
    account[key] = input[key] as number | null
    changed = true
  }
  if (input.statsUpdatedAt !== undefined) {
    if (input.statsUpdatedAt !== null && (typeof input.statsUpdatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.statsUpdatedAt) || Number.isNaN(Date.parse(input.statsUpdatedAt)) || new Date(input.statsUpdatedAt).toISOString().slice(0, 10) !== input.statsUpdatedAt)) return fail()
    account.statsUpdatedAt = input.statsUpdatedAt as string | null
    changed = true
  }
  if (!changed) return fail()
  const temporary = `${target}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(accounts, null, 2)}\n`, 'utf8')
  await rename(temporary, target)
  return account
}
