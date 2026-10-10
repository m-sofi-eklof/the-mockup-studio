import { mix } from '../utils/color'

export const WORKBENCH_KEYS = {
  editorBg: { label: 'Editor background', key: 'editor.background' },
  editorFg: { label: 'Editor text (plain)', key: 'editor.foreground' },
  sidebarBg: { label: 'Sidebar background', key: 'sideBar.background' },
  sidebarFg: { label: 'Sidebar & window text', key: 'sideBar.foreground' },
  listSelection: { label: 'Selected item', key: 'list.inactiveSelectionBackground' },
  listHover: { label: 'Hovered item', key: 'list.hoverBackground' },
  activityBarBg: { label: 'Activity bar', key: 'activityBar.background' },
  activityBarFg: { label: 'Activity bar icons', key: 'activityBar.foreground' },
  activityBarInactiveFg: { label: 'Inactive bar icons', key: 'activityBar.inactiveForeground' },
  titleBarBg: { label: 'Title bar', key: 'titleBar.activeBackground' },
  tabActiveBg: { label: 'Active tab', key: 'tab.activeBackground' },
  tabInactiveBg: { label: 'Inactive tab', key: 'tab.inactiveBackground' },
  tabInactiveFg: { label: 'Inactive tab text', key: 'tab.inactiveForeground' },
  tabBorder: { label: 'Active tab accent', key: 'tab.activeBorderTop' },
  statusBarBg: { label: 'Status bar', key: 'statusBar.background' },
  statusBarFg: { label: 'Status bar text', key: 'statusBar.foreground' },
  lineNumber: { label: 'Line numbers', key: 'editorLineNumber.foreground' },
  lineNumberActive: { label: 'Active line number', key: 'editorLineNumber.activeForeground' },
  lineHighlight: { label: 'Current line', key: 'editor.lineHighlightBackground' },
  selection: { label: 'Selection', key: 'editor.selectionBackground' },
  cursor: { label: 'Cursor', key: 'editorCursor.foreground' },
  panelBg: { label: 'Panel / terminal', key: 'panel.background' },
  panelBorder: { label: 'Panel border', key: 'panel.border' },
  terminalFg: { label: 'Terminal text', key: 'terminal.foreground' },
} as const

export const TOKEN_KEYS = {
  keyword: { label: 'Keyword', scope: 'keyword' },
  string: { label: 'String', scope: 'string' },
  function: { label: 'Function', scope: 'entity.name.function' },
  variable: { label: 'Variable', scope: 'variable' },
  type: { label: 'Type', scope: 'entity.name.type' },
  number: { label: 'Number', scope: 'constant.numeric' },
  comment: { label: 'Comment', scope: 'comment' },
  punctuation: { label: 'Punctuation', scope: 'punctuation' },
} as const

export type WorkbenchKey = keyof typeof WORKBENCH_KEYS
export type TokenKey = keyof typeof TOKEN_KEYS

export type VSCodeTheme = Record<WorkbenchKey, string> &
  Record<TokenKey, string> & {
    name: string
    fontFamily: string
    fontSize: number
    ligatures: boolean
    italicComments: boolean
  }

// Colors that used to be worked out from the others. They are filled in when a preset or saved theme doesn't have them.
type DerivedKey = 'activityBarInactiveFg' | 'listSelection' | 'listHover' | 'tabInactiveFg' | 'panelBorder' | 'terminalFg'
type VSCodeBase = Omit<VSCodeTheme, DerivedKey>
/** A theme whose derived colors may be left out (they are filled in) or set explicitly. */
type VSCodeInput = VSCodeBase & Partial<Pick<VSCodeTheme, DerivedKey>>

const DERIVED: Record<DerivedKey, (t: VSCodeBase) => string> = {
  activityBarInactiveFg: (t) => mix(t.activityBarFg, t.activityBarBg, 0.5),
  listSelection: (t) => t.selection,
  listHover: (t) => mix(t.selection, t.sidebarBg, 0.35),
  tabInactiveFg: (t) => mix(t.editorFg, t.tabInactiveBg, 0.55),
  panelBorder: (t) => mix(t.editorFg, t.panelBg, 0.15),
  // Terminal text used to follow the editor text color; it is its own field now.
  terminalFg: (t) => t.editorFg,
}

