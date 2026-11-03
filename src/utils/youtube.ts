export function youtubeThumbnail(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
    const host = parsed.hostname.replace(/^www\./, '')
    const id = host === 'youtu.be' ? parsed.pathname.slice(1) : host === 'youtube.com' || host === 'm.youtube.com' ? parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] : null
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
  } catch { return null }
}

