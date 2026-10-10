import type { Decor } from '../decor/Decor'
import { petPngs, renderDecorPng } from '../decor/render'
import type { ClaudeTheme } from '../presets/claude'
import type { TerminalTheme } from '../presets/terminal'
import type { VSCodeTheme } from '../presets/vscode'
import { isLight } from '../utils/color'
import { claudeScheme } from './claude'
import { slugify, type PromptResult } from './download'
import { macDecor, windowsDecor } from './terminalDecor'
import { terminalProfile, terminalScheme } from './terminal'
import { vscodeColorTheme } from './vscode'

const json = (v: unknown) => '```json\n' + JSON.stringify(v, null, 2) + '\n```'

async function assets(decor: Decor, base: string, bakePets: boolean) {
  const out: Record<string, Uint8Array> = { ...(await petPngs(decor)) }
  const bg = await renderDecorPng(decor, base, { bakePets })
  if (bg) out['background.png'] = bg
  return out
}

function assetList(a: Record<string, Uint8Array>) {
  const names = Object.keys(a)
  if (!names.length) return '_No files attached._'
  const describe = (n: string) => {
    if (n === 'background.png') return '1920×1080 pixel-art background, already in the theme colors'
    if (n === 'background.gif') return '1920×1080 animated GIF background: the scene plus the pets moving'
    if (n.startsWith('pet-')) return 'pixel pet sprite, transparent PNG, 8× scale'
    if (n.endsWith('greeting.ps1') || n === 'greeting.sh') return 'ready-made pet greeting player script'
    if (n.endsWith('.ansi')) return 'pre-rendered pet animation frames (24-bit color half-block text)'
    return ''
  }
  const frames = names.filter((n) => n.startsWith('frames/'))
  return names
    .filter((n) => !n.startsWith('frames/'))
    .map((n) => `- \`${n}\`: ${describe(n)}`)
    .concat(frames.length ? [`- \`frames/000.ansi\` … \`frames/${String(frames.length - 1).padStart(3, '0')}.ansi\`: pre-rendered pet animation frames`] : [])
    .join('\n')
}

const BACKUP_RULE = `**Before changing any existing config file, copy it to a timestamped backup (e.g. \`~/theme-mockup-backups/<timestamp>/\`) and tell me where it is.**`

const enc = (files: Record<string, string | Uint8Array>) => {
  const out: Record<string, Uint8Array> = {}
  for (const [k, v] of Object.entries(files)) out[k] = typeof v === 'string' ? new TextEncoder().encode(v) : v
  return out
}

export async function terminalPrompt(t: TerminalTheme, decor: Decor): Promise<PromptResult> {
  const slug = slugify(t.name)
  const mac = t.platform === 'macos'
  const a: Record<string, Uint8Array> = { ...(await petPngs(decor)) }
  let greetingNote = ''
  if (mac) {
    const { png, greeting } = await macDecor(decor, t.background)
    if (png) a['background.png'] = png
    if (greeting) {
      Object.assign(a, enc(greeting))
      greetingNote = 'greeting.sh'
    }
  } else {
    const { background, assets: g } = await windowsDecor(slug, decor, t.background)
    if (background) a[`background.${background.ext}`] = background.data
    Object.assign(a, enc(g))
    if (Object.keys(g).length) greetingNote = `${slug}-greeting.ps1`
  }
  const bgName = a['background.gif'] ? 'background.gif' : a['background.png'] ? 'background.png' : null

  const platformSteps = mac
    ? `Install it as an **iTerm2 Dynamic Profile**, so you don't need to edit iTerm2's main preferences:
1. Put the assets in \`~/.theme-mockup/${slug}/\`.
2. Write \`~/Library/Application Support/iTerm2/DynamicProfiles/${slug}.json\` as \`{ "Profiles": [ ... ] }\` with one profile containing:
   - \`Name\` and a \`Guid\`.
   - \`Background Color\`, \`Foreground Color\`, \`Cursor Color\`, \`Selection Color\`, and \`Ansi 0 Color\` … \`Ansi 15 Color\`. Each is a dict with Red/Green/Blue/Alpha Component as 0–1 floats and \`"Color Space": "sRGB"\`, taken from the scheme below.
   - \`Normal Font\` set to "<PostScript name> ${t.fontSize}" for ${t.fontFamily}.
   - \`Cursor Type\` = ${({ underline: 0, bar: 1, block: 2 } as const)[t.cursorStyle]}, \`Transparency\` = ${Math.round((1 - t.opacity / 100) * 100) / 100}, and \`Blur\` = ${t.opacity < 100}.
${bgName ? `   - \`Background Image Location\` pointing at \`background.png\`, with \`Background Image Mode\` 2 (aspect fill).\n` : ''}${greetingNote ? `   - \`Custom Command\` = "Yes" and \`Command\` = "/bin/sh <abs path>/greeting.sh --shell". This plays the pet greeting, then starts my login shell. Copy the \`frames/\` folder next to the script.\n` : ''}3. Tell me to pick the "${t.name}" profile in iTerm2 > Settings > Profiles.`
    : `Install it as a **Windows Terminal JSON fragment**, so you don't need to edit my main settings.json:
