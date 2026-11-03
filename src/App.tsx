import { useEffect, useState } from 'react'
import { HashRouter, Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpLeft, Clapperboard, Music2, Camera, Play, Search, Video, MessageCircle } from 'lucide-react'
import text from './content/ar.json'
import BrandLogo from './components/BrandLogo'
import Appearance from './components/Appearance'
import './App.css'

type Story = (typeof text.cards)[number]
const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.svg`
const socialIcons = [Video, Camera, Music2, MessageCircle]
const currentYear = new Date().getFullYear()

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
function Header() {
  return <header className="header"><div className="nav-wrap"><Link to="/" className="brand" aria-label={text.brand}><BrandLogo/></Link><nav aria-label={text.nav.label}>{(['home', 'discover', 'about'] as const).map((key) => <NavLink key={key} to={key === 'home' ? '/' : `/${key}`} end>{text.nav[key]}</NavLink>)}</nav><div className="header-tools"><Appearance/><Link className="follow-link" to="/about#social">{text.nav.follow}<ArrowUpLeft size={15}/></Link></div></div></header>
}
function StoryCard({ story }: { story: Story }) {
  return <Link className="story-card" to={`/story/${story.id}`}><div className={`story-art ${story.art}`}><img src={art(story.art)} alt="" loading="lazy"/><span className="art-category">{story.genre}</span><span className="round-arrow"><ArrowUpLeft size={20}/></span></div><div className="story-meta">{story.label}<span>•</span>{story.region}</div><h3>{story.title}</h3><p>{story.description}</p></Link>
}
function SocialSection() {
  return <section className="social-section" id="social"><div className="section-heading"><div><span className="eyebrow">{text.nav.follow}</span><h2>{text.social.title}</h2><p>{text.social.description}</p></div></div><div className="social-grid">{text.social.platforms.map((platform, i) => { const Icon = socialIcons[i]; const content = <><Icon size={24}/><div><strong dir="ltr">{platform.latin}</strong><small>{platform.description}</small></div>{platform.url ? <ArrowUpLeft size={18}/> : <span className="soon">{text.social.unconfigured}</span>}</>; return platform.url ? <a key={platform.id} className={`social-card ${platform.id}`} href={platform.url} target="_blank" rel="noreferrer">{content}</a> : <div key={platform.id} className={`social-card ${platform.id}`}>{content}</div> })}</div></section>
}
function Home() {
  return <><section className="intro"><span className="eyebrow"><span className="green-dot"/>{text.home.eyebrow}</span><h1>{text.home.title}<br/><span>{text.home.accent}</span></h1><p>{text.home.description}</p><div className="hero-actions"><Link to="/discover" className="button primary">{text.home.explore}<ArrowLeft size={17}/></Link><Link to="/about#social" className="text-link">{text.nav.follow}<ArrowUpLeft size={16}/></Link></div></section><section className="feature"><img className="feature-image" src={art('cosmos')} alt=""/><div className="feature-shade"/><div className="feature-top"><span className="glass-label"><span className="green-dot"/>{text.home.featured}</span><span className="feature-index" dir="ltr">M / 001</span></div><div className="feature-content"><span className="feature-tag">{text.home.featureTag}</span><h2>{text.home.featureTitle}</h2><p>{text.home.featureDescription}</p><Link className="button light" to="/story/distant-worlds"><Play size={15} fill="currentColor"/>{text.home.featureAction}</Link></div><span className="vertical-note" dir="ltr">A DIFFERENT PERSPECTIVE</span></section><section className="stories-section"><div className="section-heading"><div><span className="eyebrow">{text.home.sample}</span><h2>{text.home.latest}</h2><p>{text.home.latestDescription}</p></div><Link className="text-link" to="/discover">{text.home.all}<ArrowLeft size={17}/></Link></div><div className="story-grid">{text.cards.map(story => <StoryCard key={story.id} story={story}/>)}</div></section><SocialSection/></>
}
function Discover() {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const stories = text.cards.filter(story => (category === 'all' || story.category === category) && `${story.title} ${story.description} ${story.genre} ${story.region}`.includes(query.trim()))
  return <section className="page-section"><span className="eyebrow">{text.discover.eyebrow}</span><h1>{text.discover.title}</h1><p className="page-description">{text.discover.description}</p><div className="filter-bar"><div className="tabs" aria-label={text.nav.discover}>{(['all', 'film', 'series'] as const).map(key => <button key={key} aria-pressed={category === key} className={category === key ? 'selected' : ''} onClick={() => setCategory(key)}>{text.discover[key]}</button>)}</div><label className="search"><Search size={18}/><input aria-label={text.discover.search} placeholder={text.discover.search} value={query} onChange={event => setQuery(event.target.value)}/></label></div><p className="sample-note">{text.home.sample}</p><div className="story-grid" aria-live="polite">{stories.map(story => <StoryCard key={story.id} story={story}/>)}{stories.length === 0 && <p className="empty">{text.discover.empty}</p>}</div></section>
}
function About() {
  const { hash } = useLocation()
  useEffect(() => { if (hash === '#social') document.getElementById('social')?.scrollIntoView({ behavior: 'smooth' }) }, [hash])
  return <><section className="page-section about-intro"><span className="eyebrow">{text.about.eyebrow}</span><h1>{text.about.title}</h1><p className="page-description">{text.about.description}</p><div className="values">{text.about.values.map(value => <article key={value.number}><span>{value.number}</span><h2>{value.title}</h2><p>{value.description}</p></article>)}</div></section><SocialSection/></>
}
function StoryDetail() {
  const { id } = useParams()
  const story = text.cards.find(item => item.id === id)
  if (!story) return <NotFound/>
  return <article className="page-section story-detail"><Link className="text-link" to="/discover"><ArrowLeft size={16}/>{text.detail.back}</Link><img className="detail-art" src={art(story.art)} alt=""/><span className="eyebrow">{story.label}</span><h1>{story.title}</h1><p className="page-description">{story.description}</p><div className="editorial-note">{text.detail.note}</div><Link to="/discover" className="button primary">{text.detail.related}<ArrowLeft size={16}/></Link></article>
}
function NotFound() { return <section className="page-section"><h1>{text.notFound.title}</h1><Link className="button primary" to="/">{text.notFound.action}</Link></section> }
export function Site() {
  return <><ScrollToTop/><a href="#main" className="skip-link">{text.nav.skip}</a><Header/><main id="main"><Routes><Route path="/" element={<Home/>}/><Route path="/discover" element={<Discover/>}/><Route path="/about" element={<About/>}/><Route path="/story/:id" element={<StoryDetail/>}/><Route path="*" element={<NotFound/>}/></Routes></main><footer><Link className="footer-brand" to="/" aria-label={text.brand}><BrandLogo/><span>{text.footer.description}</span></Link><small>© {currentYear} {text.footer.copyright}</small><span className="footer-reel"><Clapperboard size={18}/>{text.tagline}</span></footer></>
}
export default function App() { return <HashRouter><Site/></HashRouter> }
