import { describe, expect, it } from 'vitest'
import { contentAsset, categories, categoryContent, items, providers } from './catalog'

describe('catalog data integrity', () => {
  it('uses unique stable IDs and category slugs', () => {
    for (const records of [categories, items, providers]) {
      expect(new Set(records.map(record => record.id)).size).toBe(records.length)
    }
    expect(new Set(categories.map(category => category.slug)).size).toBe(categories.length)
  })
  it('keeps each category file self-contained', () => {
    for (const file of categoryContent) {
      for (const post of file.items) {
        expect(post).not.toHaveProperty('categoryId')
        expect(post).not.toHaveProperty('productionId')
        expect(post).toHaveProperty('work')
      }
    }
  })
  it('has valid foreign keys, content kinds, and external URLs', () => {
    for (const post of items) {
      expect(categories.some(category => category.id === post.categoryId)).toBe(true)
      expect(['post', 'video']).toContain(post.kind)
      expect(['youtube', 'facebook', 'instagram', 'tiktok', 'website']).toContain(post.platform)
      if (post.externalUrl) {
        const url = new URL(post.externalUrl)
        expect(url.protocol).toBe('https:')
        if (post.platform === 'youtube') expect(url.hostname).toBe('www.youtube.com')
        if (post.platform === 'facebook') expect(url.hostname.endsWith('facebook.com')).toBe(true)
      }
      if (post.thumbnailAsset) expect(contentAsset(post.thumbnailAsset)).toBeTruthy()
      expect(post.body.every(paragraph => typeof paragraph === 'string')).toBe(true)
    }
    for (const { work: production } of items) {
      if (!production) continue
      for (const id of production.providerIds) expect(providers.some(provider => provider.id === id)).toBe(true)
      if (production.imdb?.rating !== null && production.imdb?.rating !== undefined) {
        expect(production.imdb.rating).toBeGreaterThanOrEqual(0)
        expect(production.imdb.rating).toBeLessThanOrEqual(10)
      }
    }
  })
})
