import type { ContentItem } from './item.ts'
export type { WorkDetails } from './work.ts'
export type { ContentItem, CatalogItem, SaveContentRequest } from './item.ts'

/** Shared content contracts for category JSON, the UI, and the local editor. */
export interface Category { id: string; slug: string; name: string; description: string; order: number }
export interface Provider { id: string; name: string; iconAsset: string | null; websiteUrl: string }
/** One editorial file per category; adding another category requires no UI changes. */
export interface CategoryContent {
  category: Category
  items: ContentItem[]
}

export interface SocialAccount {
  id: string
  name: string
  latin: string
  description: string
  url: string | null
  followerCount: number | null
  subscriberCount: number | null
  monthlyVisitors: number | null
  /** ISO date of the manually entered statistics; counts are not fetched live. */
  statsUpdatedAt: string | null
  communityText: string
  communityWithFollowers: string
  communityWithSubscribers: string
}
