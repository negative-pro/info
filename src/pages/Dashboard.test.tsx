import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'
import { allItems } from '../data/catalog'
import text from '../content/ar/texts.json'
const labels = text.dashboard
const item = allItems.find(post => !post.hidden)!
afterEach(() => vi.unstubAllGlobals())
it('filters all content and saves visibility changes', async () => {
  const request = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', request)
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  expect(screen.getByRole('link', { name: labels.add })).toHaveAttribute('href', '/dashboard/new')
  await userEvent.type(screen.getByRole('searchbox'), item.title)
  expect(document.querySelectorAll('.dashboard-list h2')).toHaveLength(1)
  await userEvent.click(screen.getByRole('button', { name: `${labels.hide}: ${item.title}` }))
  expect(request).toHaveBeenCalledWith(expect.stringContaining('__local/content'), expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ id: item.id, hidden: true }) }))
  await userEvent.selectOptions(screen.getByLabelText(labels.status), 'visible')
  expect(screen.getByText(labels.empty)).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByLabelText(labels.status), 'hidden')
  await userEvent.click(screen.getByRole('button', { name: `${labels.show}: ${item.title}` }))
  expect(screen.getByText(labels.empty)).toBeInTheDocument()
})
it('keeps visibility unchanged when saving fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: `${labels.hide}: ${item.title}` }))
  expect(screen.getByRole('alert')).toHaveTextContent(labels.error)
  expect(screen.getByRole('button', { name: `${labels.hide}: ${item.title}` })).toBeEnabled()
})
