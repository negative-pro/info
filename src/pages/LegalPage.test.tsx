import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it } from 'vitest'
import LegalPage from './LegalPage'
import { site } from '../data/site'

it.each(['/legal/impressum', '/legal/impressum?lang=en'])('renders Arabic legal information at %s', path => {
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/legal/:slug" element={<LegalPage/>}/></Routes></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('بيانات الموقع')
  expect(screen.getByRole('article')).toHaveAttribute('lang', 'ar')
  expect(screen.getByRole('article')).toHaveAttribute('dir', 'rtl')
  expect(screen.queryByRole('button', { name: 'English' })).not.toBeInTheDocument()
  expect(screen.getByText(`اسم المشغّل: ${site.brand}.`)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: site.email })).toHaveAttribute('href', `mailto:${site.email}`)
})
