import type { CategoryContent } from './content.ts'

type Guard = (value: unknown) => boolean
const string: Guard = value => typeof value === 'string'
const number: Guard = value => typeof value === 'number' && Number.isFinite(value)
const nullable = (guard: Guard): Guard => value => value === null || guard(value)
const optional = (guard: Guard): Guard => value => value === undefined || guard(value)
const array = (guard: Guard): Guard => value => Array.isArray(value) && value.every(guard)
const choices = (...values: string[]): Guard => value => typeof value === 'string' && values.includes(value)
const shape = (fields: Record<string, Guard>): Guard => value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return Object.entries(fields).every(([key, guard]) => guard(record[key]))
}
const positiveInteger: Guard = value => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
const workShape = shape({
  title: string,
  originalTitle: nullable(string),
  type: choices('film', 'series'),
  year: nullable(number),
  partNumber: optional(nullable(positiveInteger)),
  seasonCount: optional(nullable(positiveInteger)),
  seasonNumber: optional(nullable(positiveInteger)),
  runtimeMinutes: optional(nullable(positiveInteger)),
  cast: optional(array(string)),
  genres: optional(array(string)),
  countries: optional(array(string)),
  languages: optional(array(string)),
  synopsis: optional(nullable(string)),
  franchise: optional(nullable(string)),
  directors: array(string),
  writers: array(string),
  editors: array(string),
  providerIds: array(string),
  imdb: nullable(shape({ url: string, rating: nullable(number), ratingCount: nullable(number), checkedAt: nullable(string) })),
  sources: array(shape({ label: string, url: string })),
})
const work: Guard = value => {
  if (!workShape(value)) return false
  const record = value as Record<string, unknown>
  if (record.type === 'film') return record.seasonCount == null && record.seasonNumber == null
  if (record.partNumber != null || record.runtimeMinutes != null) return false
  return record.seasonNumber == null || record.seasonCount == null || Number(record.seasonNumber) <= Number(record.seasonCount)
}
const categoryContent = shape({
  category: shape({ id: string, slug: string, name: string, description: string, order: number }),
  items: array(shape({
    id: string,
    work: nullable(work),
    kind: choices('post', 'video'),
    platform: choices('youtube', 'facebook', 'instagram', 'tiktok', 'website'),
    title: string,
    description: string,
    body: array(string),
    externalUrl: nullable(string),
    videoLayout: optional(choices('portrait', 'landscape')),
    thumbnailAsset: optional(nullable(string)),
    isDemo: value => typeof value === 'boolean',
    publishedAt: nullable(string),
  })),
})

/** JSON is untyped at runtime: validate it before exposing the TypeScript model. */
export function parseCategoryContent(value: unknown, source: string): CategoryContent {
  if (!categoryContent(value)) throw new Error(`Invalid category content: ${source}`)
  return value as CategoryContent
}
