import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
afterEach(cleanup)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  })
}
