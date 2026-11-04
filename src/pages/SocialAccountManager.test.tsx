import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import SocialAccountManager from './SocialAccountManager'
import accounts from '../content/ar/social-accounts.json'
import text from '../content/ar/texts.json'
import type { SocialAccount } from '../models/content'
const labels = text.dashboard
const account: SocialAccount = accounts[0]!
afterEach(() => vi.unstubAllGlobals())
it('saves numbers and visibility independently and allows clearing a statistic', async () => {
  const request = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => ({ ok: true, json: async () => ({ ...account, ...JSON.parse(options.body as string) }) }))
  vi.stubGlobal('fetch', request)
  render(<SocialAccountManager/>)
  const form = within(screen.getByRole('form', { name: account.name }))
  const subscribers = form.getByLabelText(text.social.subscribers)
  await userEvent.clear(subscribers)
  await userEvent.type(subscribers, '2500')
  await userEvent.click(form.getByRole('button', { name: labels.social.save }))
  expect(JSON.parse(request.mock.lastCall![1].body)).toMatchObject({ id: account.id, subscriberCount: 2500 })
  expect(form.getByRole('status')).toHaveTextContent(labels.social.saved)
  const action = account.hidden ? labels.show : labels.hide
  await userEvent.click(form.getByRole('button', { name: `${action}: ${account.name}` }))
  expect(JSON.parse(request.mock.lastCall![1].body)).toEqual({ id: account.id, hidden: !account.hidden })
  expect(form.getByRole('button', { name: `${account.hidden ? labels.hide : labels.show}: ${account.name}` })).toBeEnabled()
  await userEvent.clear(subscribers)
  await userEvent.click(form.getByRole('button', { name: labels.social.save }))
  expect(JSON.parse(request.mock.lastCall![1].body).subscriberCount).toBeNull()
})
it('shows save errors without changing the displayed visibility', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<SocialAccountManager/>)
  const form = within(screen.getByRole('form', { name: account.name }))
  const action = account.hidden ? labels.show : labels.hide
  await userEvent.click(form.getByRole('button', { name: `${action}: ${account.name}` }))
  expect(form.getByRole('alert')).toHaveTextContent(labels.social.error)
  expect(form.getByRole('button', { name: `${action}: ${account.name}` })).toBeEnabled()
})
