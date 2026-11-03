import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Buffer } from 'node:buffer'
import type { ContentItem } from '../src/models/content.ts'

const belongsTo = (host: string, domains: string[]) => domains.some(domain => host === domain || host.endsWith(`.${domain}`))
const pageDomains = {
  facebook: ['facebook.com', 'fb.watch'],
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
}
const imageDomains = ['fbcdn.net', 'cdninstagram.com', 'tiktokcdn.com', 'tiktokcdn-eu.com', 'tiktokcdn-us.com']
const decode = (value: string) => value.replace(/&amp;/g, '&').replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code))).replace(/&quot;/g, '"')

async function download(url: string, domains: string[], maxBytes: number): Promise<{ data: Buffer; type: string; url: string }> {
  let target = url
  const signal = AbortSignal.timeout(8000)
  for (let redirects = 0; redirects < 4; redirects++) {
    const parsed = new URL(target)
    if (parsed.protocol !== 'https:' || parsed.port || parsed.username || parsed.password || !belongsTo(parsed.hostname, domains)) throw new Error('Unsupported source')
    const response = await fetch(target, { redirect: 'manual', signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      await response.body?.cancel()
      if (!location) throw new Error('Missing redirect')
      target = new URL(location, target).href
      continue
    }
    if (!response.ok || Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new Error('Unavailable preview') }
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Empty preview')
    const chunks: Uint8Array[] = []
    let length = 0
    while (true) {
      const next = await reader.read()
      if (next.done) break
      length += next.value.length
      if (length > maxBytes) { await reader.cancel(); throw new Error('Preview too large') }
      chunks.push(next.value)
    }
    return { data: Buffer.concat(chunks), type: response.headers.get('content-type') ?? '', url: target }
  }
  throw new Error('Too many redirects')
}
function imageFromHtml(html: string, videoId: string | null): string | null {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1].toLowerCase(), match[3]]))
    if ((attributes.property ?? attributes.name) === 'og:image' && attributes.content) return decode(attributes.content)
  }
  const hydration = html.match(/<script\b[^>]*\bid=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!hydration) return null
  function find(value: unknown): string | null {
    if (!value || typeof value !== 'object') return null
    const item = value as Record<string, unknown>
    if (typeof item.id === 'string' && (!videoId || item.id === videoId) && item.video && typeof item.video === 'object') {
      const video = item.video as Record<string, unknown>
      const cover = video.originCover || video.cover
      if (typeof cover === 'string') return cover
    }
    for (const child of Object.values(value)) { const found = find(child); if (found) return found }
    return null
  }
  try { return find(JSON.parse(hydration[1])) } catch { return null }
}

/** Local-development ingestion only: cache the platform's cover, never user uploads. */
export async function cachePlatformThumbnail(root: string, post: ContentItem): Promise<string | null> {
  if (!post.externalUrl || !(post.platform in pageDomains)) return null
  try {
    const domains = pageDomains[post.platform as keyof typeof pageDomains]
    const page = await download(post.externalUrl, domains, 3 * 1024 * 1024)
    const imageUrl = imageFromHtml(page.data.toString('utf8'), new URL(page.url).pathname.match(/\/video\/(\d+)/)?.[1] ?? null)
    if (!imageUrl) return null
    const image = await download(imageUrl, imageDomains, 3 * 1024 * 1024)
    const data = image.data
    // Some platforms expose an empty, almost entirely black first frame.
    // Tiny JPEG previews are left as the branded fallback rather than cached.
    let extension: string | null = null
    if (data[0] === 255 && data[1] === 216 && data[2] === 255 && data.length >= 6000) extension = 'jpg'
    else if (data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension = 'png'
    else if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') extension = 'webp'
    if (!extension) return null
    const asset = `thumbnails/${post.id}.${extension}`
    await mkdir(join(root, 'src/assets/thumbnails'), { recursive: true })
    await writeFile(join(root, 'src/assets', asset), data, { flag: 'wx' })
    return asset
  } catch { return null }
}
