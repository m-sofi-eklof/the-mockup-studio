// macOS: an iTerm2 Dynamic Profile (JSON dropped in ~/Library/Application Support/iTerm2/DynamicProfiles).
import type { Decor } from '../decor/Decor'
import { ANSI_NAMES, type TerminalTheme } from '../presets/terminal'
import { slugify, stableGuid, zip, type Files, type PackageResult } from './download'
import { macDecor } from './terminalDecor'

const POSTSCRIPT: Record<string, string> = {
  'SF Mono': 'SFMono-Regular',
  Menlo: 'Menlo-Regular',
  Monaco: 'Monaco',
  'JetBrains Mono': 'JetBrainsMono-Regular',
  'Fira Code': 'FiraCode-Regular',
  'Courier New': 'CourierNewPSMT',
  'Cascadia Code': 'CascadiaCode-Regular',
  'Cascadia Mono': 'CascadiaMono-Regular',
  Consolas: 'Consolas',
}

// iTerm2 cursor types: 0 = underline, 1 = vertical bar, 2 = box
const CURSOR_TYPE = { underline: 0, bar: 1, block: 2 } as const

function itermColor(hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
  const c = (v: number) => Math.round((v / 255) * 10000) / 10000
  return {
    'Red Component': c((n >> 16) & 255),
    'Green Component': c((n >> 8) & 255),
    'Blue Component': c(n & 255),
    'Alpha Component': 1,
    'Color Space': 'sRGB',
  }
}

export function itermProfile(t: TerminalTheme, opts: { image: boolean; greeting: boolean; strength: number }) {
  const p: Record<string, unknown> = {
    Name: t.name,
    Guid: stableGuid(`iterm:${slugify(t.name)}`).slice(1, -1),
    Tags: ['Theme Mockup Studio'],
    'Background Color': itermColor(t.background),
    'Foreground Color': itermColor(t.foreground),
    'Bold Color': itermColor(t.foreground),
    'Cursor Color': itermColor(t.cursorColor),
    'Cursor Text Color': itermColor(t.background),
    'Selection Color': itermColor(t.selectionBackground),
    'Selected Text Color': itermColor(t.foreground),
    'Normal Font': `${POSTSCRIPT[t.fontFamily] ?? t.fontFamily.replace(/\s+/g, '')} ${t.fontSize}`,
    'Cursor Type': CURSOR_TYPE[t.cursorStyle],
    Transparency: Math.round((1 - t.opacity / 100) * 100) / 100,
    Blur: t.opacity < 100,
    'Blur Radius': 8,
  }
  ANSI_NAMES.forEach((_, i) => (p[`Ansi ${i} Color`] = itermColor(t.ansi[i])))
  if (opts.image) {
    p['Background Image Location'] = '__DIR__/background.png'
    p['Background Image Mode'] = 2 // aspect fill
    p.Blend = Math.round((1 - opts.strength) * 100) / 100
  }
  if (opts.greeting) {
    p['Custom Command'] = 'Yes'
    p.Command = '/bin/sh __DIR__/greeting.sh --shell'
  }
  return { Profiles: [p] }
}

export async function buildITermPackage(t: TerminalTheme, decor: Decor): Promise<PackageResult> {
  const slug = slugify(t.name)
  const { png, greeting } = await macDecor(decor, t.background)
  const profile = itermProfile(t, { image: !!png, greeting: !!greeting, strength: decor.strength / 100 })

  const install = `#!/bin/sh
# Installs "${t.name}" as an iTerm2 Dynamic Profile.
# Anything it would overwrite is backed up first to ~/theme-mockup-backups/<timestamp>/
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.theme-mockup/${slug}"
PROFILES="$HOME/Library/Application Support/iTerm2/DynamicProfiles"
BACKUP="$HOME/theme-mockup-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"
[ -f "$HOME/Library/Preferences/com.googlecode.iterm2.plist" ] && cp "$HOME/Library/Preferences/com.googlecode.iterm2.plist" "$BACKUP/"
[ -f "$PROFILES/${slug}.json" ] && cp "$PROFILES/${slug}.json" "$BACKUP/"
[ -d "$DEST" ] && cp -R "$DEST" "$BACKUP/assets-before"
echo "Backed up current settings to $BACKUP"

mkdir -p "$DEST" "$PROFILES"
[ -f "$SRC/background.png" ] && cp "$SRC/background.png" "$DEST/"
if [ -f "$SRC/greeting.sh" ]; then
  rm -rf "$DEST/frames"
  cp -R "$SRC/frames" "$DEST/frames"
  cp "$SRC/greeting.sh" "$DEST/greeting.sh"
  chmod +x "$DEST/greeting.sh"
fi
sed "s#__DIR__#$DEST#g" "$SRC/profile.json" > "$PROFILES/${slug}.json"
echo "Installed iTerm2 profile '${t.name}'."
echo "Open iTerm2 > Settings > Profiles and pick '${t.name}' (or set it as Default)."
`
  const uninstall = `#!/bin/sh
rm -f "$HOME/Library/Application Support/iTerm2/DynamicProfiles/${slug}.json"
rm -rf "$HOME/.theme-mockup/${slug}"
echo "Removed '${t.name}' from iTerm2."
`
  const readme = `${t.name} (iTerm2)
${'='.repeat(t.name.length + 9)}

Needs iTerm2 (free: https://iterm2.com). macOS's built-in Terminal.app can't load this format.

Install, from this unzipped folder:
  sh install.sh

Then open iTerm2 > Settings > Profiles, choose "${t.name}", and use Other Actions > Set as Default if you like.
Dynamic profiles reload automatically, so there's no need to restart iTerm2.

Uninstall:
  sh uninstall.sh
${greeting ? '\nWhen a tab opens, your pixel pets play a short greeting, then your normal login shell starts.\n' : ''}${png ? '\nThe background image has your scene, with the pets drawn in. iTerm2 backgrounds are still images.\n' : ''}`

  const files: Files = {
    'profile.json': JSON.stringify(profile, null, 2),
    'install.sh': install,
    'uninstall.sh': uninstall,
    'README.txt': readme,
    ...(greeting ?? {}),
  }
  if (png) files['background.png'] = png

  return {
    filename: `${slug}-iterm2.zip`,
    blob: zip(files),
    note: 'On the Mac: unzip, run "sh install.sh", then pick the profile in iTerm2 > Settings > Profiles.',
  }
}
