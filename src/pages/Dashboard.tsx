import { useState } from 'react'
import { Link } from 'react-router-dom'
import { allItems, categories } from '../data/catalog'
import { matchesSearch } from '../utils/search'
import text from '../content/ar/texts.json'
import MixedText from '../components/MixedText'
import './Dashboard.css'
import SocialAccountManager from './SocialAccountManager'

const labels = text.dashboard
export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [visibility, setVisibility] = useState<Record<string, boolean>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const hidden = (item: typeof allItems[number]) => visibility[item.id] ?? !!item.hidden
  const filtered = allItems.filter(item =>
    (category === 'all' || item.categoryId === category) &&
    (status === 'all' || hidden(item) === (status === 'hidden')) &&
    (type === 'all' || (item.work?.type ?? 'none') === type) && matchesSearch(query, [item.title, item.description, item.id, item.work?.title, item.work?.originalTitle, ...(item.work?.genres ?? [])]))

  async function toggle(item: typeof allItems[number]) {
    if (pending) return
    const nextHidden = !hidden(item)
    setPending(item.id); setError('')
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}__local/content`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, hidden: nextHidden }) })
      if (!response.ok) throw new Error('Save failed')
      setVisibility(current => ({ ...current, [item.id]: nextHidden }))
    } catch { setError(labels.error) } finally { setPending(null) }
  }
  return <section className="page-section dashboard">
    <div className="dashboard-heading"><div><h1>{labels.title}</h1><p className="page-description">{labels.description}</p></div><Link className="button primary" to="/dashboard/new">{labels.add}</Link></div>
    <div className="dashboard-filters">
      <label>{labels.search}<input type="search" value={query} onChange={event => setQuery(event.target.value)}/></label>
      <label>{labels.category}<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">{labels.all}</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>{labels.type}<select value={type} onChange={event => setType(event.target.value)}><option value="all">{labels.all}</option><option value="film">{text.discover.film}</option><option value="series">{text.discover.series}</option><option value="none">{labels.none}</option></select></label>
      <label>{labels.status}<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">{labels.all}</option><option value="visible">{labels.visible}</option><option value="hidden">{labels.hidden}</option></select></label>
      <button type="button" onClick={() => { setQuery(''); setCategory('all'); setStatus('all'); setType('all') }}>{labels.reset}</button>
    </div>
    {error && <p role="alert">{error}</p>}
    <p className="dashboard-count" role="status">{filtered.length} {labels.count}</p>
    <div className="dashboard-list">{filtered.map(item => <article key={item.id} className="dashboard-item">
      <div><h2><MixedText>{item.title}</MixedText></h2><p>{categories.find(value => value.id === item.categoryId)?.name} · {text.catalog.platforms[item.platform]}</p></div>
      <span className="dashboard-status" data-hidden={hidden(item)}>{hidden(item) ? labels.hidden : labels.visible}</span>
      {!hidden(item) && <Link className="text-link" to={`/story/${item.id}`}>{labels.details}</Link>}
      <button type="button" disabled={!!pending} aria-label={`${hidden(item) ? labels.show : labels.hide}: ${item.title}`} onClick={() => toggle(item)}>{pending === item.id ? labels.saving : hidden(item) ? labels.show : labels.hide}</button>
    </article>)}</div>
    {!filtered.length && <p className="empty">{labels.empty}</p>}
    <SocialAccountManager/>
  </section>
}
