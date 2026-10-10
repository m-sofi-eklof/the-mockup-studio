export const CLAUDE_COLOR_KEYS = {
  background: 'Terminal background',
  text: 'Text',
  secondaryText: 'Dim / secondary text',
  claude: 'Claude accent',
  userMessageBg: 'User message background',
  inputBorder: 'Input box border',
  success: 'Success / tool bullet',
  error: 'Error',
  warning: 'Warning',
  permission: 'Permission prompt',
  planMode: 'Plan mode',
  diffAdded: 'Diff added (line)',
  diffRemoved: 'Diff removed (line)',
  diffAddedWord: 'Diff added (word)',
  diffRemovedWord: 'Diff removed (word)',
} as const

export type ClaudeColorKey = keyof typeof CLAUDE_COLOR_KEYS

export type ClaudeTheme = Record<ClaudeColorKey, string> & {
  baseTheme: string
  fontFamily: string
  fontSize: number
}

const font = { fontFamily: 'Cascadia Code', fontSize: 14 }

// Approximations of Claude Code's built-in /theme options.
export const claudePresets: Record<string, ClaudeTheme> = {
  Dark: {
    ...font, baseTheme: 'dark',
    background: '#1a1a1a', text: '#ffffff', secondaryText: '#999999', claude: '#d77757',
    userMessageBg: '#373737', inputBorder: '#888888', success: '#4eba65', error: '#ff6b80',
    warning: '#ffc107', permission: '#b1b9f9', planMode: '#48968c',
    diffAdded: '#225c2b', diffRemoved: '#7a2936', diffAddedWord: '#38a660', diffRemovedWord: '#b3596b',
  },
  Light: {
    ...font, baseTheme: 'light',
    background: '#ffffff', text: '#000000', secondaryText: '#666666', claude: '#d77757',
    userMessageBg: '#f0f0f0', inputBorder: '#999999', success: '#2c7a39', error: '#ab2b3f',
    warning: '#966c1e', permission: '#5769f7', planMode: '#006666',
    diffAdded: '#69db7c', diffRemoved: '#ffa8b4', diffAddedWord: '#2f9d44', diffRemovedWord: '#d1454b',
  },
  'Dark (colorblind)': {
    ...font, baseTheme: 'dark-daltonized',
    background: '#1a1a1a', text: '#ffffff', secondaryText: '#999999', claude: '#ff9933',
    userMessageBg: '#373737', inputBorder: '#888888', success: '#3399ff', error: '#ff6666',
    warning: '#ffcc00', permission: '#99ccff', planMode: '#66cccc',
    diffAdded: '#004466', diffRemoved: '#660000', diffAddedWord: '#0077b3', diffRemovedWord: '#b30000',
  },
  'Light (colorblind)': {
    ...font, baseTheme: 'light-daltonized',
    background: '#ffffff', text: '#000000', secondaryText: '#666666', claude: '#ff9933',
    userMessageBg: '#f0f0f0', inputBorder: '#999999', success: '#006699', error: '#cc0000',
    warning: '#ff9900', permission: '#3366ff', planMode: '#336666',
    diffAdded: '#99ccff', diffRemoved: '#ffcccc', diffAddedWord: '#3399ff', diffRemovedWord: '#ff6666',
  },
  'Dark (ANSI)': {
    ...font, baseTheme: 'dark-ansi',
    background: '#0c0c0c', text: '#f2f2f2', secondaryText: '#767676', claude: '#e74856',
    userMessageBg: '#3a3a3a', inputBorder: '#767676', success: '#16c60c', error: '#e74856',
    warning: '#f9f1a5', permission: '#3b78ff', planMode: '#61d6d6',
    diffAdded: '#13a10e', diffRemoved: '#c50f1f', diffAddedWord: '#16c60c', diffRemovedWord: '#e74856',
  },
  // Sofi's own design: pink text on near-black.
  'Pink Noir': {
    ...font, baseTheme: 'dark',
    background: '#1c1515', text: '#ffb2e0', secondaryText: '#ff9ad9', claude: '#d757b6',
    userMessageBg: '#373737', inputBorder: '#888888', success: '#9ff1d1', error: '#fa0aae',
    warning: '#98c5f0', permission: '#c38ff6', planMode: '#48968c',
    diffAdded: '#18221a', diffRemoved: '#49012c', diffAddedWord: '#38a660', diffRemovedWord: '#b3596b',
  },
}

export const defaultClaude = claudePresets.Dark

export function toClaudeSummary(t: ClaudeTheme) {
  const colors: Record<string, string> = {}
  for (const k of Object.keys(CLAUDE_COLOR_KEYS) as ClaudeColorKey[]) colors[k] = t[k]
  return JSON.stringify(
    {
      _note: 'Claude Code only ships built-in themes (/theme). Closest built-in shown as "theme"; colors are a reference mockup.',
      theme: t.baseTheme,
      font: { family: t.fontFamily, size: t.fontSize },
      colors,
    },
    null,
    2,
  )
}
