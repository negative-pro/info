// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Buffer } from 'node:buffer'
import type { ContentItem } from '../src/models/content.ts'
import { cachePlatformThumbnail } from './platform-thumbnail.ts'

let root: string
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
const post: ContentItem = { id: 'auto-cover', work: null, kind: 'video', platform: 'instagram', title: 'Review', description: '', body: [], externalUrl: 'https://www.instagram.com/reel/test/', isDemo: false, publishedAt: null }
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'negative-cover-')) })
afterEach(async () => { vi.unstubAllGlobals(); await rm(root, { recursive: true, force: true }) })
it('caches the platform cover and decodes escaped URL parameters', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response('<meta content="https://scontent.cdninstagram.com/cover.png?a=1&amp;b=2" property="og:image">')).mockResolvedValueOnce(new Response(png, { headers: { 'Content-Type': 'image/png' } }))
  vi.stubGlobal('fetch', request)
  const asset = await cachePlatformThumbnail(root, post)
  expect(asset).toBe('thumbnails/auto-cover.png')
  expect(await readFile(join(root, 'src/assets', asset!))).toEqual(png)
  expect(request.mock.calls[1][0]).toBe('https://scontent.cdninstagram.com/cover.png?a=1&b=2')
})
it('finds the correct TikTok video cover in page metadata', async () => {
  const data = { scope: { items: [{ id: '123', video: { originCover: 'https://p16.tiktokcdn.com/cover.png' } }] } }
  const request = vi.fn().mockResolvedValueOnce(new Response(`<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify(data)}</script>`)).mockResolvedValueOnce(new Response(png))
  vi.stubGlobal('fetch', request)
  expect(await cachePlatformThumbnail(root, { ...post, platform: 'tiktok', externalUrl: 'https://www.tiktok.com/@name/video/123' })).toBe('thumbnails/auto-cover.png')
})
it('falls back when a platform denies the preview', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })))
  expect(await cachePlatformThumbnail(root, post)).toBeNull()
})
it('rejects preview redirects to unapproved hosts', async () => {
  const request = vi.fn().mockResolvedValue(new Response('', { status: 302, headers: { Location: 'http://127.0.0.1/private' } }))
  vi.stubGlobal('fetch', request)
  expect(await cachePlatformThumbnail(root, post)).toBeNull()
  expect(request).toHaveBeenCalledOnce()
})
it('does not fetch arbitrary image URLs embedded in a page', async () => {
  const request = vi.fn().mockResolvedValue(new Response('<meta property="og:image" content="https://example.com/image.png">'))
  vi.stubGlobal('fetch', request)
  expect(await cachePlatformThumbnail(root, post)).toBeNull()
  expect(request).toHaveBeenCalledOnce()
})
it('leaves YouTube thumbnail handling to the existing client resolver', async () => {
  const request = vi.fn()
  vi.stubGlobal('fetch', request)
  expect(await cachePlatformThumbnail(root, { ...post, platform: 'youtube', externalUrl: 'https://www.youtube.com/watch?v=BYCi1wH2Aug' })).toBeNull()
  expect(request).not.toHaveBeenCalled()
})
