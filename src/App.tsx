import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpLeft, Clapperboard, FileText, Search, X } from 'lucide-react'
import text from './content/ar/texts.json'
import BrandLogo from './components/BrandLogo'
import MixedText from './components/MixedText'
import PostThumbnail from './components/PostThumbnail'
import Appearance from './components/Appearance'
import LegalPage from './pages/LegalPage'
import legal from './content/ar/legal.json'
import SocialSection from './components/SocialSection'
import { categories, items, providers, providerIcon } from './data/catalog'
import type { CatalogItem, WorkDetails } from './models/content'
import negativePlaceholder from './assets/placeholders/content-placeholder.png'
import homeBanner from './assets/backgrounds/home-banner.png'
import { matchesSearch } from './utils/search'
import './App.css'

const Dashboard = import.meta.env.DEV ? lazy(() => import('./pages/Dashboard')) : null
const LocalEditor = import.meta.env.DEV ? lazy(() => import('./pages/LocalEditor')) : null
const currentYear = new Date().getFullYear()

function ScrollRestoration() {
  const { pathname } = useLocation()
  const positions = useRef(new Map<string, number>())
  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = previous }
  }, [])
  useLayoutEffect(() => {
    const savedPositions = positions.current
    window.scrollTo({ top: savedPositions.get(pathname) ?? 0, left: 0, behavior: 'instant' })
    return () => { savedPositions.set(pathname, window.scrollY) }
  }, [pathname])
  return null
}
function Header() {
  function scrollToTop(event: MouseEvent<HTMLAnchorElement>) {
    const target = new URL(event.currentTarget.href).hash.replace(/^#/, '') || new URL(event.currentTarget.href).pathname
    if (target === pathname && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) window.scrollTo(0, 0)
  }
  const { pathname } = useLocation()
  const inDiscover = pathname === '/discover' || pathname.startsWith('/category/') || pathname.startsWith('/story/')
  return <header className="header"><div className="nav-wrap"><Link to="/" onClick={scrollToTop} className="brand" aria-label={text.brand}><BrandLogo/></Link><nav aria-label={text.nav.label}>{(['home', 'discover', 'about'] as const).map((key) => key === 'discover' ? <Link key={key} onClick={scrollToTop} to="/discover" className={inDiscover ? 'active' : undefined} aria-current={inDiscover ? 'page' : undefined}>{text.nav[key]}</Link> : <NavLink key={key} onClick={scrollToTop} to={key === 'home' ? '/' : `/${key}`} end>{text.nav[key]}</NavLink>)}</nav></div></header>
}
function StoryCard({ story }: { story: CatalogItem }) {
  const category = categories.find(item => item.id === story.categoryId)
  return <article className="catalog-card" data-layout={story.videoLayout ?? 'landscape'}>
    <PostThumbnail post={story}/>
    <Link className="story-card" to={`/story/${story.id}`}>
      <div className="story-meta"><span>{category?.name}</span><span aria-hidden="true">•</span><span>{story.kind === 'video' ? text.catalog.videos : text.catalog.posts}</span></div>
      <h3 dir="rtl" aria-label={story.title}><MixedText>{story.title}</MixedText></h3>
      {story.description && <p className="card-description"><MixedText>{story.description}</MixedText></p>}
    </Link>
    <div className="card-provider-footer"><ExternalLink post={story}/><Link className="text-link card-read-more" to={`/story/${story.id}`}>{text.catalog.readMore}<FileText size={14} aria-hidden="true"/></Link></div>
  </article>
}
function ExternalLink({ post }: { post: CatalogItem }) {
  if (post.platform === 'website') return null
  return post.externalUrl ? <a className="text-link external-link" href={post.externalUrl} target="_blank" rel="noopener noreferrer">{text.catalog[post.platform]}<ArrowUpLeft size={16}/></a> : <p className="pending-link">{text.catalog.pending}</p>
}
function CategoryLinks() {
  return <section className="category-section"><div className="section-heading"><div><h2>{text.catalog.title}</h2><p>{text.catalog.description}</p></div></div><div className="category-grid">{categories.map(category => <Link key={category.id} to={`/category/${category.slug}`} className="category-card"><img src={negativePlaceholder} alt="" loading="lazy"/><div><h3>{category.name}</h3><p>{category.description}</p><span className="text-link">{text.catalog.exploreCategory}<ArrowLeft size={16}/></span></div></Link>)}</div></section>
}
function Home() {
  return <>
    <section className="intro">
      <h1>{text.home.title}<br/><span>{text.home.accent}</span></h1>
      <p>{text.home.description}</p>
    </section>
    <div className="home-banner">
      <img src={homeBanner} alt={`${text.brandLatin} — ${text.tagline}`} fetchPriority="high"/>
    </div>
    <CategoryLinks/>
    <section className="stories-section"><div className="section-heading"><div><h2>{text.home.latest}</h2><p>{text.home.latestDescription}</p></div><Link className="text-link" to="/discover">{text.home.all}<ArrowLeft size={17}/></Link></div><div className="story-grid home-story-grid">{items.slice(0, 8).map(story => <StoryCard key={story.id} story={story}/>)}<Link className="catalog-card more-stories-card" to="/discover"><Clapperboard size={36}/><h3>{text.home.moreStories}</h3><ArrowLeft size={24}/></Link></div></section>
    <SocialSection/>
  </>
}
function Discover() {
  const { categorySlug } = useParams()
  const [params, setParams] = useSearchParams()
  const category = categories.find(item => item.slug === categorySlug)
  const typeParam = params.get('type')
  const type = typeParam === 'film' || typeParam === 'series' ? typeParam : 'all'
  const query = params.get('q') ?? ''
  if (categorySlug && !category) return <NotFound/>
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.delete('kind')
    next.delete('platform')
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  const visible = items.filter(post => {
    const production = post.work
    const fields = [post.title, post.description, ...post.body, production?.title, production?.originalTitle, production?.year, production?.synopsis, production?.franchise, ...(production?.cast ?? []), ...(production?.genres ?? []), ...(production?.countries ?? []), ...(production?.languages ?? []), categories.find(item => item.id === post.categoryId)?.name, text.catalog.platforms[post.platform], ...(production?.directors ?? []), ...(production?.writers ?? []), ...(production?.editors ?? []), ...(production?.providerIds ?? []), ...(production?.providerIds ?? []).map(id => providers.find(provider => provider.id === id)?.name)]
    return (!category || post.categoryId === category.id) && (type === 'all' || post.work?.type === type) && matchesSearch(query, fields)
  })
  return <section className="page-section discover-page">
    <div className="discover-header">
      <div className="discover-heading"><h1>{category?.name ?? text.discover.title}</h1><p className="page-description">{category?.description ?? text.catalog.description}</p></div>
      <div className="discover-search"><div className="search" role="search"><Search size={18} aria-hidden="true"/><input aria-label={text.discover.search} placeholder={text.discover.search} value={query} dir="rtl" inputMode="search" enterKeyHint="search" autoComplete="off" onChange={event => update('q', event.target.value)}/>{query && <button className="clear-search" type="button" aria-label={text.discover.clearSearch} onClick={() => update('q', '')}><X size={16}/></button>}</div></div>
    </div>
    <div className="discover-controls">
    <nav className="category-nav" aria-label={text.catalog.categories}><NavLink to={{ pathname: '/discover', search: params.toString() }} end>{text.catalog.allCategories}</NavLink>{categories.map(item => <NavLink key={item.id} to={{ pathname: `/category/${item.slug}`, search: params.toString() }}>{item.name}</NavLink>)}</nav>
    <div className="filter-bar">
      <div className="tabs work-type-tabs" role="group" aria-label={text.discover.typeFilter}>{(['all', 'film', 'series'] as const).map(value => <button key={value} aria-pressed={type === value} className={type === value ? 'selected' : ''} onClick={() => update('type', value === 'all' ? '' : value)}>{text.discover[value]}</button>)}</div>

    </div>
    </div>
    <section className="content-group" aria-live="polite" aria-label={text.home.latest}>{visible.length > 0 ? <div className="story-grid discover-story-grid">{visible.map(story => <StoryCard key={story.id} story={story}/>)}</div> : <p className="empty">{query.trim() ? text.discover.empty : text.discover.emptyType}</p>}</section>
  </section>
}
function About() {
  const { hash } = useLocation()
  useEffect(() => { if (hash === '#social') document.getElementById('social')?.scrollIntoView({ behavior: 'smooth' }) }, [hash])
  return <><section className="page-section about-intro"><div className="about-opening"><div className="about-statement"><div className="about-frame-mark" aria-hidden="true"><Clapperboard size={24}/><span>NEGATIVE</span></div><h1>{text.about.title}</h1><div className="about-quote"><span aria-hidden="true">“</span><p>{text.about.note}</p></div></div><div className="about-introduction"><p className="page-description">{text.about.description}</p><Link className="button primary" to="/discover">{text.about.explore}<ArrowLeft size={16}/></Link></div></div><div className="values">{text.about.values.map(value => <article key={value.number}><span className="about-value-number" aria-hidden="true">{value.number}</span><div className="about-value-copy"><h2>{value.title}</h2><p>{value.description}</p></div></article>)}</div></section><SocialSection/></>
}
function ProductionDetails({ production }: { production: WorkDetails }) {
  const rows = [
    [text.catalog.year, production.year],
    [text.catalog.partNumber, production.type === 'film' ? production.partNumber ?? null : null],
    [text.catalog.seasonCount, production.type === 'series' ? production.seasonCount ?? null : null],
    [text.catalog.type, text.discover[production.type]],
    [text.catalog.seasonNumber, production.type === 'series' ? production.seasonNumber ?? null : null],
    [text.catalog.runtimeMinutes, production.type === 'film' ? production.runtimeMinutes ?? null : null],
    [text.catalog.franchise, production.franchise ?? null],
    [text.catalog.cast, production.cast?.join('، ') ?? null],
    [text.catalog.countries, production.countries?.join('، ') ?? null],
    [text.catalog.languages, production.languages?.join('، ') ?? null],
    [text.catalog.directors, production.directors.join('، ')],
    [text.catalog.writers, production.writers.join('، ')],
    [text.catalog.editors, production.editors.join('، ')],
  ].filter(([, value]) => value !== null && value !== '')
  return <section className="production-details"><h2><Clapperboard size={18} aria-hidden="true"/>{text.catalog.details}</h2>{production.synopsis && <div className="metadata-section"><h3>{text.catalog.synopsis}</h3><p><MixedText>{production.synopsis}</MixedText></p></div>}<dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{!!production.genres?.length && <div><dt>{text.catalog.genres}</dt><dd><ul className="genre-tags">{production.genres.map((genre, index) => <li key={`${genre}-${index}`}><MixedText>{genre}</MixedText></li>)}</ul></dd></div>}</dl></section>
}
function StoryDetail() {
  const { id } = useParams()
  const story = items.find(item => item.id === id)
  if (!story) return <NotFound/>
  const category = categories.find(item => item.id === story.categoryId)
  const production = story.work
  return <article className="page-section story-detail">
    <Link className="text-link" to={category ? `/category/${category.slug}` : '/discover'}><ArrowLeft size={16}/>{text.catalog.back}</Link>
    <div className="story-overview">
      <PostThumbnail key={story.id} post={story} className="detail-art"/>
      <div className="story-summary">
        {story.publishedAt && <div className="story-detail-meta"><time dateTime={story.publishedAt}>{new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(story.publishedAt))}</time></div>}
        <h1 dir="rtl" aria-label={story.title}><MixedText>{story.title}</MixedText></h1>
        <p className="page-description"><MixedText>{[story.description, ...story.body].filter(Boolean).join(" ")}</MixedText></p>
        <div className="story-primary-action"><ExternalLink post={story}/>{production?.providerIds.map(id => {
          const provider = providers.find(item => item.id === id)
          const icon = provider ? providerIcon(provider.iconAsset) : null
          return provider ? <a key={id} className="streaming-action" href={provider.websiteUrl} target="_blank" rel="noopener noreferrer">{icon && <img src={icon} alt=""/>}<span>{text.catalog.watchOn} <bdi>{provider.name}</bdi></span><ArrowUpLeft size={15}/></a> : null
        })}</div>
        {story.isDemo && <div className="editorial-note">{text.catalog.demo}</div>}
      </div>
    </div>
    {production && <ProductionDetails production={production}/>}
    <Link to="/discover" className="button primary">{text.detail.related}<ArrowLeft size={16}/></Link>
  </article>
}
function NotFound() { return <section className="page-section"><h1>{text.notFound.title}</h1><Link className="button primary" to="/">{text.notFound.action}</Link></section> }
export function Site() {
  return <><ScrollRestoration/><a href="#main" className="skip-link">{text.nav.skip}</a><Header/><main id="main"><Routes><Route path="/" element={<Home/>}/><Route path="/discover" element={<Discover/>}/><Route path="/category/:categorySlug" element={<Discover/>}/><Route path="/about" element={<About/>}/><Route path="/legal/:slug" element={<LegalPage/>}/><Route path="/story/:id" element={<StoryDetail/>}/><Route path="*" element={<NotFound/>}/>{import.meta.env.DEV && LocalEditor && <><Route path="/dashboard" element={<Suspense fallback={null}>{Dashboard && <Dashboard/>}</Suspense>}/><Route path="/dashboard/new" element={<Suspense fallback={null}><LocalEditor/></Suspense>}/><Route path="/local/add" element={<Navigate to="/dashboard/new" replace/>}/></>}</Routes></main><footer className="site-footer"><div className="footer-top"><Link className="footer-brand" to="/" aria-label={text.brand}><BrandLogo/><span>{text.footer.description}</span></Link><div className="footer-appearance"><span>{text.appearance.label}</span><Appearance/></div></div><div className="footer-bottom"><nav className="footer-links" aria-label={legal.navLabel}>{legal.pages.map(page => <Link key={page.slug} to={`/legal/${page.slug}`}>{page.title}</Link>)}</nav><small>© {currentYear} {text.footer.copyright}</small></div></footer></>
}
export default function App() { return <HashRouter><Site/></HashRouter> }
