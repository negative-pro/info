import { useState } from 'react'
import type { FormEvent } from 'react'
import accounts from '../content/ar/social-accounts.json'
import text from '../content/ar/texts.json'
import type { SocialAccount } from '../models/content'

const labels = text.dashboard
const countKeys = ['followerCount', 'subscriberCount', 'monthlyVisitors'] as const
const countLabels = { followerCount: text.social.followers, subscriberCount: text.social.subscribers, monthlyVisitors: text.social.monthlyVisitors }
function AccountEditor({ initial }: { initial: SocialAccount }) {
  const [account, setAccount] = useState(initial)
  const [counts, setCounts] = useState(() => Object.fromEntries(countKeys.map(key => [key, initial[key] ?? ''])))
  const [updatedAt, setUpdatedAt] = useState(initial.statsUpdatedAt ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function save(changes: Partial<SocialAccount>) {
    if (pending) return
    setPending(true); setError(''); setSaved(false)
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}__local/social`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: account.id, ...changes }) })
      if (!response.ok) throw new Error('Save failed')
      const result = await response.json() as SocialAccount
      setAccount(result); setSaved(true)
    } catch { setError(labels.social.error) } finally { setPending(false) }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(countKeys.map(key => [key, counts[key] === '' ? null : Number(counts[key])]))
    void save({ ...values, statsUpdatedAt: updatedAt || null })
  }
  return <form className="dashboard-social-account" aria-label={account.name} onSubmit={submit}>
    <div className="dashboard-social-heading"><h3>{account.name}</h3><span className="dashboard-status" data-hidden={!!account.hidden}>{account.hidden ? labels.hidden : labels.visible}</span><button type="button" disabled={pending} aria-label={`${account.hidden ? labels.show : labels.hide}: ${account.name}`} onClick={() => save({ hidden: !account.hidden })}>{account.hidden ? labels.show : labels.hide}</button></div>
    <fieldset disabled={pending}>
      {countKeys.map(key => <label key={key}>{countLabels[key]}<input type="number" min={0} max={Number.MAX_SAFE_INTEGER} step={1} value={counts[key]} onChange={event => { setCounts(current => ({ ...current, [key]: event.target.value })); setSaved(false) }}/></label>)}
      <label>{text.social.updatedAt}<input type="date" value={updatedAt} onChange={event => { setUpdatedAt(event.target.value); setSaved(false) }}/></label>
      <button type="submit">{pending ? labels.saving : labels.social.save}</button>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    {saved && <p role="status">{labels.social.saved}</p>}
  </form>
}
export default function SocialAccountManager() {
  return <section className="dashboard-social"><h2>{labels.social.title}</h2><p className="page-description">{labels.social.description}</p><div className="dashboard-social-list">{accounts.map(account => <AccountEditor key={account.id} initial={account}/>)}</div></section>
}
