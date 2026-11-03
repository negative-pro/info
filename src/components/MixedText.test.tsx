import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import MixedText from './MixedText'
import { items } from '../data/catalog'

it('keeps an Arabic heading RTL while isolating its English title and year', () => {
  const title = items.find(post => post.id === 'item-a70493ee-5758-4166-8b18-c28546bbc1a7')!.title
  const { container } = render(<h3 dir="rtl"><MixedText>{title}</MixedText></h3>)
  expect(screen.getByRole('heading')).toHaveAttribute('dir', 'rtl')
  expect(screen.getByRole('heading')).toHaveTextContent(title)
  const phrase = container.querySelector('bdi')
  expect(phrase).toHaveAttribute('dir', 'ltr')
  expect(phrase).toHaveTextContent('The Rip (2026)')
  expect(phrase?.textContent).not.toContain(':')
})