1. Create \`%LOCALAPPDATA%\\Microsoft\\Windows Terminal\\Fragments\\ThemeMockupStudio\\\`.
2. Write a fragment JSON file there containing the color scheme and the profile below.
3. ${bgName ? `Copy the attached \`${bgName}\` into that folder and set the profile's \`backgroundImage\` to its absolute path, with \`backgroundImageStretchMode: "uniformToFill"\` and \`backgroundImageOpacity: ${decor.strength / 100}\`.${bgName.endsWith('gif') ? ' It is an animated GIF, and Windows Terminal plays it.' : ''}` : 'No background image is needed.'}
${greetingNote ? `4. Copy \`${greetingNote}\` and \`${slug}-pet.ansi\` into the same folder, and set the profile's \`commandline\` to \`powershell.exe -NoExit -ExecutionPolicy Bypass -File "<abs path>\\${greetingNote}"\`, so the pets greet me when a tab opens.\n5.` : '4.'} Tell me to restart Windows Terminal and pick the "${t.name}" profile.`

  const prompt = `# Install my ${mac ? 'iTerm2 (macOS)' : 'Windows Terminal'} theme

I designed a terminal look in a mockup tool. Please set it up on this ${mac ? 'Mac' : 'Windows machine'}.

${BACKUP_RULE}

## What to build
${platformSteps}

## Color scheme
${json(terminalScheme(t))}
${mac ? '' : `\n## Profile\n${json({ name: t.name, ...terminalProfile(t), colorScheme: t.name })}\n`}${t.prompt === 'powerline' ? `\n## Prompt (optional)
I'd also like a powerline-style prompt with segments for user → folder → git branch, using ANSI blue, magenta and green as the segment backgrounds. Set it up with ${mac ? 'starship or oh-my-zsh' : 'oh-my-posh'} if it's installed (ask before installing anything), and use a Nerd Font if \`${t.fontFamily}\` doesn't have the glyphs.\n` : ''}
## Attached files
${assetList(a)}

## Verify
- The JSON parses, and every path in it exists.
- The profile shows up${mac ? ' in iTerm2' : ' after restarting Windows Terminal'}, and the colors match the scheme.${greetingNote ? '\n- Opening a new tab plays the pet greeting, then gives a normal prompt.' : ''}
`
  return { prompt, assets: a }
}

export async function vscodePrompt(t: VSCodeTheme, decor: Decor): Promise<PromptResult> {
  const a = await assets(decor, t.editorBg, false)
  const theme = vscodeColorTheme(t, t.name)
  const withView = decor.scene !== 'none' || decor.pets.length > 0
  const prompt = `# Build my VS Code theme extension

