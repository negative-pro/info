import { useState } from 'react'
import PlatformIcon from './PlatformIcon'
import { contentAsset } from '../data/catalog'
import { youtubeThumbnail } from '../utils/youtube'
import { Link } from 'react-router-dom'
import placeholder from '../assets/negative-plaeholder.png'
import text from '../content/ar/texts.json'
import type { ContentItem } from '../models/content'

export default function PostThumbnail({ post, className = 'story-art' }: { post: ContentItem; className?: string }) {
  const thumbnail = contentAsset(post.thumbnailAsset ?? null) ?? (post.platform === 'youtube' ? youtubeThumbnail(post.externalUrl) : null)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const image = <><img src={thumbnail && failedSource !== thumbnail ? thumbnail : placeholder} alt="" loading="lazy" onError={() => setFailedSource(thumbnail)}/>{post.platform !== 'website' && <span className="thumbnail-platform"><PlatformIcon platform={post.platform}/><span>{text.catalog.platforms[post.platform]}</span></span>}</>
  return post.platform !== 'website' && post.externalUrl
    ? <a className={className} data-platform={post.platform} data-layout={post.videoLayout ?? (post.platform === 'tiktok' ? 'portrait' : 'landscape')} href={post.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={text.catalog[post.platform]}>{image}</a>
    : <Link className={className} to={`/story/${post.id}`} aria-label={post.title}>{image}</Link>
}
