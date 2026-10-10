import { useEffect, useRef, useState } from 'react'

// State is mirrored to localStorage (instant) and to saved-settings/<key>.json via the dev server (durable).
// load turns saved JSON into a full theme; by default missing fields are taken from defaults.
export function useLocalTheme<T extends object>(key: string, defaults: T, load: (saved: Partial<T>) => T = (s) => ({ ...defaults, ...s })) {
  const [theme, setTheme] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return load(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    return defaults
  })
  const loaded = useRef(false)
  const latest = useRef(theme)
  latest.current = theme

  // On mount, prefer the file on disk; if none exists yet, the effect below writes the current state out.
  useEffect(() => {
    let cancelled = false
    fetch(`/api/settings/${key}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((saved) => {
        if (cancelled) return
        if (saved) setTheme(load(saved))
        // First run with no file yet: write out what's in localStorage so nothing is lost.
        else fetch(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify(latest.current, null, 2) }).catch(() => {})
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) loaded.current = true
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(theme))
    } catch {
      /* ignore */
    }
    const id = setTimeout(() => {
      if (!loaded.current) return
      fetch(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify(theme, null, 2) }).catch(() => {})
    }, 400)
    return () => clearTimeout(id)
  }, [key, theme])

  const set = <K extends keyof T>(k: K, v: T[K]) => setTheme((t) => ({ ...t, [k]: v }))

  return { theme, setTheme, set }
}