export function completeVSCode(t: VSCodeInput): VSCodeTheme {
  const out = { ...t } as VSCodeTheme
  for (const k of Object.keys(DERIVED) as DerivedKey[]) out[k] = t[k] ?? DERIVED[k](t)
  return out
}

const font = { fontFamily: 'Cascadia Code', fontSize: 14, ligatures: true, italicComments: true }

const basePresets: Record<string, VSCodeInput> = {
  'Dark+': {
    ...font,
    name: 'My Dark+',
    editorBg: '#1e1e1e', editorFg: '#d4d4d4', sidebarBg: '#252526', sidebarFg: '#cccccc',
    activityBarBg: '#333333', activityBarFg: '#ffffff', titleBarBg: '#3c3c3c',
    tabActiveBg: '#1e1e1e', tabInactiveBg: '#2d2d2d', tabBorder: '#007acc',
    statusBarBg: '#007acc', statusBarFg: '#ffffff', lineNumber: '#858585', lineNumberActive: '#c6c6c6',
    lineHighlight: '#2a2d2e', selection: '#264f78', cursor: '#aeafad', panelBg: '#1e1e1e',
    keyword: '#569cd6', string: '#ce9178', function: '#dcdcaa', variable: '#9cdcfe', type: '#4ec9b0',
    number: '#b5cea8', comment: '#6a9955', punctuation: '#d4d4d4',
  },
  'Light+': {
    ...font,
    name: 'My Light+',
    editorBg: '#ffffff', editorFg: '#000000', sidebarBg: '#f3f3f3', sidebarFg: '#616161',
    activityBarBg: '#2c2c2c', activityBarFg: '#ffffff', titleBarBg: '#dddddd',
    tabActiveBg: '#ffffff', tabInactiveBg: '#ececec', tabBorder: '#005fb8',
    statusBarBg: '#007acc', statusBarFg: '#ffffff', lineNumber: '#237893', lineNumberActive: '#0b216f',
    lineHighlight: '#f5f5f5', selection: '#add6ff', cursor: '#000000', panelBg: '#ffffff',
    keyword: '#0000ff', string: '#a31515', function: '#795e26', variable: '#001080', type: '#267f99',
    number: '#098658', comment: '#008000', punctuation: '#000000',
  },
  Monokai: {
    ...font,
    name: 'My Monokai',
    editorBg: '#272822', editorFg: '#f8f8f2', sidebarBg: '#1e1f1c', sidebarFg: '#cccccc',
    activityBarBg: '#272822', activityBarFg: '#f8f8f2', titleBarBg: '#1e1f1c',
    tabActiveBg: '#272822', tabInactiveBg: '#34352f', tabBorder: '#f92672',
    statusBarBg: '#414339', statusBarFg: '#f8f8f2', lineNumber: '#90908a', lineNumberActive: '#c2c2bf',
    lineHighlight: '#3e3d32', selection: '#49483e', cursor: '#f8f8f0', panelBg: '#1e1f1c',
    keyword: '#f92672', string: '#e6db74', function: '#a6e22e', variable: '#f8f8f2', type: '#66d9ef',
    number: '#ae81ff', comment: '#88846f', punctuation: '#f8f8f2',
  },
  'Night Owl': {
    ...font,
    name: 'My Night Owl',
    editorBg: '#011627', editorFg: '#d6deeb', sidebarBg: '#011627', sidebarFg: '#89a4bb',
    activityBarBg: '#011627', activityBarFg: '#5f7e97', titleBarBg: '#011627',
    tabActiveBg: '#0b2942', tabInactiveBg: '#01111d', tabBorder: '#7fdbca',
    statusBarBg: '#011627', statusBarFg: '#5f7e97', lineNumber: '#4b6479', lineNumberActive: '#c5e4fd',
    lineHighlight: '#0b2942', selection: '#1d3b53', cursor: '#80a4c2', panelBg: '#011627',
    keyword: '#c792ea', string: '#ecc48d', function: '#82aaff', variable: '#d6deeb', type: '#ffcb8b',
    number: '#f78c6c', comment: '#637777', punctuation: '#7fdbca',
  },
  // Sofi's own designs.
  'Coquette Bunny Light': {
    ...font,
    name: 'coquette-bunny-light',
    editorBg: '#ffffff', editorFg: '#5d113c', sidebarBg: '#c7bebe', sidebarFg: '#716151',
    activityBarBg: '#35302a', activityBarFg: '#ffffff', titleBarBg: '#130a0a', tabActiveBg: '#efe5e5',
    tabInactiveBg: '#c2b5b1', tabBorder: '#dc95d6', statusBarBg: '#141110', statusBarFg: '#ffbeee',
    lineNumber: '#6b4343', lineNumberActive: '#910687', lineHighlight: '#ffffff', selection: '#addaff',
    cursor: '#addaff', panelBg: '#c7bebe', keyword: '#5d113c', string: '#a9108f',
    function: '#9f06ac', variable: '#a52d7f', type: '#d600a6', number: '#9c497a',
    comment: '#662194', punctuation: '#a10587', activityBarInactiveFg: '#ffffff', listSelection: '#addaff',
    listHover: '#dbe9f7', tabInactiveFg: '#2a2929', panelBorder: '#000000', terminalFg: '#5d113c',
  },
  'Coquette Bunny Dark': {
    ...font,
    name: 'coquette-bunny-dark',
    editorBg: '#282020', editorFg: '#f8f3f6', sidebarBg: '#191111', sidebarFg: '#ddceca',
    activityBarBg: '#0e0909', activityBarFg: '#ffffff', titleBarBg: '#0e0909', tabActiveBg: '#efe5e5',
    tabInactiveBg: '#c2b5b1', tabBorder: '#dc95d6', statusBarBg: '#141110', statusBarFg: '#ffbeee',
    lineNumber: '#6b4343', lineNumberActive: '#910687', lineHighlight: '#211818', selection: '#27091b',
    cursor: '#addaff', panelBg: '#191111', keyword: '#f8a4d3', string: '#b26ca5',
    function: '#ef8cf8', variable: '#c4bdc2', type: '#ff38d2', number: '#9c497a',
    comment: '#c165fe', punctuation: '#e5d8e3', activityBarInactiveFg: '#ffffff', listSelection: '#440538',
    listHover: '#b6457e', tabInactiveFg: '#2a2929', panelBorder: '#000000', terminalFg: '#f8a4d3',
  },
}

