import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import text from '../content/ar.json'
import lightLogo from '../assets/brank_dark.png'
import darkLogo from '../assets/brand_logo.png'

type Preference = 'system' | 'light' | 'dark'
const options = ['system', 'light', 'dark'] as const
const icons = { system: Monitor, light: Sun, dark: Moon }

export default function Appearance() {
  const [preference, setPreference] = useState<Preference>(() => {
    try {
      const stored = localStorage.getItem('negative-theme')
      if (options.includes(stored as Preference)) return stored as Preference
    } catch { /* Use the system preference when storage is unavailable. */ }
    return 'system'
  })
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function apply() {
      const dark = preference === 'dark' || (preference === 'system' && media.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', dark ? darkLogo : lightLogo)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#131715' : '#fafaf9')
    }
    apply()
    try { localStorage.setItem('negative-theme', preference) } catch { /* The setting still works for this visit. */ }
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])
  return <div className="appearance" role="group" aria-label={text.appearance.label}>{options.map(option => {
    const Icon = icons[option]
    return <button key={option} type="button" aria-label={text.appearance[option]} title={text.appearance[option]} aria-pressed={preference === option} onClick={() => setPreference(option)}><Icon size={16}/><span>{text.appearance[option]}</span></button>
  })}</div>
}
