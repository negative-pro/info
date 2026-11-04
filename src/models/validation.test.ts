import { describe, expect, it } from 'vitest'
import foreign from '../content/ar/foreign-movies.json'
const arabic = { ...foreign, items: foreign.items.filter(item => item.work.type === 'film') }
import { parseCategoryContent } from './validation'

describe('category JSON validation', () => {
  it('accepts the item schema, empty categories, and items without work details', () => {
    expect(parseCategoryContent(arabic, 'arabic')).toBe(arabic)
    expect(parseCategoryContent({ category: arabic.category, items: [] }, 'empty').items).toEqual([])
    const item = { ...arabic.items[0], work: null }
    expect(parseCategoryContent({ category: arabic.category, items: [item] }, 'no-work').items[0].work).toBeNull()
  })
  it.each([
    { ...arabic, items: undefined, posts: [] },
    { ...arabic, items: [{ ...arabic.items[0], platform: 'invalid' }] },
    { ...arabic, items: [{ ...arabic.items[0], work: { ...arabic.items[0].work, year: '1989' } }] },
    { ...arabic, items: [{ ...arabic.items[0], work: undefined }] },
  ])('rejects invalid JSON before it reaches the UI', value => {
    expect(() => parseCategoryContent(value, 'invalid.json')).toThrow('Invalid category content: invalid.json')
  })
})

it.each([
  { type: 'film', partNumber: 2, seasonCount: null, valid: true },
  { type: 'series', partNumber: null, seasonCount: 4, valid: true },
  { type: 'film', partNumber: 0, seasonCount: null, valid: false },
  { type: 'series', partNumber: null, seasonCount: 1.5, valid: false },
  { type: 'film', partNumber: null, seasonCount: 3, valid: false },
  { type: 'series', partNumber: 2, seasonCount: null, valid: false },
])('validates installment and season metadata: %j', ({ valid, ...fields }) => {
  const value = { ...arabic, items: [{ ...arabic.items[0], work: { ...arabic.items[0].work, ...fields } }] }
  if (valid) expect(parseCategoryContent(value, 'work').items[0].work).toMatchObject(fields)
  else expect(() => parseCategoryContent(value, 'work')).toThrow()
})

it.each([
  { cast: ['Actor'], genres: ['Action'], countries: ['US'], languages: ['en'], synopsis: 'Plot', franchise: 'Franchise', runtimeMinutes: 120, valid: true },
  { type: 'series', seasonNumber: 2, seasonCount: 4, valid: true },
  { cast: 'Actor', valid: false },
  { genres: [42], valid: false },
  { runtimeMinutes: 0, valid: false },
  { runtimeMinutes: 1.5, valid: false },
  { type: 'film', seasonNumber: 2, valid: false },
  { type: 'series', runtimeMinutes: 120, valid: false },
  { type: 'series', seasonNumber: 5, seasonCount: 4, valid: false },
])('validates additional work metadata: %j', ({ valid, ...fields }) => {
  const value = { ...arabic, items: [{ ...arabic.items[0], work: { ...arabic.items[0].work, ...fields } }] }
  if (valid) expect(parseCategoryContent(value, 'metadata').items[0].work).toMatchObject(fields)
  else expect(() => parseCategoryContent(value, 'metadata')).toThrow()
})
