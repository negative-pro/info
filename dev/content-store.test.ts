// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { saveContent, setContentVisibility, updateSocialAccount } from './content-store.ts'

let root: string
const seed = { category: { id: 'arabic', slug: 'arabic', name: 'Arabic', description: '', order: 1 }, items: [] }
const payload = () => ({ categoryId: 'arabic', item: { id: 'new-review', work: null, kind: 'video', platform: 'youtube', title: 'New review', description: '', body: ['One paragraph'], externalUrl: 'https://www.youtube.com/watch?v=BYCi1wH2Aug', videoLayout: 'landscape', thumbnailAsset: null, publishedAt: null } })
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'negative-editor-'))
  await mkdir(join(root, 'src/content/ar'), { recursive: true })
  await mkdir(join(root, 'src/data'), { recursive: true })
  await writeFile(join(root, 'src/content/ar/arabic-movies.json'), JSON.stringify(seed))
  await writeFile(join(root, 'src/data/providers.json'), JSON.stringify([{ id: 'netflix' }]))
})
afterEach(() => rm(root, { recursive: true, force: true }))
describe('local JSON content storage', () => {
  it('appends items with embedded work details without replacing existing content', async () => {
    const input = payload()
    const production = { partNumber: null, seasonCount: null, title: 'A film', originalTitle: null, type: 'film', year: 2026, directors: ['Director'], writers: [], editors: [], providerIds: ['netflix'], imdb: { url: 'https://www.imdb.com/title/tt1234567/', rating: 7.2, ratingCount: 100, checkedAt: '2026-11-03' }, sources: [] }
    const result = await saveContent(root, { ...input, item: { ...input.item, work: production } })
    expect(result.file).toBe('src/content/ar/arabic-movies.json')
    await saveContent(root, { ...input, item: { ...input.item, id: 'another-review', work: production } })
    const content = JSON.parse(await readFile(join(root, result.file), 'utf8'))
    expect(content.category).toEqual(seed.category)
    expect(content.items).toHaveLength(2)
    expect(content).not.toHaveProperty('productions')
    expect(content.items[0].work).toEqual(production)
    expect(content.items[1].work).toEqual(production)
    expect(content.items[0].isDemo).toBe(false)
  })
  it('rejects duplicate IDs without changing the existing file', async () => {
    const input = payload()
    const { file } = await saveContent(root, input)
    const before = await readFile(join(root, file), 'utf8')
    await expect(saveContent(root, input)).rejects.toMatchObject({ code: 'duplicate' })
    expect(await readFile(join(root, file), 'utf8')).toBe(before)
  })
  it.each([
    { id: '../../outside' },
    { platform: 'facebook' },
    { kind: 'post' },
    { externalUrl: 'javascript:alert(1)' },
    { externalUrl: 'https://youtube.com.evil.test/watch?v=BYCi1wH2Aug' },
    { thumbnailAsset: '../../outside.png' },
    { work: { type: 'invalid' } },
  ])('rejects invalid or cross-file input %j', async fields => {
    const input = payload()
    await expect(saveContent(root, { ...input, item: { ...input.item, ...fields } })).rejects.toBeDefined()
    expect(JSON.parse(await readFile(join(root, 'src/content/ar/arabic-movies.json'), 'utf8'))).toEqual(seed)
  })
  it('rejects manual image uploads', async () => {
    await expect(saveContent(root, { ...payload(), thumbnailUpload: { mime: 'image/png', data: 'AAAA' } })).rejects.toMatchObject({ code: 'invalid' })
  })
})

it('automatically generates unique item IDs and embeds work without IDs', async () => {
  const base = payload()
  const { id: omitted, ...item } = base.item
  void omitted
  const production = { partNumber: null, seasonCount: null, title: 'New title', originalTitle: null, type: 'film', year: null, directors: [], writers: [], editors: [], providerIds: [], imdb: null, sources: [] }
  const first = await saveContent(root, { categoryId: base.categoryId, item: { ...item, work: production } })
  const second = await saveContent(root, { categoryId: base.categoryId, item: { ...item, work: production } })
  expect(first.id).toMatch(/^item-[a-f0-9-]{36}$/)
  expect(first.id).not.toBe(second.id)
  const content = JSON.parse(await readFile(join(root, first.file), 'utf8'))
  expect(content.items[0].work).toEqual(production)
  expect(content.items[1].work).toEqual(production)
  expect(content.items[0].work).not.toHaveProperty('id')
})

it('rejects an unknown category without changing content', async () => {
  await expect(saveContent(root, { ...payload(), categoryId: '../foreign' })).rejects.toMatchObject({ code: 'category' })
  expect(JSON.parse(await readFile(join(root, 'src/content/ar/arabic-movies.json'), 'utf8'))).toEqual(seed)
})

