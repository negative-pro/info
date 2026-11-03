import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import LocalEditor from './LocalEditor'
import text from '../content/ar/texts.json'

const labels = text.editor
afterEach(() => vi.unstubAllGlobals())
it('submits the draft and shows a saved-file confirmation', async () => {
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'new-post', file: 'src/content/ar/arabic-movies.json' }) })
  vi.stubGlobal('fetch', request)
  render(<MemoryRouter><LocalEditor/></MemoryRouter>)
  await userEvent.type(screen.getByLabelText(`${labels.titleLabel} *`), 'A real title')
  await userEvent.type(screen.getByLabelText(`${labels.externalUrl} *`), 'https://www.youtube.com/watch?v=BYCi1wH2Aug')
  await userEvent.click(screen.getByRole('button', { name: labels.save }))
  await waitFor(() => expect(request).toHaveBeenCalledOnce())
  const body = JSON.parse(request.mock.calls[0][1].body)
  expect(body.item).not.toHaveProperty('id')
  expect(body).not.toHaveProperty('thumbnailUpload')
  expect(body.item).not.toHaveProperty('thumbnailAsset')
  expect(document.querySelector('input[type=file]')).toBeNull()
  expect(document.querySelector('[name=id]')).toBeNull()
  expect(document.querySelector('[name=newProductionId]')).toBeNull()
  expect(body.categoryId).toBe('arabic')
  expect(body.item.title).toBe('A real title')
  expect(screen.getByRole('status')).toHaveTextContent('src/content/ar/arabic-movies.json')
  expect(screen.getByRole('link', { name: labels.viewPost })).toHaveAttribute('href', '/story/new-post')
})
it('preserves a draft when saving fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'saveFailed' }) }))
  render(<MemoryRouter><LocalEditor/></MemoryRouter>)
  await userEvent.type(screen.getByLabelText(`${labels.titleLabel} *`), 'Keep this draft')
  await userEvent.type(screen.getByLabelText(`${labels.externalUrl} *`), 'https://www.youtube.com/watch?v=BYCi1wH2Aug')
  await userEvent.click(screen.getByRole('button', { name: labels.save }))
  expect(await screen.findByRole('alert')).toHaveTextContent(labels.errors.saveFailed)
  expect(screen.getByLabelText(`${labels.titleLabel} *`)).toHaveValue('Keep this draft')
})

it('submits embedded work metadata and shows fields for the selected work type', async () => {
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'series-review', file: 'src/content/ar/arabic-movies.json' }) })
  vi.stubGlobal('fetch', request)
  render(<MemoryRouter><LocalEditor/></MemoryRouter>)
  await userEvent.type(screen.getByLabelText(`${labels.titleLabel} *`), 'Series review')
  await userEvent.type(screen.getByLabelText(`${labels.externalUrl} *`), 'https://www.youtube.com/watch?v=BYCi1wH2Aug')
  await userEvent.selectOptions(screen.getByLabelText(labels.productionMode), 'new')
  expect(screen.getByLabelText(labels.runtimeMinutes)).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByLabelText(labels.type), 'series')
  expect(screen.queryByLabelText(labels.runtimeMinutes)).toBeNull()
  expect(screen.queryByLabelText(labels.partNumber)).toBeNull()
  await userEvent.type(screen.getByLabelText(`${labels.productionTitle} *`), 'Series')
  await userEvent.type(screen.getByLabelText(labels.seasonCount), '4')
  await userEvent.type(screen.getByLabelText(labels.seasonNumber), '2')
  await userEvent.type(screen.getByLabelText(labels.cast, { exact: false }), 'Actor A, Actor B')
  await userEvent.type(screen.getByLabelText(labels.genres, { exact: false }), 'Mystery')
  await userEvent.type(screen.getByLabelText(labels.synopsis), 'Plot summary')
  await userEvent.click(screen.getByRole('button', { name: labels.save }))
  await waitFor(() => expect(request).toHaveBeenCalledOnce())
  expect(JSON.parse(request.mock.calls[0][1].body).item.work).toMatchObject({ type: 'series', seasonCount: 4, seasonNumber: 2, runtimeMinutes: null, partNumber: null, cast: ['Actor A', 'Actor B'], genres: ['Mystery'], synopsis: 'Plot summary' })
})
