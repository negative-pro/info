import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import PostThumbnail from './PostThumbnail'
import { items } from '../data/catalog'
import placeholder from '../assets/placeholders/content-placeholder.png'
import text from '../content/ar/texts.json'

it('falls back to the placeholder without losing the YouTube destination', () => {
  render(<PostThumbnail post={items.find(post => post.id === 'item-a70493ee-5758-4166-8b18-c28546bbc1a7')!}/>)
  const link = screen.getByRole('link', { name: text.catalog.youtube })
  const image = link.querySelector('img')!
  fireEvent.error(image)
  expect(image).toHaveAttribute('src', placeholder)
  expect(link).toHaveAttribute('href', items.find(post => post.id === 'item-a70493ee-5758-4166-8b18-c28546bbc1a7')!.externalUrl)
})

it.each([
  ['tiktok', 'https://www.tiktok.com/player/v1/7703709929189690631?autoplay=0&description=0&music_info=0&controls=0&play_button=0&closed_caption=0'],
  ['instagram', 'https://www.instagram.com/p/DfN_cwxMvGa/embed/'],
])('uses a hosted %s preview and preserves its external link', (platform, embedUrl) => {
  const post = { ...items[0], platform: platform as 'tiktok' | 'instagram', externalUrl: platform === 'tiktok' ? 'https://www.tiktok.com/@negative/video/7703709929189690631' : 'https://www.instagram.com/p/DfN_cwxMvGa/' }
  render(<PostThumbnail post={post}/>)
  const frame = screen.getByTitle(`${text.catalog.platforms[post.platform]} — ${post.title}`)
  expect(frame).toHaveAttribute('src', embedUrl)
  expect(frame).toHaveAttribute('loading', 'lazy')
  expect(screen.getByRole('link')).toHaveAttribute('href', post.externalUrl)
})

it('does not embed untrusted platform URLs', () => {
  const post = { ...items[0], platform: 'tiktok' as const }
  const { container } = render(<PostThumbnail post={{ ...post, externalUrl: 'https://tiktok.com.example.org/@name/video/123' }}/>)
  expect(container.querySelector('iframe')).toBeNull()
  expect(container.querySelector('img')).toHaveAttribute('src', placeholder)
})