export const vscodePresets: Record<string, VSCodeTheme> = Object.fromEntries(
  Object.entries(basePresets).map(([name, p]) => [name, completeVSCode(p)]),
)

export const defaultVSCode = vscodePresets['Dark+']

/** Turns a saved theme (possibly from before some colors were pickable) into a full one. */
export const loadVSCode = (saved: Partial<VSCodeTheme>) => completeVSCode({ ...basePresets['Dark+'], ...saved })

export function toVSCodeSettings(t: VSCodeTheme) {
  const workbench: Record<string, string> = {}
  for (const [k, v] of Object.entries(WORKBENCH_KEYS)) workbench[v.key] = t[k as WorkbenchKey]
  workbench['tab.activeForeground'] = t.editorFg
  workbench['titleBar.activeForeground'] = t.sidebarFg

  const textMateRules = Object.entries(TOKEN_KEYS).map(([k, v]) => ({
    scope: v.scope,
    settings: {
      foreground: t[k as TokenKey],
      ...(k === 'comment' && t.italicComments ? { fontStyle: 'italic' } : {}),
    },
  }))

  return JSON.stringify(
    {
      'editor.fontFamily': `'${t.fontFamily}', Consolas, monospace`,
      'editor.fontSize': t.fontSize,
      'editor.fontLigatures': t.ligatures,
      'workbench.colorCustomizations': workbench,
      'editor.tokenColorCustomizations': { textMateRules },
    },
    null,
    2,
  )
}
