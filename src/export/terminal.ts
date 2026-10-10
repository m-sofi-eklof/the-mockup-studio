import type { Decor } from '../decor/Decor'
import { ANSI_NAMES, type TerminalTheme } from '../presets/terminal'
import { slugify, zip, type PackageResult } from './download'
import { buildITermPackage } from './iterm'
import { windowsDecor } from './terminalDecor'
import { windowsTerminalFiles } from './wtFragment'

export function terminalScheme(t: TerminalTheme) {
  const scheme: Record<string, string> = {
    name: t.name,
    background: t.background,
    foreground: t.foreground,
    cursorColor: t.cursorColor,
    selectionBackground: t.selectionBackground,
  }
  ANSI_NAMES.forEach((n, i) => (scheme[n] = t.ansi[i]))
  return scheme
}

export function terminalProfile(t: TerminalTheme) {
  return {
    commandline: 'powershell.exe',
    font: { face: t.fontFamily, size: t.fontSize, cellHeight: String(t.lineHeight) },
    cursorShape: t.cursorStyle === 'block' ? 'filledBox' : t.cursorStyle,
    padding: String(t.padding),
    opacity: t.opacity,
    useAcrylic: t.opacity < 100,
  }
}

export async function buildTerminalPackage(t: TerminalTheme, decor: Decor): Promise<PackageResult> {
  if (t.platform === 'macos') return buildITermPackage(t, decor)

  const slug = slugify(t.name)
  const { background, assets, greetingPs1 } = await windowsDecor(slug, decor, t.background)
  const profile = terminalProfile(t)
  if (greetingPs1) profile.commandline = `powershell.exe -NoExit -ExecutionPolicy Bypass -File "${greetingPs1}"`

  const files = windowsTerminalFiles({
    slug,
    profileName: t.name,
    scheme: terminalScheme(t),
    profile,
    background,
    backgroundOpacity: decor.strength / 100,
    assets,
    readmeExtra: [
      background?.ext === 'gif' ? '\nThe background is an animated GIF, so your pets move in it.' : '',
      greetingPs1 ? '\nWhen a tab opens, your pets play a short greeting before the prompt appears.' : '',
    ].join(''),
  })
  return {
    filename: `${slug}-windows-terminal.zip`,
    blob: zip(files),
    note: 'Unzip, then run: powershell -ExecutionPolicy Bypass -File .\\install.ps1 and restart Windows Terminal.',
  }
}
