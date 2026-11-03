import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Site } from './App'
import { categories, items } from './data/catalog'
import text from './content/ar/texts.json'
import accounts from './content/ar/social-accounts.json'

const rip = items.find(post => post.id === 'item-a70493ee-5758-4166-8b18-c28546bbc1a7')!
const film = rip.work!
const facebook = items.find(post => post.id === 'item-c4aa5830-2f11-4efc-9325-39732dfc7f8e')!
const tiktok = items.find(post => post.id === 'item-f83c9c11-f502-4350-a67a-4bc11d3dea48')!
const instagram = items.find(post => post.id === 'item-ceb83649-e86a-46ff-a379-8c640774390e')!
function page(path = '/') { return render(<MemoryRouter initialEntries={[path]}><Site/></MemoryRouter>) }
describe('Arabic website catalog', () => {
  it('places theme controls in the footer and opens legal pages', async () => {
    page()
    expect(screen.getByRole('contentinfo')).toContainElement(screen.getByRole('group', { name: text.appearance.label }))
    expect(screen.getByRole('banner')).not.toContainElement(screen.getByRole('group', { name: text.appearance.label }))
    for (const title of ['بيانات الموقع — Impressum', 'سياسة الخصوصية', 'شروط الاستخدام — AGB', 'حقوق النشر']) {
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
  it.each(['/discover', '/category/arabic', `/story/${rip.id}`])('keeps Discover active on %s', path => {
    page(path)
    expect(screen.getByRole('link', { name: text.nav.discover })).toHaveClass('active')
    expect(screen.getByRole('link', { name: text.nav.discover })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: text.nav.home })).not.toHaveClass('active')
  })
  it('chooses an available platform for each category and isolates content', async () => {
    page('/discover')
    await userEvent.click(screen.getByRole('link', { name: categories[0].name }))
    expect(screen.getByRole('heading', { name: facebook.title })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: rip.title })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: text.discover.platformNames.tiktok }))
    expect(screen.getByRole('heading', { name: tiktok.title })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: facebook.title })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: text.discover.platformNames.instagram }))
    expect(screen.getByText(text.discover.emptyPlatform)).toBeInTheDocument()
  })
  it('shows all platforms together and keeps search working', async () => {
    page('/discover?platform=all')
    expect(screen.getByRole('button', { name: text.discover.allPlatforms })).toHaveAttribute('aria-pressed', 'true')
    for (const post of [rip, facebook, tiktok, instagram]) expect(screen.getByRole('heading', { name: post.title })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox'), rip.title)
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: facebook.title })).not.toBeInTheDocument()
  })
  it('supports direct platform URLs and title/credit search', async () => {
    page('/discover?platform=tiktok')
    expect(screen.getByRole('button', { name: text.discover.platformNames.tiktok })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: tiktok.title })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: text.discover.platformNames.youtube }))
    await userEvent.type(screen.getByRole('textbox'), 'xyz')
    expect(screen.getByText(text.discover.empty)).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), film.directors[0])
    expect(screen.getByRole('heading', { name: rip.title })).toBeInTheDocument()
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
    expect(screen.getByRole('link', { name: text.catalog.imdb })).toHaveAttribute('href', film.imdb?.url)
    expect(screen.queryByText(text.catalog.rating)).not.toBeInTheDocument()
  })
  it.each([['youtube', rip], ['facebook', facebook], ['tiktok', tiktok], ['instagram', instagram]] as const)('links the %s thumbnail directly to its original post', (platform, post) => {
    page(`/discover?platform=${platform}`)
    const link = screen.getByRole('link', { name: text.catalog[platform] })
    expect(link).toHaveAttribute('href', post.externalUrl)
    expect(link).toHaveAttribute('target', '_blank')
    const source = link.querySelector('img')!.getAttribute('src')!
    if (platform === 'youtube') expect(source).toBe('https://i.ytimg.com/vi/BYCi1wH2Aug/hqdefault.jpg')
    else if (platform === 'tiktok' || platform === 'instagram') expect(source).toContain('thumbnails/')
    else expect(source).toContain('negative-plaeholder')
  })
  it('shows the Instagram Reel in the foreign category with a portrait cover', () => {
    page('/category/foreign?platform=instagram')
    expect(screen.getByRole('heading', { name: instagram.title })).toBeInTheDocument()
    expect(document.querySelector('.catalog-card')).toHaveAttribute('data-layout', 'portrait')
    expect(screen.getByRole('link', { name: text.catalog.instagram })).toHaveAttribute('href', instagram.externalUrl)
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
