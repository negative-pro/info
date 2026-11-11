export interface Article {
  id: string
  title: string
  excerpt: string
  writer: string
  readMinutes: number
  publishedAt: string
  imageAlt: string
  paragraphs: (string | { type: 'heading'; text: string })[]
  status: 'draft' | 'published'
}

export function parseArticle(value: unknown, source: string): Article {
  const invalid = () => { throw new Error(`Invalid article: ${source}`) }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  const article = value as Article
  const strings = [article.id, article.title, article.excerpt, article.writer, article.imageAlt]
  if (strings.some(field => typeof field !== 'string' || !field.trim())) return invalid()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.id)) return invalid()
  if (!Number.isSafeInteger(article.readMinutes) || article.readMinutes < 1) return invalid()
  if (typeof article.publishedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt)) return invalid()
  const date = new Date(article.publishedAt)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== article.publishedAt) return invalid()
  if (!['draft', 'published'].includes(article.status)) return invalid()
  if (!Array.isArray(article.paragraphs) || !article.paragraphs.length || article.paragraphs.some(p => {
    if (typeof p === 'string') return !p.trim()
    return !p || typeof p !== 'object' || p.type !== 'heading' || typeof p.text !== 'string' || !p.text.trim()
  })) return invalid()
  return article
}
