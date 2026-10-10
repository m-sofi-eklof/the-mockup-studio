import { crlf, stableGuid, type Files } from './download'

export const FRAGMENT_APP = 'ThemeMockupStudio'
// PowerShell 5.1 reads BOM-less scripts as ANSI, which mangles non-ASCII text.
const BOM = String.fromCharCode(0xfeff)

type Options = {
  slug: string
  profileName: string
  scheme: Record<string, string>
  profile: Record<string, unknown>
  /** Background image (PNG, or an animated GIF when pets move). */
  background: { ext: 'png' | 'gif'; data: Uint8Array } | null
  backgroundOpacity?: number
  /** Extra files copied next to the fragment (names should be slug-prefixed). `__DIR__` in the profile points at them. */
  assets?: Files
  /** Extra PowerShell run after the fragment is installed. Has $src, $backupDir available. */
  extraInstall?: string
  extraUninstall?: string
  readmeExtra?: string
}

/** Builds the files for a Windows Terminal JSON-fragment install (profile + color scheme + optional background). */
export function windowsTerminalFiles(o: Options): Files {
  const bgFile = o.background ? `${o.slug}-background.${o.background.ext}` : null
  const assets: Files = { ...(o.assets ?? {}) }
  if (o.background && bgFile) assets[bgFile] = o.background.data
  const assetList = Object.keys(assets).map((n) => `'${n}'`).join(', ')
  const profile: Record<string, unknown> = {
    guid: stableGuid(`${FRAGMENT_APP}:${o.slug}`),
    name: o.profileName,
    ...o.profile,
    colorScheme: o.scheme.name,
  }
  if (bgFile) {
    profile.backgroundImage = `__DIR__\\${bgFile}`
    profile.backgroundImageStretchMode = 'uniformToFill'
    profile.backgroundImageOpacity = o.backgroundOpacity ?? 1
  }
  const fragment = JSON.stringify({ profiles: [profile], schemes: [o.scheme] }, null, 2)

  const install = BOM + crlf(`# Installs "${o.profileName}" into Windows Terminal as a JSON fragment.
# Everything it touches is backed up first to %USERPROFILE%\\theme-mockup-backups\\<timestamp>.
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$dest = Join-Path $env:LOCALAPPDATA 'Microsoft\\Windows Terminal\\Fragments\\${FRAGMENT_APP}'
$backupDir = Join-Path $env:USERPROFILE ('theme-mockup-backups\\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force $backupDir | Out-Null

# --- backups ---
$wtSettings = @(
  (Join-Path $env:LOCALAPPDATA 'Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json'),
  (Join-Path $env:LOCALAPPDATA 'Packages\\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\\LocalState\\settings.json'),
  (Join-Path $env:LOCALAPPDATA 'Microsoft\\Windows Terminal\\settings.json')
)
$i = 0
foreach ($p in $wtSettings) {
  if (Test-Path $p) { Copy-Item $p (Join-Path $backupDir "windows-terminal-settings-$i.json"); $i++ }
}
if (Test-Path $dest) { Copy-Item $dest (Join-Path $backupDir 'fragments-before') -Recurse }
Write-Host "Backed up current settings to $backupDir" -ForegroundColor DarkGray

# --- install fragment ---
New-Item -ItemType Directory -Force $dest | Out-Null
foreach ($a in @(${assetList})) {
  Copy-Item (Join-Path $src $a) (Join-Path $dest $a) -Force
}
$json = Get-Content (Join-Path $src 'fragment.json') -Raw -Encoding UTF8
$json = $json.Replace('__DIR__', ($dest -replace '\\\\', '\\\\'))
[IO.File]::WriteAllText((Join-Path $dest '${o.slug}.json'), $json, (New-Object Text.UTF8Encoding $false))
Write-Host "Installed Windows Terminal profile '${o.profileName}' -> $dest" -ForegroundColor Green
${o.extraInstall ?? ''}
Write-Host ''
Write-Host 'Restart Windows Terminal, then open the profile from the dropdown (v) next to the tabs.' -ForegroundColor Cyan
`)

  const uninstall = BOM + crlf(`$ErrorActionPreference = 'Stop'
$dest = Join-Path $env:LOCALAPPDATA 'Microsoft\\Windows Terminal\\Fragments\\${FRAGMENT_APP}'
Remove-Item (Join-Path $dest '${o.slug}.json') -ErrorAction SilentlyContinue
foreach ($a in @(${assetList})) { Remove-Item (Join-Path $dest $a) -ErrorAction SilentlyContinue }
if ((Test-Path $dest) -and -not (Get-ChildItem $dest)) { Remove-Item $dest }
Write-Host "Removed '${o.profileName}'. Restart Windows Terminal." -ForegroundColor Green
${o.extraUninstall ?? ''}
`)

  const readme = crlf(`${o.profileName}
${'='.repeat(o.profileName.length)}

Install (from this unzipped folder):
  powershell -ExecutionPolicy Bypass -File .\\install.ps1

Then restart Windows Terminal and pick "${o.profileName}" from the new-tab dropdown.
To make it your default: Settings > Startup > Default profile.

Uninstall:
  powershell -ExecutionPolicy Bypass -File .\\uninstall.ps1

Backups of anything changed are written to %USERPROFILE%\\theme-mockup-backups\\<timestamp>\\
${o.readmeExtra ?? ''}`)

  const files: Files = {
    'fragment.json': fragment,
    'install.ps1': install,
    'uninstall.ps1': uninstall,
    'README.txt': readme,
  }
  return { ...files, ...assets }
}