I designed a VS Code theme in a mockup tool. Please build it as a real **VS Code extension**, package it as a \`.vsix\`, and install it.

${BACKUP_RULE}

## Steps
1. Create a folder \`${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-theme\` containing \`package.json\` (publisher \`theme-mockup-studio\`, \`engines.vscode: "^1.80.0"\`, \`categories: ["Themes"]\`) and \`contributes.themes\` pointing to \`themes/color-theme.json\` with \`uiTheme: "${theme.type === 'light' ? 'vs' : 'vs-dark'}"\`.
2. Save the theme JSON below as \`themes/color-theme.json\`.
${withView ? `3. Also add a **webview view** called "Pixel Pets" in the Explorer (\`contributes.views.explorer\`, \`type: "webview"\`, activation \`onView:tmsPixelPets\`), written in plain JS with no build step. It should:
   - fill its background with \`${t.editorBg}\`${a['background.png'] ? ', with the attached `background.png` (copied into `media/`) shown on top using `image-rendering: pixelated` and `background-size: cover`' : ''}.
   - show the attached pet PNGs (${decor.pets.join(', ')}) at the ${decor.petPosition === 'perched' ? 'top' : decor.petPosition} with a CSS "${decor.petAnim}" animation (bob = 2-step 3px bounce, hop = squash-and-jump, walk = pace left and right, flipping direction).
   - use \`image-rendering: pixelated\` for the pets too.
   - have a proper CSP, and \`localResourceRoots\` set to \`media/\`.
4.` : '3.'} Package it with \`npx @vscode/vsce package --allow-missing-repository --skip-license\` and install it with \`code --install-extension <file>.vsix\`.
${withView ? '5.' : '4.'} Tell me to press Ctrl+K Ctrl+T and pick "${t.name}".

## Theme JSON
${json(theme)}

## Font (user settings, optional; back up settings.json first)
${json({ 'editor.fontFamily': `'${t.fontFamily}', Consolas, monospace`, 'editor.fontSize': t.fontSize, 'editor.fontLigatures': t.ligatures })}

## Attached images
${assetList(a)}
`
  return { prompt, assets: a }
}

export async function claudePrompt(t: ClaudeTheme, decor: Decor): Promise<PromptResult> {
  const a = await assets(decor, t.background, true)
  const name = `Claude ${t.baseTheme}`
  const prompt = `# Style my Claude Code setup

I designed a Claude Code color look in a mockup tool. Claude Code can't load custom color themes, but its **"ANSI colors only"** themes use the terminal's 16 ANSI colors. So the plan is a dedicated Windows Terminal profile whose palette carries my colors.

${BACKUP_RULE}

## Steps
1. Create a **Windows Terminal JSON fragment** in \`%LOCALAPPDATA%\\Microsoft\\Windows Terminal\\Fragments\\ThemeMockupStudio\\\` with:
   - the color scheme below.
   - a profile named "Claude Code (${t.baseTheme})" with \`commandline: "cmd.exe /k claude"\`, \`startingDirectory: "%USERPROFILE%"\`, \`colorScheme: "${name}"\`, and font \`${t.fontFamily}\` ${t.fontSize}pt.${a['background.png'] ? `\n   - \`backgroundImage\` set to the attached \`background.png\` (copied into that folder), with \`backgroundImageStretchMode: "uniformToFill"\` and \`backgroundImageOpacity: ${decor.strength / 100}\`.` : ''}
2. Write a Node **status line script** to \`~/.claude/theme-mockup/statusline.js\`. It reads the session JSON from stdin and prints one line using 24-bit ANSI colors:
   - ${decor.pets[0] ? `"${decor.pets[0]}" with a matching emoji` : '"✻"'} in \`${t.claude}\`
   - the model display name in \`${t.text}\`
   - the current folder's basename in \`${t.planMode}\`
   - all separated by " · " in \`${t.secondaryText}\`.
3. Back up \`~/.claude/settings.json\`, then add \`"statusLine": { "type": "command", "command": "node <path to statusline.js>" }\` without touching the other keys.
4. Tell me to restart Windows Terminal, open the new profile, run \`/theme\`, and choose **${isLight(t.background) ? 'Light' : 'Dark'} mode (ANSI colors only)**.

## Color scheme (ANSI slots → Claude roles)
red = errors, green = success, yellow = warnings, blue = permission prompts, magenta = Claude accent, cyan = plan mode, bright black = dim text, bright red/green = diff highlights.
${json(claudeScheme(t, name))}

## Attached images
${assetList(a)}
`
  return { prompt, assets: a }
}
