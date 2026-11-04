import { parseCategoryContent } from '../models/validation'
import providerData from './providers.json'
import type { CatalogItem, Provider } from '../models/content'

// Each category owns its metadata and items in one editable file.
// This adapter is the only layer that will need replacing with a database/API.
const files = import.meta.glob<unknown>('../content/ar/*-movies.json', {
  eager: true,
  import: 'default',
})
export const categoryContent = Object.entries(files).map(([source, value]) => parseCategoryContent(value, source)).toSorted((a, b) => a.category.order - b.category.order)
export const categories = categoryContent.map(file => file.category)
export const allItems: CatalogItem[] = categoryContent.flatMap(file => file.items.map(item => ({ ...item, categoryId: file.category.id }))).toSorted((a, b) => Number(a.isDemo) - Number(b.isDemo))
export const items = allItems.filter(item => !item.hidden)
export const providers: Provider[] = providerData
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
// The glob lets you add provider icons to src/assets without changing components.
const assets = import.meta.glob<string>('../assets/**/*.{svg,png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' })
export const contentAsset = (path: string | null) => path ? assets[`../assets/${path}`] : undefined

export const providerIcon = contentAsset
