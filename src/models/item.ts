import type { WorkDetails } from './work.ts'

export interface ContentItem {
  id: string
  work: WorkDetails | null
  kind: 'post' | 'video'
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'website'
  title: string
  description: string
  body: string[]
  externalUrl: string | null
  videoLayout?: 'portrait' | 'landscape'
  thumbnailAsset?: string | null
  hidden?: boolean
  isDemo: boolean
  publishedAt: string | null
}

/** Category context is derived from the containing file, never duplicated in JSON. */
export interface CatalogItem extends ContentItem { categoryId: string }

export interface SaveContentRequest {
  categoryId: string
  item: Omit<ContentItem, 'id'> & { id?: string }
}
