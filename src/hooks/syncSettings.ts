// On startup, copy every saved page setting from localStorage to saved-settings/*.json
// if it doesn't have a file yet, so picks for pages you haven't opened are never lost.
export async function syncLocalSettingsToFiles() {
  let keys: string[] = []
  try {
    keys = Object.keys(localStorage).filter((k) => k.startsWith('tms.'))
  } catch {
    return
  }
  await Promise.all(
    keys.map(async (key) => {
      try {
        const res = await fetch(`/api/settings/${key}`)
        if (res.status !== 404) return
        const raw = localStorage.getItem(key)
        if (raw) await fetch(`/api/settings/${key}`, { method: 'PUT', body: raw })
      } catch {
        /* dev server API unavailable (e.g. static build) */
      }
    }),
  )
}
