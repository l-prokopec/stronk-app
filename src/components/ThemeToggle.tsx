import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const THEME_KEY = 'stronk-app:theme'

const initialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* Motiv může fungovat i bez dostupného localStorage. */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17141f' : '#f7f5ff')
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* Volba platí alespoň pro otevřenou stránku. */ }
  }, [theme])

  const dark = theme === 'dark'
  return <button className="theme-toggle" type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}>
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {dark
        ? <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42M7.06 16.94l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        : <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />}
    </svg>
    <span>{dark ? 'Světlý' : 'Tmavý'}</span>
  </button>
}
