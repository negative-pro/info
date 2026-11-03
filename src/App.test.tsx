import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Site } from './App'
import text from './content/ar.json'

function page(path = '/') { return render(<MemoryRouter initialEntries={[path]}><Site/></MemoryRouter>) }
describe('Arabic website', () => {
  it('renders the home page and navigates to discover', async () => {
    page()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.home.title)
    await userEvent.click(screen.getByRole('link', { name: text.home.explore }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.discover.title)
  })
  it('filters stories by category and search, including an empty result', async () => {
    page('/discover')
    await userEvent.click(screen.getByRole('button', { name: text.discover.series }))
    expect(screen.getByRole('heading', { name: text.cards[1].title })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: text.cards[0].title })).not.toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox'), 'xyz')
    expect(screen.getByText(text.discover.empty)).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.click(screen.getByRole('button', { name: text.discover.all }))
    await userEvent.type(screen.getByRole('textbox'), text.cards[0].genre)
    expect(screen.getByRole('heading', { name: text.cards[0].title })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: text.cards[1].title })).not.toBeInTheDocument()
  })
  it('opens the correct editorial detail from a card', async () => {
    page('/discover')
    await userEvent.click(screen.getByRole('heading', { name: text.cards[0].title }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.cards[0].title)
    expect(screen.getByText(text.detail.note)).toBeInTheDocument()
  })
  it('shows an honest placeholder for unconfigured social accounts', () => {
    page('/about')
    expect(screen.getAllByText(text.social.unconfigured)).toHaveLength(4)
    expect(document.querySelector('a[href="null"]')).toBeNull()
  })
  it.each(['/unknown', '/story/unknown'])('handles unknown route %s', path => {
    page(path)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text.notFound.title)
  })
})
