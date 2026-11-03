import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import PostThumbnail from './PostThumbnail'
import { items } from '../data/catalog'
import placeholder from '../assets/negative-plaeholder.png'
import text from '../content/ar/texts.json'

it('falls back to the placeholder without losing the YouTube destination', () => {
  render(<PostThumbnail post={items.find(post => post.id === 'item-a70493ee-5758-4166-8b18-c28546bbc1a7')!}/>)
  const link = screen.getByRole('link', { name: text.catalog.youtube })
  const image = link.querySelector('img')!
  fireEvent.error(image)
  expect(image).toHaveAttribute('src', placeholder)
  expect(link).toHaveAttribute('href', items.find(post => post.id === 'item-a70493ee-5758-4166-8b18-c28546bbc1a7')!.externalUrl)
})
