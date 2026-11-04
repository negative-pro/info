import { useState } from 'react'
import PlatformIcon from './PlatformIcon'
import { contentAsset } from '../data/catalog'
import { youtubeThumbnail } from '../utils/youtube'
import { Link } from 'react-router-dom'
import placeholder from '../assets/placeholders/content-placeholder.png'
import text from '../content/ar/texts.json'
import type { ContentItem } from '../models/content'

function platformEmbed(post: ContentItem): string | null {
  if (!post.externalUrl || post.kind !== 'video') return null
  try {
    const url = new URL(post.externalUrl)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.replace(/^www\./, '')
    if (post.platform === 'tiktok' && host === 'tiktok.com') {
      const id = url.pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/)?.[1]
      return id ? `https://www.tiktok.com/player/v1/${id}?autoplay=0&description=0&music_info=0&controls=0&play_button=0&closed_caption=0` : null
    }
    if (post.platform === 'instagram' && host === 'instagram.com') {
      const match = url.pathname.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)\/?$/)
      return match ? `https://www.instagram.com/p/${match[2]}/embed/` : null
    }
  } catch { /* Invalid links use the image fallback. */ }
  return null
}

export default function PostThumbnail({ post, className = 'story-art' }: { post: ContentItem; className?: string }) {
  const thumbnail = contentAsset(post.thumbnailAsset ?? null) ?? (post.platform === 'youtube' ? youtubeThumbnail(post.externalUrl) : null)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const embed = platformEmbed(post)
  if (embed) {
    return <div className={`${className} platform-preview`} data-platform={post.platform} data-layout={post.videoLayout ?? 'portrait'}>
      <iframe src={embed} title={`${text.catalog.platforms[post.platform]} — ${post.title}`} loading="lazy" allow="fullscreen; picture-in-picture; encrypted-media" allowFullScreen/>
      <a className="platform-preview-link" href={post.externalUrl!} target="_blank" rel="noopener noreferrer" aria-label={text.catalog[post.platform]}><PlatformIcon platform={post.platform}/>{text.catalog[post.platform]}</a>
    </div>
  }
  const image = <><img src={thumbnail && failedSource !== thumbnail ? thumbnail : placeholder} alt="" loading="lazy" onError={() => setFailedSource(thumbnail)}/>{post.platform !== 'website' && <span className="thumbnail-platform"><PlatformIcon platform={post.platform}/><span>{text.catalog.platforms[post.platform]}</span></span>}</>
  return post.platform !== 'website' && post.externalUrl
    ? <a className={className} data-platform={post.platform} data-layout={post.videoLayout ?? (post.platform === 'tiktok' ? 'portrait' : 'landscape')} href={post.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={text.catalog[post.platform]}>{image}</a>
    : <Link className={className} to={`/story/${post.id}`} aria-label={post.title}>{image}</Link>
}
