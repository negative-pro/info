import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Site } from './App'
import { categories, items } from './data/catalog'
import text from './content/ar/texts.json'
import accounts from './content/ar/social-accounts.json'
import { articles } from './data/articles'

// Public-layout fixtures stay visible regardless of local dashboard changes.
vi.mock('./data/catalog', async importOriginal => {
  const catalog = await importOriginal<typeof import('./data/catalog')>()
  return { ...catalog, items: catalog.allItems.map(item => ({ ...item, hidden: false })) }
})

const rip = items.find(post => post.id === 'item-a70493ee-5758-4166-8b18-c28546bbc1a7')!
const film = rip.work!
function page(path = '/') { return render(<MemoryRouter initialEntries={[path]}><Site/></MemoryRouter>) }
describe('Arabic website catalog', () => {
  it.each([['/', 'home'], ['/discover', 'discover'], ['/about', 'about']] as const)('scrolls to the top when the current %s navbar link is clicked', async (path, key) => {
    page(path)
    vi.mocked(window.scrollTo).mockClear()
    await userEvent.click(screen.getByRole('link', { name: text.nav[key] }))
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('restores the previous page position when switching navbar pages', async () => {
    let scrollPosition = 0
    const scroll = vi.mocked(window.scrollTo)
    const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollPosition })
    scroll.mockImplementation(((options: ScrollToOptions | number, y?: number) => {
      scrollPosition = typeof options === 'number' ? y ?? 0 : options.top ?? 0
    }) as typeof window.scrollTo)
    try {
      page('/')
      scrollPosition = 650
      await userEvent.click(screen.getByRole('link', { name: text.nav.discover }))
      expect(scrollPosition).toBe(0)
      scrollPosition = 300
      await userEvent.click(screen.getByRole('link', { name: text.nav.home }))
      expect(scrollPosition).toBe(650)
      await userEvent.click(screen.getByRole('link', { name: text.nav.home }))
      expect(scrollPosition).toBe(0)
      await userEvent.click(screen.getByRole('link', { name: text.nav.discover }))
      expect(scrollPosition).toBe(300)
    } finally {
      scroll.mockReset()
      if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY)
    }
  })

  it('places theme controls in the footer and opens legal pages', async () => {
    page()
    expect(screen.getByRole('contentinfo')).toContainElement(screen.getByRole('group', { name: text.appearance.label }))
    expect(screen.getByRole('banner')).not.toContainElement(screen.getByRole('group', { name: text.appearance.label }))
    for (const title of ['بيانات الموقع', 'سياسة الخصوصية', 'شروط الاستخدام', 'حقوق النشر']) {
      await userEvent.click(screen.getByRole('link', { name: title }))
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    }
  })
  it('renders home and navigates to discover', async () => {
    page()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.home.title)
    expect(document.querySelector('.hero-actions')).toBeNull()
    await userEvent.click(screen.getByRole('link', { name: text.nav.discover }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.discover.title)
  })
  it('limits compact home videos and links to the unchanged full Discover catalog', async () => {
    page('/')
    expect(document.querySelectorAll('.home-video-card')).toHaveLength(4)
    expect(document.querySelector('.home-video-card .card-description')).toBeNull()
    expect(screen.getByRole('heading', { name: articles[0].title })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: text.home.seeMore }))
    expect(document.querySelectorAll('.catalog-card')).toHaveLength(items.length)
    expect(document.querySelector('.home-video-card')).toBeNull()
  })
  it('shows published articles in the blog', () => {
    page('/blog')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.blog.title)
    expect(screen.getByRole('heading', { name: articles[0].title })).toBeInTheDocument()
  })
  it.each(['/discover', '/category/arabic', `/story/${rip.id}`])('keeps Discover active on %s', path => {
    page(path)
    expect(screen.getByRole('link', { name: text.nav.discover })).toHaveClass('active')
    expect(screen.getByRole('link', { name: text.nav.discover })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: text.nav.home })).not.toHaveClass('active')
  })
  it.each(['/blog', `/blog/${articles[0].id}`])('keeps Articles active on %s', path => {
    page(path)
    expect(screen.getByRole('link', { name: text.nav.blog })).toHaveClass('active')
    expect(screen.getByRole('link', { name: text.nav.blog })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: text.nav.home })).not.toHaveClass('active')
    expect(screen.getByRole('link', { name: text.nav.discover })).not.toHaveClass('active')
  })
  it('shows only YouTube posts and ignores old platform URLs', () => {
    page('/discover?platform=tiktok')
    expect(screen.queryByRole('group', { name: text.discover.typeFilter })).toBeInTheDocument()
    expect(document.querySelectorAll('.catalog-card')).toHaveLength(items.length)
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
  })
  it('filters movies and series and retains search across categories', async () => {
    page('/discover?type=film')
    expect(screen.getByRole('button', { name: text.discover.film })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: text.discover.series }))
    expect(screen.queryByRole('heading', { name: rip.title })).not.toBeInTheDocument()
    expect(document.querySelectorAll('.catalog-card')).toHaveLength(items.filter(item => item.work?.type === 'series').length)
    await userEvent.click(screen.getByRole('link', { name: categories[1].name }))
    expect(screen.getByRole('button', { name: text.discover.series })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: text.discover.all }))
    await userEvent.type(screen.getByRole('textbox'), film.directors[0])
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), 'xyz')
    expect(screen.getByText(text.discover.empty)).toBeInTheDocument()
  })
  it('preserves search across categories and clears it', async () => {
    page('/discover?q=netflix')
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: categories[0].name }))
    expect(screen.getByRole('textbox')).toHaveValue('netflix')
    expect(screen.getByText(text.discover.empty)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: categories[1].name }))
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: text.discover.clearSearch }))
    expect(screen.getByRole('textbox')).toHaveValue('')
    await userEvent.type(screen.getByRole('textbox'), '٢٠٢٦ RIP')
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
  })
  it('opens review details with known metadata only', async () => {
    page('/category/foreign')
    await userEvent.click(screen.getByRole('heading', { name: rip.title }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(rip.title)
    for (const link of screen.getAllByRole('link', { name: text.catalog.youtube })) expect(link).toHaveAttribute('href', rip.externalUrl)
    expect(screen.getByRole('link', { name: `${text.catalog.watchOn} نتفليكس` })).toBeInTheDocument()
    expect(screen.getByText('2026', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.queryByText(text.catalog.editors)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /IMDb/i })).not.toBeInTheDocument()
    expect(screen.queryByText(text.catalog.rating)).not.toBeInTheDocument()
  })
  it('links YouTube thumbnails to the original video', () => {
    page('/discover')
    const link = screen.getAllByRole('link', { name: text.catalog.youtube }).find(action => action.getAttribute('href') === rip.externalUrl && action.querySelector('img'))!
    expect(link).toHaveAttribute('href', rip.externalUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.querySelector('img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/N-y71o8a4Ug/hqdefault.jpg')
  })
  it('renders social accounts from configuration', () => {
    page('/about')
    expect(document.querySelectorAll('a.social-card')).toHaveLength(accounts.filter(account => account.url).length)
  })
  it.each(['/unknown', '/story/unknown', '/category/unknown'])('handles unknown route %s', path => {
    page(path)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.notFound.title)
  })
})
