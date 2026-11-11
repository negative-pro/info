import { parseArticle } from '../models/article'

const files = import.meta.glob<unknown>('../content/ar/articles/*.json', { eager: true, import: 'default' })
const images = import.meta.glob<string>('../assets/articles/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' })
export const articleImage = (id: string) => {
  const matches = Object.entries(images).filter(([path]) => path.replace(/\.[^.]+$/, '') === `../assets/articles/${id}`)
  if (matches.length > 1) throw new Error(`Multiple covers for article: ${id}`)
  return matches[0]?.[1]
}
const ids = new Set<string>()
export const articles = Object.entries(files).map(([source, value]) => {
  const article = parseArticle(value, source)
  if (source.split('/').at(-1) !== `${article.id}.json` || ids.has(article.id)) throw new Error(`Article ID must be unique and match its filename: ${source}`)
  ids.add(article.id)
  if (article.status === 'published' && !articleImage(article.id)) throw new Error(`Missing article image: ${article.id}`)
  return article
}).filter(article => article.status === 'published').toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))
