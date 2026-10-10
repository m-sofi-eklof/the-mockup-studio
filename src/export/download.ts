import { strToU8, zipSync } from 'fflate'

export type Files = Record<string, string | Uint8Array>

export type PackageResult = { filename: string; blob: Blob; note: string }
export type PromptResult = { prompt: string; assets: Record<string, Uint8Array> }

export function zip(files: Files, mime = 'application/zip') {
  const enc: Record<string, Uint8Array> = {}
  for (const [k, v] of Object.entries(files)) enc[k] = typeof v === 'string' ? strToU8(v) : v
  return new Blob([zipSync(enc, { level: 6 }) as Uint8Array<ArrayBuffer>], { type: mime })
}

export function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function canvasToPng(c: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png'),
  )
  return new Uint8Array(await blob.arrayBuffer())
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-theme'

/** Stable GUID derived from a string, so reinstalling the same theme updates instead of duplicating. */
export function stableGuid(s: string) {
  let h = ''
  let x = 2166136261
  for (let round = 0; round < 4; round++) {
    for (const ch of s + round) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0
    h += x.toString(16).padStart(8, '0')
  }
  return `{${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}}`
}

export const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** PowerShell scripts are written with CRLF so they look right in Notepad. */
export const crlf = (s: string) => s.replace(/\r?\n/g, '\r\n')
