export const ANSI_NAMES = [
  'black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightPurple', 'brightCyan', 'brightWhite',
] as const

export const CURSOR_STYLES = ['block', 'bar', 'underline'] as const
export const CHROMES = ['windows', 'macos', 'none'] as const
export const PROMPTS = ['plain', 'powerline', 'minimal'] as const
export const PLATFORMS = ['windows', 'macos'] as const
export type Platform = (typeof PLATFORMS)[number]

export const PLATFORM_INFO: Record<Platform, { label: string; app: string; chromes: (typeof CHROMES)[number][]; fonts: string[] }> = {
  windows: {
    label: 'Windows',
    app: 'Windows Terminal',
    chromes: ['windows', 'none'],
    fonts: ['Cascadia Code', 'Cascadia Mono', 'Consolas', 'JetBrains Mono', 'Fira Code', 'Courier New'],
  },
  macos: {
    label: 'macOS',
    app: 'iTerm2',
    chromes: ['macos', 'none'],
    fonts: ['SF Mono', 'Menlo', 'Monaco', 'JetBrains Mono', 'Fira Code', 'Courier New'],
  },
}

export type TerminalTheme = {
  platform: Platform
  name: string
  background: string
  foreground: string
  cursorColor: string
  selectionBackground: string
  ansi: string[]
  cursorStyle: (typeof CURSOR_STYLES)[number]
  fontFamily: string
  fontSize: number
  lineHeight: number
  padding: number
  opacity: number
  chrome: (typeof CHROMES)[number]
  prompt: (typeof PROMPTS)[number]
}

const base = {
  platform: 'windows',
  cursorStyle: 'bar',
  fontFamily: 'Cascadia Code',
  fontSize: 14,
  lineHeight: 1.4,
  padding: 14,
  opacity: 100,
  chrome: 'windows',
  prompt: 'powerline',
} as const

export const terminalPresets: Record<string, TerminalTheme> = {
  Dracula: {
    ...base,
    name: 'Dracula',
    background: '#282a36', foreground: '#f8f8f2', cursorColor: '#f8f8f2', selectionBackground: '#44475a',
    ansi: ['#21222c', '#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#f8f8f2',
      '#6272a4', '#ff6e6e', '#69ff94', '#ffffa5', '#d6acff', '#ff92df', '#a4ffff', '#ffffff'],
  },
  'One Dark': {
    ...base,
    name: 'One Dark',
    background: '#282c34', foreground: '#abb2bf', cursorColor: '#528bff', selectionBackground: '#3e4451',
    ansi: ['#282c34', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#abb2bf',
      '#5c6370', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#ffffff'],
  },
  'Solarized Dark': {
    ...base,
    name: 'Solarized Dark',
    background: '#002b36', foreground: '#839496', cursorColor: '#93a1a1', selectionBackground: '#073642',
    ansi: ['#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
      '#002b36', '#cb4b16', '#586e75', '#657b83', '#839496', '#6c71c4', '#93a1a1', '#fdf6e3'],
  },
  Gruvbox: {
    ...base,
    name: 'Gruvbox',
    background: '#282828', foreground: '#ebdbb2', cursorColor: '#ebdbb2', selectionBackground: '#504945',
    ansi: ['#282828', '#cc241d', '#98971a', '#d79921', '#458588', '#b16286', '#689d6a', '#a89984',
      '#928374', '#fb4934', '#b8bb26', '#fabd2f', '#83a598', '#d3869b', '#8ec07c', '#ebdbb2'],
  },
  Campbell: {
    ...base,
    name: 'Campbell',
    background: '#0c0c0c', foreground: '#cccccc', cursorColor: '#ffffff', selectionBackground: '#3a3a3a',
    ansi: ['#0c0c0c', '#c50f1f', '#13a10e', '#c19c00', '#0037da', '#881798', '#3a96dd', '#cccccc',
      '#767676', '#e74856', '#16c60c', '#f9f1a5', '#3b78ff', '#b4009e', '#61d6d6', '#f2f2f2'],
  },
  // Sofi's own design: Dracula's brights on a deep plum background.
  'Plum Night': {
    ...base,
    name: 'Plum Night',
    background: '#2f0a24', foreground: '#f8f8f2', cursorColor: '#f8f8f2', selectionBackground: '#833162',
    ansi: ['#21222c', '#86043a', '#3c5843', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#f8f8f2',
      '#6272a4', '#f5347e', '#62c395', '#ffffa5', '#d6acff', '#ff92df', '#a4ffff', '#ffffff'],
  },
}

export const defaultTerminal = terminalPresets.Dracula

export function toWindowsTerminalScheme(t: TerminalTheme) {
  const scheme: Record<string, string> = {
    name: t.name,
    background: t.background,
    foreground: t.foreground,
    cursorColor: t.cursorColor,
    selectionBackground: t.selectionBackground,
  }
  ANSI_NAMES.forEach((n, i) => (scheme[n] = t.ansi[i]))
  return JSON.stringify(
    {
      schemes: [scheme],
      profiles: {
        defaults: {
          colorScheme: t.name,
          cursorShape: t.cursorStyle === 'block' ? 'filledBox' : t.cursorStyle,
          opacity: t.opacity,
          padding: String(t.padding),
          font: { face: t.fontFamily, size: t.fontSize, cellHeight: String(t.lineHeight) },
        },
      },
    },
    null,
    2,
  )
}
