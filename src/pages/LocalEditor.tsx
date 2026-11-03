import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { categories, providers } from '../data/catalog'
import { platformIds } from '../data/platforms'
import text from '../content/ar/texts.json'
import type { ContentItem, WorkDetails, SaveContentRequest } from '../models/content'
import './LocalEditor.css'

const labels = text.editor
export default function LocalEditor() {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [workType, setWorkType] = useState<WorkDetails['type']>('film')
  const [mode, setMode] = useState('none')
  const [platform, setPlatform] = useState<ContentItem['platform']>('youtube')
  const [sources, setSources] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<{ id: string; file: string } | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const data = new FormData(form)
    const get = (key: string) => String(data.get(key) ?? '').trim()
    const nullable = (key: string) => get(key) || null
    const numeric = (key: string) => get(key) ? Number(get(key)) : null
    const names = (key: string) => get(key).split(/[,،\n]/).map(value => value.trim()).filter(Boolean)
    const post: Omit<ContentItem, 'id'> = {
      work: null,
      platform, kind: 'video', title: get('title'), description: get('description'),
      body: get('body').split('\n').map(value => value.trim()).filter(Boolean), externalUrl: nullable('externalUrl'),
      videoLayout: get('videoLayout') as ContentItem['videoLayout'], isDemo: false, publishedAt: nullable('publishedAt'),
    }
    let work: WorkDetails | null = null
    if (mode === 'new') work = {
      title: get('productionTitle'), originalTitle: nullable('originalTitle'),
      type: workType, partNumber: workType === 'film' ? numeric('partNumber') : null, seasonCount: workType === 'series' ? numeric('seasonCount') : null, year: numeric('year'), directors: names('directors'), writers: names('writers'), editors: names('editors'),
      cast: names('cast'), genres: names('genres'), countries: names('countries'), languages: names('languages'),
      synopsis: nullable('synopsis'), franchise: nullable('franchise'),
      seasonNumber: workType === 'series' ? numeric('seasonNumber') : null,
      runtimeMinutes: workType === 'film' ? numeric('runtimeMinutes') : null,
      providerIds: data.getAll('providerIds').map(String),
      imdb: get('imdbUrl') ? { url: get('imdbUrl'), rating: numeric('imdbRating'), ratingCount: numeric('imdbVotes'), checkedAt: nullable('imdbCheckedAt') } : null,
      sources: sources.filter(id => get(`sourceLabel-${id}`) || get(`sourceUrl-${id}`)).map(id => ({ label: get(`sourceLabel-${id}`), url: get(`sourceUrl-${id}`) })),
    }
    setSaving(true); setError(''); setSaved(null)
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}__local/content`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId, item: { ...post, work } } satisfies SaveContentRequest) })
      const result = await response.json()
      if (!response.ok) { setError(labels.errors[result.error as keyof typeof labels.errors] ?? labels.errors.saveFailed); return }
      setSaved(result)
    } catch { setError(labels.errors.saveFailed) } finally { setSaving(false) }
  }
  return <section className="page-section local-editor">
    <span className="eyebrow">{labels.localNotice}</span><h1>{labels.title}</h1><p className="page-description">{labels.description}</p><p className="editor-help">{labels.requiredHint} {labels.optionalHint} {labels.thumbnailAutomatic}</p>
    {saved && <div className="editor-success" role="status"><p>{labels.saved} <bdi>{saved.file}</bdi></p><Link className="text-link" to={`/story/${saved.id}`}>{labels.viewPost}</Link><button type="button" onClick={() => { setSaved(null); document.querySelector<HTMLFormElement>('.editor-form')?.reset(); setMode('none'); setWorkType('film'); setPlatform('youtube'); setCategoryId(categories[0]?.id ?? ''); setSources([]) }}>{labels.addAnother}</button></div>}
    <form className="editor-form" onSubmit={submit}>
      <fieldset disabled={saving || !!saved}><legend>{labels.postSection}</legend><div className="editor-grid">
        <label>{labels.category} *<select name="categoryId" value={categoryId} onChange={event => setCategoryId(event.target.value)} required>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>{labels.platform} *<select name="platform" value={platform} onChange={event => setPlatform(event.target.value as ContentItem['platform'])}>{platformIds.map(id => <option key={id} value={id}>{text.catalog.platforms[id]}</option>)}</select></label>
        <label className="editor-full">{labels.titleLabel} *<input name="title" required maxLength={1000} dir="auto"/></label>
        <label className="editor-full">{labels.descriptionLabel}<textarea name="description" rows={2} maxLength={12000}/></label>
        <label className="editor-full">{labels.body}<textarea name="body" rows={4}/><small>{labels.bodyHint}</small></label>
        <label className="editor-full">{labels.externalUrl}{platform !== 'website' && ' *'}<input name="externalUrl" type="url" dir="ltr" required={platform !== 'website'}/></label>
        <label>{labels.layout}<select name="videoLayout" key={platform} defaultValue={['tiktok', 'facebook', 'instagram'].includes(platform) ? 'portrait' : 'landscape'}><option value="landscape">{labels.landscape}</option><option value="portrait">{labels.portrait}</option></select></label>
        <label>{labels.publishedAt}<input name="publishedAt" type="date"/></label>
      </div></fieldset>
      <fieldset disabled={saving || !!saved}><legend>{labels.productionSection}</legend>
        <label>{labels.productionMode}<select name="productionMode" value={mode} onChange={event => setMode(event.target.value)}><option value="none">{labels.none}</option><option value="new">{labels.new}</option></select></label>
        {mode === 'new' && <div className="editor-grid editor-production">
          <label>{labels.productionTitle} *<input name="productionTitle" required maxLength={500} dir="auto"/></label>
          <label>{labels.originalTitle}<input name="originalTitle" dir="auto"/></label>
          <label>{labels.type}<select name="productionType" value={workType} onChange={event => setWorkType(event.target.value as WorkDetails['type'])}><option value="film">{text.discover.film}</option><option value="series">{text.discover.series}</option></select></label>
          {workType === 'film'
            ? <label>{labels.partNumber}<input name="partNumber" type="number" min={1} max={Number.MAX_SAFE_INTEGER} step={1}/></label>
            : <label>{labels.seasonCount}<input name="seasonCount" type="number" min={1} max={Number.MAX_SAFE_INTEGER} step={1}/></label>}
          {workType === 'series'
            ? <label>{labels.seasonNumber}<input name="seasonNumber" type="number" min={1} max={Number.MAX_SAFE_INTEGER} step={1}/></label>
            : <label>{labels.runtimeMinutes}<input name="runtimeMinutes" type="number" min={1} max={Number.MAX_SAFE_INTEGER} step={1}/></label>}
          <label>{labels.franchise}<input name="franchise" dir="auto"/></label>
          <label className="editor-full">{labels.synopsis}<textarea name="synopsis" rows={3} maxLength={12000} dir="auto"/></label>
          {(['cast', 'genres', 'countries', 'languages'] as const).map(key => <label key={key}>{labels[key]}<textarea name={key} rows={2}/><small>{labels.namesHint}</small></label>)}
          <label>{labels.year}<input name="year" type="number" min={1888} max={2200}/></label>
          {(['directors', 'writers', 'editors'] as const).map(key => <label key={key}>{labels[key]}<textarea name={key} rows={2}/><small>{labels.namesHint}</small></label>)}
          <div className="editor-full editor-provider-options"><span>{labels.providers}</span>{providers.map(provider => <label key={provider.id}><input type="checkbox" name="providerIds" value={provider.id}/><span dir="auto">{provider.name}</span></label>)}</div>
          <div className="editor-full"><h2>{labels.imdbSection}</h2></div>
          <label className="editor-full">{labels.imdbUrl}<input name="imdbUrl" type="url" dir="ltr"/></label>
          <label>{labels.imdbRating}<input name="imdbRating" type="number" min={0} max={10} step={0.1}/></label>
          <label>{labels.imdbVotes}<input name="imdbVotes" type="number" min={0} step={1}/></label>
          <label>{labels.imdbCheckedAt}<input name="imdbCheckedAt" type="date"/></label>
          <div className="editor-full editor-sources"><h2>{labels.sources}</h2>{sources.map(id => <div className="editor-source" key={id}><label>{labels.sourceLabel}<input name={`sourceLabel-${id}`} required/></label><label>{labels.sourceUrl}<input name={`sourceUrl-${id}`} type="url" dir="ltr" required/></label><button type="button" onClick={() => setSources(current => current.filter(item => item !== id))}>{labels.removeSource}</button></div>)}<button type="button" onClick={() => setSources(current => [...current, (current.at(-1) ?? 0) + 1])}>{labels.addSource}</button></div>
        </div>}
      </fieldset>
      {error && <p className="editor-error" role="alert">{error}</p>}
      <button className="button primary editor-submit" type="submit" disabled={saving || !!saved}>{saving ? labels.saving : labels.save}</button>
    </form>
  </section>
}
