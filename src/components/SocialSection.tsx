import { ArrowUpLeft } from 'lucide-react'
import text from '../content/ar/texts.json'
import accountData from '../content/ar/social-accounts.json'
import type { SocialAccount } from '../models/content'
import youtubeIcon from '../assets/social/youtube.svg'
import instagramIcon from '../assets/social/instagram.svg'
import tiktokIcon from '../assets/social/tiktok.svg'
import facebookIcon from '../assets/social/facebook.svg'

const platformIcons: Record<string, string> = {
  youtube: youtubeIcon,
  instagram: instagramIcon,
  tiktok: tiktokIcon,
  facebook: facebookIcon,
}
const numberFormat = new Intl.NumberFormat('ar', { maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('ar', { dateStyle: 'medium' })
const hasCount = (count: number | null) => count !== null && Number.isFinite(count) && count >= 0

export default function SocialSection({ accounts = accountData }: { accounts?: SocialAccount[] }) {
  return <section className="social-section" id="social">
    <div className="section-heading"><div><h2>{text.social.title}</h2><p>{text.social.description}</p></div></div>
    <div className="social-grid">{accounts.map(account => {
      const subscribers = hasCount(account.subscriberCount)
      const followers = hasCount(account.followerCount)
      const parsedDate = account.statsUpdatedAt ? new Date(account.statsUpdatedAt) : null
      const updatedAt = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null
      let url: string | null = null
      try { if (account.url && new URL(account.url).protocol === 'https:') url = account.url } catch { /* Keep incomplete configuration non-clickable. */ }
      const icon = platformIcons[account.id]
      const content = <>
        <div className="social-card-top">
          <span className="social-icon-badge">{icon && <span className="social-icon" style={{ maskImage: `url("${icon}")`, WebkitMaskImage: `url("${icon}")` }} aria-hidden="true"/>}</span>
          <div className="social-name"><strong>{account.name}</strong><small>{account.description}</small></div>
        </div>
        <div className="social-card-body">
          <dl className="social-stats">
            {subscribers && <div><dt>{text.social.subscribers}</dt><dd dir="ltr">{numberFormat.format(account.subscriberCount!)}</dd></div>}
            {followers && <div><dt>{text.social.followers}</dt><dd dir="ltr">{numberFormat.format(account.followerCount!)}</dd></div>}
            {hasCount(account.monthlyVisitors) && <div className="social-monthly"><dt>{text.social.monthlyVisitors}</dt><dd dir="ltr">{numberFormat.format(account.monthlyVisitors!)}</dd></div>}
          </dl>
          <p className="social-community">{account.communityText}</p>
          {updatedAt && <small className="social-updated">{text.social.updatedAt}: <time dateTime={account.statsUpdatedAt!}>{dateFormat.format(updatedAt)}</time></small>}
        </div>
        <div className="social-card-footer"><span>{url ? text.social.visitAccount : text.social.unconfigured}</span>{url && <span className="social-arrow"><ArrowUpLeft size={16}/></span>}</div>
      </>
      return url
        ? <a key={account.id} className={`social-card ${account.id}`} href={url} target="_blank" rel="noopener noreferrer">{content}</a>
        : <div key={account.id} className={`social-card ${account.id}`}>{content}</div>
    })}</div>
  </section>
}