it.each([
  { type: 'film', partNumber: 2, seasonCount: null, valid: true },
  { type: 'series', partNumber: null, seasonCount: 5, valid: true },
  { type: 'film', partNumber: -1, seasonCount: null, valid: false },
  { type: 'series', partNumber: null, seasonCount: 2.5, valid: false },
  { type: 'film', partNumber: null, seasonCount: 2, valid: false },
  { type: 'series', partNumber: 1, seasonCount: null, valid: false },
])('saves only applicable positive integer work numbers: %j', async ({ valid, ...fields }) => {
  const base = payload()
  const work = { title: 'A work', originalTitle: null, year: null, directors: [], writers: [], editors: [], providerIds: [], imdb: null, sources: [], ...fields }
  const request = { ...base, item: { ...base.item, work } }
  if (valid) {
    const result = await saveContent(root, request)
    const saved = JSON.parse(await readFile(join(root, result.file), 'utf8'))
    expect(saved.items[0].work).toEqual(work)
  } else {
    await expect(saveContent(root, request)).rejects.toMatchObject({ code: 'invalid' })
    expect(JSON.parse(await readFile(join(root, 'src/content/ar/arabic-movies.json'), 'utf8'))).toEqual(seed)
  }
})

it('preserves optional film metadata and rejects inconsistent season details', async () => {
  const base = payload()
  const work = { title: 'A film', type: 'film', originalTitle: null, year: null, partNumber: 2, seasonCount: null, seasonNumber: null, runtimeMinutes: 120, cast: ['Actor'], genres: ['Action'], countries: ['US'], languages: ['en'], synopsis: 'A plot summary', franchise: 'A franchise', directors: [], writers: [], editors: [], providerIds: [], imdb: null, sources: [] }
  const result = await saveContent(root, { ...base, item: { ...base.item, work } })
  const before = await readFile(join(root, result.file), 'utf8')
  expect(JSON.parse(before).items[0].work).toEqual(work)
  await expect(saveContent(root, { ...base, item: { ...base.item, id: 'bad-season', work: { ...work, type: 'series', partNumber: null, runtimeMinutes: null, seasonNumber: 5, seasonCount: 4 } } })).rejects.toMatchObject({ code: 'invalid' })
  expect(await readFile(join(root, result.file), 'utf8')).toBe(before)
})

it('persists visibility changes without changing content and rejects invalid targets', async () => {
  const input = payload()
  await saveContent(root, input)
  const target = join(root, 'src/content/ar/arabic-movies.json')
  const before = JSON.parse(await readFile(target, 'utf8')).items[0]
  await expect(setContentVisibility(root, { id: before.id, hidden: true })).resolves.toEqual({ id: before.id, hidden: true })
  expect(JSON.parse(await readFile(target, 'utf8')).items[0]).toEqual({ ...before, hidden: true })
  await setContentVisibility(root, { id: before.id, hidden: false })
  expect(JSON.parse(await readFile(target, 'utf8')).items[0].hidden).toBe(false)
  await expect(setContentVisibility(root, { id: before.id, hidden: 'yes' })).rejects.toMatchObject({ code: 'invalid' })
  await expect(setContentVisibility(root, { id: 'missing', hidden: true })).rejects.toMatchObject({ code: 'invalid' })
})

it('saves social visibility and statistics while preserving account metadata', async () => {
  const target = join(root, 'src/content/ar/social-accounts.json')
  const account = { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/@negative', followerCount: null, subscriberCount: 100, monthlyVisitors: null, statsUpdatedAt: null }
  await writeFile(target, JSON.stringify([account]))
  await updateSocialAccount(root, { id: 'youtube', hidden: true })
  expect(JSON.parse(await readFile(target, 'utf8'))[0]).toEqual({ ...account, hidden: true })
  await updateSocialAccount(root, { id: 'youtube', hidden: false, subscriberCount: 0, monthlyVisitors: 200, followerCount: null, statsUpdatedAt: '2026-11-04' })
  const saved = JSON.parse(await readFile(target, 'utf8'))[0]
  expect(saved).toEqual({ ...account, hidden: false, subscriberCount: 0, monthlyVisitors: 200, statsUpdatedAt: '2026-11-04' })
  for (const update of [{ subscriberCount: -1 }, { subscriberCount: 1.5 }, { followerCount: '100' }, { monthlyVisitors: Number.MAX_SAFE_INTEGER + 1 }, { hidden: 'yes' }, { statsUpdatedAt: '2026-02-30' }, { id: 'missing', hidden: true }]) {
    await expect(updateSocialAccount(root, { id: 'youtube', ...update })).rejects.toMatchObject({ code: 'invalid' })
    expect(JSON.parse(await readFile(target, 'utf8'))[0]).toEqual(saved)
  }
  await updateSocialAccount(root, { id: 'youtube', subscriberCount: null, statsUpdatedAt: null })
  expect(JSON.parse(await readFile(target, 'utf8'))[0]).toMatchObject({ subscriberCount: null, statsUpdatedAt: null })
})
