import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { ArticlesSection, BlogPage, ArticleDetail } from './Articles'
import text from '../content/ar/texts.json'
vi.mock('../data/articles', () => ({
  articles: [{ id: 'first-article', title: 'عنوان المقال', excerpt: 'مقدمة المقال', writer: 'اسم الكاتب', readMinutes: 4, publishedAt: '2026-11-11', imageAlt: 'غلاف المقال', paragraphs: [{ type: 'heading', text: 'عنوان القسم' }, 'النص الكامل للمقال'], status: 'published' }],
  articleImage: (id: string) => `/assets/articles/${id}.webp`,
}))
it('opens an article from its card and shows its image, writer, reading time, date and body', async () => {
  render(<MemoryRouter initialEntries={['/blog']}><Routes><Route path="/blog" element={<BlogPage/>}/><Route path="/blog/:id" element={<ArticleDetail notFound={<p>Missing</p>}/>}/></Routes></MemoryRouter>)
  expect(screen.getByText('اسم الكاتب')).toBeInTheDocument()
  expect(screen.queryByText(`4 ${text.blog.minutes}`)).not.toBeInTheDocument()
  expect(document.querySelector('time')).toHaveAttribute('dateTime', '2026-11-11')
  await userEvent.click(screen.getByRole('heading', { name: 'عنوان المقال' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('عنوان المقال')
  expect(screen.getByText(`4 ${text.blog.minutes}`)).toBeInTheDocument()
  expect(screen.getByAltText('غلاف المقال')).toHaveAttribute('src', '/assets/articles/first-article.webp')
  expect(screen.getByText('النص الكامل للمقال')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'عنوان القسم' })).toBeInTheDocument()
})
it('offers a link from the home section to all articles', () => {
  render(<MemoryRouter><ArticlesSection/></MemoryRouter>)
  expect(screen.getByRole('link', { name: text.blog.all })).toHaveAttribute('href', '/blog')
  expect(screen.getByText('اسم الكاتب')).toBeInTheDocument()
  expect(document.querySelector('.home-article-author')).toBeInTheDocument()
  expect(document.querySelector('.article-facts')).toBeNull()
})
it('handles unknown article IDs', () => {
  render(<MemoryRouter initialEntries={['/blog/missing']}><Routes><Route path="/blog/:id" element={<ArticleDetail notFound={<p>Missing</p>}/>}/></Routes></MemoryRouter>)
  expect(screen.getByText('Missing')).toBeInTheDocument()
})
