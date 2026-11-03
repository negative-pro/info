import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Appearance from './Appearance'
import text from '../content/ar.json'

let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> }
beforeEach(() => {
  localStorage.clear()
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  vi.mocked(window.matchMedia).mockReturnValue(media as unknown as MediaQueryList)
})
describe('appearance preference', () => {
  it('defaults to system and follows live system changes', () => {
    render(<Appearance/>)
    expect(screen.getByRole('button', { name: text.appearance.system })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.dataset.theme).toBe('light')
    media.matches = true
    act(() => media.addEventListener.mock.calls[0][1]())
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
  it('persists an override, ignores system changes, and can return to system', async () => {
    media.matches = true
    const view = render(<Appearance/>)
    await userEvent.click(screen.getByRole('button', { name: text.appearance.light }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('negative-theme')).toBe('light')
    act(() => media.addEventListener.mock.calls.at(-1)?.[1]())
    expect(document.documentElement.dataset.theme).toBe('light')
    view.unmount()
    render(<Appearance/>)
    expect(screen.getByRole('button', { name: text.appearance.light })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: text.appearance.dark }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: text.appearance.system }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('negative-theme')).toBe('system')
  })
  it('falls back to system for an invalid stored preference', () => {
    localStorage.setItem('negative-theme', 'invalid')
    render(<Appearance/>)
    expect(screen.getByRole('button', { name: text.appearance.system })).toHaveAttribute('aria-pressed', 'true')
  })
})
