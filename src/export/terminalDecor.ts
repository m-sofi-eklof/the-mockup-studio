import type { Decor } from '../decor/Decor'
import { renderDecorGif } from '../decor/gif'
import { renderDecorPng } from '../decor/render'
import type { Files } from './download'
import { buildGreeting, macGreetingFiles, windowsGreetingFiles } from './greeting'

/** Windows Terminal: animated GIF background when pets move (else a PNG with pets drawn in), plus the greeting script. */
export async function windowsDecor(slug: string, decor: Decor, base: string) {
  let background: { ext: 'png' | 'gif'; data: Uint8Array } | null = null
  if (decor.animatedBg) {
    const gif = renderDecorGif(decor, base)
    if (gif) background = { ext: 'gif', data: gif }
  }
  if (!background) {
    const png = await renderDecorPng(decor, base)
    if (png) background = { ext: 'png', data: png }
  }
  const g = decor.greeting ? buildGreeting(decor) : null
  const assets: Files = g ? windowsGreetingFiles(slug, g) : {}
  const greetingPs1 = g ? `__DIR__\\${slug}-greeting.ps1` : null
  return { background, assets, greetingPs1 }
}

/** iTerm2: still PNG (pets drawn in) plus greeting.sh + frames. */
export async function macDecor(decor: Decor, base: string) {
  const png = await renderDecorPng(decor, base)
  const g = decor.greeting ? buildGreeting(decor) : null
  return { png, greeting: g ? macGreetingFiles(g) : null }
}
