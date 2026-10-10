// Pets with their own frame animation are shown as a film strip: every frame side by side in one image,
// slid along one frame at a time by a stepped CSS animation.
import { canvasToPng } from '../export/download'
import { petInfo, type PetName } from './pets'

function stripCanvas(name: PetName) {
  const { sprite, palette, anim } = petInfo(name)
  const frames = anim?.frames ?? [sprite]
  const w = sprite[0].length
  const c = document.createElement('canvas')
  c.width = w * frames.length
  c.height = sprite.length
  const ctx = c.getContext('2d')!
  frames.forEach((frame, f) =>
    frame.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!palette[ch]) return
        ctx.fillStyle = palette[ch]
        ctx.fillRect(f * w + x, y, 1, 1)
      }),
    ),
  )
  return c
}

const urls = new Map<PetName, string>()

/** The strip as a data URL, one image pixel per sprite pixel (scale it up with `image-rendering: pixelated`). */
export function petStripUrl(name: PetName) {
  let url = urls.get(name)
  if (!url) {
    url = stripCanvas(name).toDataURL()
    urls.set(name, url)
  }
  return url
}

export const petStripPng = (name: PetName) => canvasToPng(stripCanvas(name))

/** Box size and CSS animation for showing the strip at `scale` screen pixels per hand-drawn-pet pixel. */
export function petStripLayout(name: PetName, scale: number) {
  const { sprite, px = 1, anim } = petInfo(name)
  const n = anim?.frames.length ?? 1
  return {
    n,
    width: Math.round(sprite[0].length * scale * px),
    height: Math.round(sprite.length * scale * px),
    animation: `${n * (anim?.frameMs ?? 0)}ms steps(${n}) infinite`,
  }
}