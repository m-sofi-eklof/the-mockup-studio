// "Pet greeting": the pets drawn as real terminal text with half-block characters (▀/▄) in 24-bit color,
// played as a short animation when a new tab opens.
import type { Decor } from '../decor/Decor'
import { layoutRow, motionFrames, petDims, rowWidth, type PixelGrid } from '../decor/motion'
import { crlf, type Files } from './download'

const ESC = '\x1b'
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16)
  return `${(n >> 16) & 255};${(n >> 8) & 255};${n & 255}`
}

function gridToAnsi(g: PixelGrid, indent = 2) {
  const lines: string[] = []
  for (let y = 0; y < g.length; y += 2) {
    let line = ' '.repeat(indent)
    let fg = ''
    let bg = ''
    const set = (f: string, b: string) => {
      let s = ''
      if (f !== fg) s += f ? `${ESC}[38;2;${rgb(f)}m` : `${ESC}[39m`
      if (b !== bg) s += b ? `${ESC}[48;2;${rgb(b)}m` : `${ESC}[49m`
      fg = f
      bg = b
      return s
    }
    for (let x = 0; x < g[0].length; x++) {
      const top = g[y][x]
      const bot = g[y + 1]?.[x] ?? null
      if (!top && !bot) line += set(fg, '') + ' '
      else if (top && !bot) line += set(top, '') + '▀'
      else if (!top && bot) line += set(bot, '') + '▄'
      else line += set(top!, bot!) + '▀'
    }
    lines.push(line + `${ESC}[0m${ESC}[K`)
  }
  return lines.join('\n') + '\n'
}

export type Greeting = { frames: string[]; delays: number[]; loops: number; lines: number }

export function buildGreeting(decor: Decor): Greeting | null {
  if (!decor.pets.length) return null
  const walk = decor.petAnim === 'walk'
  const travel = walk ? 28 : 0
  const frames = motionFrames(decor.petAnim, travel, { walkStep: 1, walkDelay: 45 })
  const maxH = Math.max(...decor.pets.map((p) => petDims(p).h))
  const headroom = decor.petAnim === 'hop' ? 4 : decor.petAnim === 'none' ? 0 : 1
  let H = maxH + headroom
  if (H % 2) H++
  const W = rowWidth(decor.pets) + travel

  const out = frames.map((f) => {
    const grid: PixelGrid = Array.from({ length: H }, () => new Array(W).fill(null))
    for (const it of layoutRow(decor.pets, f, H)) {
      it.grid.forEach((row, gy) =>
        row.forEach((c, gx) => {
          const y = it.y + gy
          const x = it.x + gx
          if (c && y >= 0 && y < H && x >= 0 && x < W) grid[y][x] = c
        }),
      )
    }
    return gridToAnsi(grid)
  })
  const delays = frames.map((f) => (decor.petAnim === 'bob' ? 300 : f.delay))
  const loops = decor.petAnim === 'bob' ? 4 : decor.petAnim === 'hop' ? 2 : 1
  return { frames: out, delays, loops, lines: H / 2 }
}

const SEP = '~~~frame~~~\n'

/** Windows: <slug>-pet.ansi + <slug>-greeting.ps1 */
export function windowsGreetingFiles(slug: string, g: Greeting): Files {
  const ansiFile = `${slug}-pet.ansi`
  const ps1 = crlf(`# Pixel pet greeting (Theme Mockup Studio). Plays once when the tab opens.
try {
  [Console]::OutputEncoding = [Text.Encoding]::UTF8
  $e = [char]27
  $raw = [IO.File]::ReadAllText((Join-Path $PSScriptRoot '${ansiFile}'), [Text.Encoding]::UTF8)
  $frames = $raw -split "${SEP.trim()}\`n"
  $delays = @(${g.delays.join(', ')})
  [Console]::Write("$e[?25l")
  for ($l = 0; $l -lt ${g.loops}; $l++) {
    for ($i = 0; $i -lt $frames.Count; $i++) {
      [Console]::Write($frames[$i])
      Start-Sleep -Milliseconds $delays[$i]
      [Console]::Write("$e[${g.lines}A")
    }
  }
  [Console]::Write($frames[$frames.Count - 1])
} catch {
} finally {
  [Console]::Write("$([char]27)[?25h")
}
`)
  return {
    [ansiFile]: g.frames.join(SEP),
    [`${slug}-greeting.ps1`]: String.fromCharCode(0xfeff) + ps1,
  }
}

/** macOS: greeting.sh + frames/NNN.ansi. Pass --shell to hand over to the login shell afterwards. */
export function macGreetingFiles(g: Greeting): Files {
  const files: Files = {}
  const pad = (i: number) => String(i).padStart(3, '0')
  g.frames.forEach((f, i) => (files[`frames/${pad(i)}.ansi`] = f))
  const steps = g.frames
    .map((_, i) => `    cat "$F/${pad(i)}.ansi"; sleep ${(g.delays[i] / 1000).toFixed(3)}; printf '\\033[${g.lines}A'`)
    .join('\n')
  files['greeting.sh'] = `#!/bin/sh
# Pixel pet greeting (Theme Mockup Studio). Plays once, then (with --shell) starts your login shell.
F="$(cd "$(dirname "$0")" && pwd)/frames"
if [ -t 1 ] && [ -d "$F" ]; then
  printf '\\033[?25l'
  l=0
  while [ $l -lt ${g.loops} ]; do
${steps}
    l=$((l + 1))
  done
  cat "$F/${pad(g.frames.length - 1)}.ansi"
  printf '\\033[?25h'
fi
if [ "$1" = "--shell" ]; then exec "\${SHELL:-/bin/zsh}" -l; fi
`
  return files
}
