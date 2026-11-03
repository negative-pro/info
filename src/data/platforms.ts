import youtube from '../assets/social/youtube.svg'
import facebook from '../assets/social/facebook.svg'
import instagram from '../assets/social/instagram.svg'
import tiktok from '../assets/social/tiktok.svg'

export const platformIds = ['youtube', 'facebook', 'instagram', 'tiktok'] as const
export const platformIcons = { youtube, facebook, instagram, tiktok }
export type PlatformId = (typeof platformIds)[number]
