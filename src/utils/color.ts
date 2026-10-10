function parse(hex: string) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

export function withAlpha(hex: string, alpha: number) {
  const rgb = parse(hex)
  if (!rgb) return hex
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

/** `amount` of `fg` over `bg`, as an opaque hex color. VS Code theme files only accept hex (anything else renders red). */
export function mix(fg: string, bg: string, amount: number) {
  const a = parse(fg)
  const b = parse(bg)
  if (!a || !b) return fg
  const c = (i: 0 | 1 | 2) => Math.round(b[i] + (a[i] - b[i]) * amount)
  return `#${((c(0) << 16) | (c(1) << 8) | c(2)).toString(16).padStart(6, '0')}`
}

/** Lighten (positive) or darken (negative) a hex color by a fixed amount per channel. */
export function shade(hex: string, amt: number) {
  const rgb = parse(hex)
  if (!rgb) return hex
  const c = (v: number) => Math.max(0, Math.min(255, v + amt))
  return `#${((c(rgb[0]) << 16) | (c(rgb[1]) << 8) | c(rgb[2])).toString(16).padStart(6, '0')}`
}

/** Shade towards the readable side: darken light colors, lighten dark ones. */
export function shift(hex: string, amt: number) {
  return isLight(hex) ? shade(hex, -amt) : shade(hex, amt)
}

export function isLight(hex: string) {
  const rgb = parse(hex)
  if (!rgb) return false
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 140
}
