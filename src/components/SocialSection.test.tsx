import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import SocialSection from './SocialSection'
import youtubeIcon from '../assets/social/youtube.svg'
import accounts from '../content/ar/social-accounts.json'
import text from '../content/ar/texts.json'

it('opens configured accounts in a new tab and uses the platform asset', () => {
  const account = { ...accounts[0], url: 'https://www.youtube.com/@negative' }
  render(<SocialSection accounts={[account]}/>)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', account.url)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(link.querySelector('.social-icon')?.getAttribute('style')).toContain(youtubeIcon)
})
it('shows supplied statistics and a localized community invitation', () => {
  const account = { ...accounts[1], followerCount: 12000, monthlyVisitors: 25000, statsUpdatedAt: '2026-11-03' }
  render(<SocialSection accounts={[account]}/>)
  expect(screen.getByText(account.communityText)).toBeInTheDocument()
  expect(screen.getByText(new Intl.NumberFormat('ar').format(12000))).toBeInTheDocument()
  expect(screen.getByText(new Intl.NumberFormat('ar').format(25000))).toBeInTheDocument()
  expect(screen.getByText(text.social.monthlyVisitors)).toBeInTheDocument()
  expect(document.querySelector('time')).toHaveAttribute('dateTime', account.statsUpdatedAt)
})
it('supports subscribers and leaves absent statistics hidden', () => {
  render(<SocialSection accounts={[{ ...accounts[0], subscriberCount: 1000 }]}/>)
  expect(screen.getByText(text.social.subscribers)).toBeInTheDocument()
  expect(screen.queryByText(text.social.followers)).not.toBeInTheDocument()
  expect(screen.queryByText(text.social.monthlyVisitors)).not.toBeInTheDocument()
})
it('uses generic community copy when numbers and links are missing', () => {
  render(<SocialSection accounts={[{ ...accounts[3], url: null, followerCount: null, subscriberCount: null, monthlyVisitors: null }]}/>)
  expect(screen.getByText(accounts[3].communityText)).toBeInTheDocument()
  expect(screen.getByText(text.social.unconfigured)).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
it('does not render an incomplete or unsafe account URL as a link', () => {
  render(<SocialSection accounts={[{ ...accounts[0], url: 'javascript:alert(1)' }]}/>)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

it('omits hidden accounts and omits the section when every account is hidden', () => {
  const { rerender } = render(<SocialSection accounts={[{ ...accounts[0], hidden: true }, accounts[1]]}/>)
  expect(screen.queryByText(accounts[0].name)).not.toBeInTheDocument()
  expect(screen.getByText(accounts[1].name)).toBeInTheDocument()
  rerender(<SocialSection accounts={[{ ...accounts[0], hidden: true }]}/>)
  expect(document.querySelector('#social')).toBeNull()
})
