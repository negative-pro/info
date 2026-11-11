import { expect, it } from 'vitest'
import { parseArticle } from './article'
const article = { id: 'first-article', language: 'ar', workLanguage: 'arabic', title: 'عنوان', excerpt: 'مقدمة', writer: 'كاتب', readMinutes: 4, publishedAt: '2026-11-11', imageAlt: 'صورة المقال', tags: [], paragraphs: ['فقرة أولى', 'فقرة ثانية'], status: 'published' }
it('accepts complete articles and drafts', () => {
  expect(parseArticle(article, 'article.json')).toEqual(article)
  expect(parseArticle({ ...article, status: 'draft' }, 'draft.json').status).toBe('draft')
})
it.each([{ id: '../bad' }, { writer: '' }, { readMinutes: 0 }, { readMinutes: 1.5 }, { publishedAt: '2026-02-30' }, { publishedAt: null }, { paragraphs: [] }, { paragraphs: [null] }, { imageAlt: '' }, { status: 'invalid' }])('rejects invalid article fields %j', fields => {
  expect(() => parseArticle({ ...article, ...fields }, 'invalid.json')).toThrow('Invalid article: invalid.json')
})

it('accepts section headings among paragraphs and rejects empty headings', () => {
  expect(parseArticle({ ...article, paragraphs: ['مقدمة', { type: 'heading', text: 'عنوان القسم' }, 'نص القسم'] }, 'sections.json').paragraphs).toHaveLength(3)
  expect(() => parseArticle({ ...article, paragraphs: [{ type: 'heading', text: '' }] }, 'invalid.json')).toThrow()
})
