import type { CSSProperties } from 'react'
import {
  ArrowLeft, ArrowRight, Bell, Blocks, Braces, Bug, ChevronDown, ChevronRight, CircleAlert, Ellipsis, Files, FileCode,
  GitBranch, Minus, PanelBottom, PanelLeft, PanelRight, Search, Settings, Square, TriangleAlert, User, X,
} from 'lucide-react'
import type { TokenKey, VSCodeTheme } from '../presets/vscode'
import { vscodeColorTheme } from '../export/vscode'
import { mix } from '../utils/color'
import { PixelPet, type Decor } from '../decor/Decor'
import { sceneUrl } from '../decor/scenes'

type Tok = [TokenKey | 'plain', string]

// Hand-tokenised sample so no highlighter dependency is needed.
const CODE: Tok[][] = [
  [['comment', '// Fetch a user and greet them']],
  [['keyword', 'import'], ['plain', ' '], ['punctuation', '{'], ['variable', ' useState '], ['punctuation', '}'], ['plain', ' '], ['keyword', 'from'], ['plain', ' '], ['string', "'react'"]],
  [],
  [['keyword', 'interface'], ['plain', ' '], ['type', 'User'], ['plain', ' '], ['punctuation', '{']],
  [['plain', '  '], ['variable', 'id'], ['punctuation', ':'], ['plain', ' '], ['type', 'number']],
  [['plain', '  '], ['variable', 'name'], ['punctuation', ':'], ['plain', ' '], ['type', 'string']],
  [['punctuation', '}']],
  [],
  [['keyword', 'export'], ['plain', ' '], ['keyword', 'async'], ['plain', ' '], ['keyword', 'function'], ['plain', ' '], ['function', 'greet'], ['punctuation', '('], ['variable', 'id'], ['punctuation', ':'], ['plain', ' '], ['type', 'number'], ['punctuation', ')'], ['plain', ' '], ['punctuation', '{']],
  [['plain', '  '], ['keyword', 'const'], ['plain', ' '], ['variable', 'res'], ['plain', ' '], ['punctuation', '='], ['plain', ' '], ['keyword', 'await'], ['plain', ' '], ['function', 'fetch'], ['punctuation', '('], ['string', '`/api/users/${'], ['variable', 'id'], ['string', '}`'], ['punctuation', ')']],
  [['plain', '  '], ['keyword', 'const'], ['plain', ' '], ['variable', 'user'], ['punctuation', ':'], ['plain', ' '], ['type', 'User'], ['plain', ' '], ['punctuation', '='], ['plain', ' '], ['keyword', 'await'], ['plain', ' '], ['variable', 'res'], ['punctuation', '.'], ['function', 'json'], ['punctuation', '()']],
  [['plain', '  '], ['keyword', 'if'], ['plain', ' '], ['punctuation', '('], ['variable', 'user'], ['punctuation', '.'], ['variable', 'id'], ['plain', ' '], ['punctuation', '!=='], ['plain', ' '], ['number', '42'], ['punctuation', ')'], ['plain', ' '], ['keyword', 'return'], ['plain', ' '], ['keyword', 'null']],
  [['plain', '  '], ['keyword', 'return'], ['plain', ' '], ['string', '`Hello, ${'], ['variable', 'user'], ['punctuation', '.'], ['variable', 'name'], ['string', '}!`'], ['plain', ' '], ['comment', '// => greeting']],
  [['punctuation', '}']],
  [],
  [['keyword', 'const'], ['plain', ' '], ['variable', 'ratio'], ['plain', ' '], ['punctuation', '='], ['plain', ' '], ['number', '0.75'], ['plain', ' '], ['punctuation', '*'], ['plain', ' '], ['number', '100']],
  [],
  // Tag names and the text between tags have no token color, so they show the plain editor text color.
  [['keyword', 'export'], ['plain', ' '], ['keyword', 'const'], ['plain', ' '], ['function', 'Hello'], ['plain', ' '], ['punctuation', '='], ['plain', ' '], ['punctuation', '()'], ['plain', ' '], ['keyword', '=>'], ['plain', ' '], ['punctuation', '<'], ['plain', 'p'], ['punctuation', '>'], ['plain', 'Plain text looks like this'], ['punctuation', '</'], ['plain', 'p'], ['punctuation', '>']],
]

const ACTIVE_LINE = 10
const SELECTED_LINE = 12

// Colors VS Code fills in itself because the exported theme doesn't set them. They depend on whether the
// theme counts as light or dark (decided by the editor background).
const BUILTIN = {
  light: {
    icon: '#424242', border: '#c8c8c8', panelInactive: ['#424242', 0.75], brackets: ['#0431fa', '#319331', '#7b3814'],
    ansi: { green: '#00bc00', blue: '#0451a5', cyan: '#0598bc' },
  },
  dark: {
    icon: '#c5c5c5', border: '#ffffff', panelInactive: ['#e7e7e7', 0.6], brackets: ['#ffd700', '#da70d6', '#179fff'],
    ansi: { green: '#0dbc79', blue: '#2472c8', cyan: '#11a8cd' },
  },
} as const

// File icons come from the icon theme (Seti), not the color theme.
const SETI = { ts: '#519aba', json: '#cbcb41' }

const pixelated: CSSProperties = { imageRendering: 'pixelated', backgroundSize: 'cover', backgroundPosition: 'center' }

export function VSCodePreview({ t, decor }: { t: VSCodeTheme; decor: Decor }) {
  // Read colors from the theme file the app would export, so the mockup can't drift from it.
  const theme = vscodeColorTheme(t, t.name)
  const c = theme.colors
  const d = BUILTIN[theme.type === 'light' ? 'light' : 'dark']
  const fg = c.foreground
  const titleBg = c['titleBar.activeBackground']
  const titleFg = c['titleBar.activeForeground']
  const editorBg = c['editor.background']
  const panelBg = c['panel.background']

  const mono = `'${t.fontFamily}', Consolas, monospace`
  const scene = sceneUrl(decor.scene, t.editorBg)
  const sceneStyle: CSSProperties | undefined = scene
    ? { ...pixelated, backgroundImage: `url(${scene})`, opacity: decor.strength / 100 }
    : undefined
  const hasPetsView = !!scene || decor.pets.length > 0

  // Brackets are colored by nesting depth (bracket pair colorization is on by default).
  let depth = 0
  const lines = CODE.map((line) =>
    line.flatMap(([k, s]): { color: string; text: string; italic?: boolean }[] => {
      if (k === 'plain') return [{ color: c['editor.foreground'], text: s }]
      if (k !== 'punctuation') return [{ color: t[k], text: s, italic: k === 'comment' && t.italicComments }]
      return [...s].map((ch) => {
        if ('([{'.includes(ch)) return { color: d.brackets[depth++ % 3], text: ch }
        if (')]}'.includes(ch)) return { color: d.brackets[(depth = Math.max(0, depth - 1)) % 3], text: ch }
        return { color: t.punctuation, text: ch }
      })
    }),
  )

  const vars = {
    '--vs-card-border': mix(d.border, editorBg, 0.1),
    '--vs-selection': c['list.inactiveSelectionBackground'],
    '--vs-hover': c['list.hoverBackground'],
    '--vs-icon': d.icon,
    '--vs-act-fg': c['activityBar.foreground'],
    '--vs-act-inactive': c['activityBar.inactiveForeground'],
    background: titleBg,
    color: fg,
  } as CSSProperties

  const petRow: CSSProperties = {
    [decor.petPosition === 'perched' ? 'top' : 'bottom']: 12,
    ...(decor.petAnim === 'walk' ? {} : { [decor.petPosition === 'bottom-left' ? 'left' : 'right']: 12 }),
  }

  return (
    <div className="vs-window" style={vars}>
      <div className="vs-titlebar" style={{ color: titleFg }}>
        <div className="vs-menu">
          <span>File</span><span>Edit</span><span>Selection</span><span>View</span><span>Go</span><span>Run</span>
          <Ellipsis size={14} />
        </div>
        <div className="vs-nav">
          <ArrowLeft size={15} /> <ArrowRight size={15} style={{ opacity: 0.5 }} />
        </div>
        <div className="vs-search" style={{ borderColor: mix(titleFg, titleBg, 0.2), color: mix(titleFg, titleBg, 0.6) }}>my-app</div>
        <div style={{ flex: 1 }} />
        <div className="vs-layout">
          <PanelLeft size={15} /> <PanelBottom size={15} /> <PanelRight size={15} />
        </div>
        <div className="vs-wincontrols">
          <Minus size={14} /> <Square size={11} /> <X size={15} />
        </div>
      </div>

      <div className="vs-main">
        <div className="vs-card vs-left">
          <div className="vs-activity" style={{ background: c['activityBar.background'] }}>
            <div className="vs-act active"><Files size={20} /></div>
            <div className="vs-act"><Search size={20} /></div>
            <div className="vs-act"><GitBranch size={20} /></div>
            <div className="vs-act"><Bug size={20} /></div>
            <div className="vs-act">
              <Blocks size={20} />
              <span className="vs-badge" style={{ background: c['activityBarBadge.background'] }}>2</span>
            </div>
            <div style={{ flex: 1 }} />
            <div className="vs-act"><User size={20} /></div>
            <div className="vs-act"><Settings size={20} /></div>
          </div>

          <div className="vs-sidebar" style={{ background: c['sideBar.background'], color: c['sideBar.foreground'] }}>
            <div className="vs-sidebar-title">
              Explorer <Ellipsis size={14} className="vs-twisty" />
            </div>
            <div className="vs-section first"><ChevronDown size={14} className="vs-twisty" /> my-app</div>
            <div className="vs-tree">
              <div className="row" style={{ paddingLeft: 14 }}><ChevronRight size={14} className="vs-twisty" /> node_modules</div>
              <div className="row" style={{ paddingLeft: 14 }}><ChevronDown size={14} className="vs-twisty" /> src</div>
              <div className="row selected" style={{ paddingLeft: 32 }}><FileCode size={14} color={SETI.ts} /> greet.tsx</div>
              <div className="row" style={{ paddingLeft: 32 }}><FileCode size={14} color={SETI.ts} /> App.tsx</div>
              <div className="row" style={{ paddingLeft: 32 }}><FileCode size={14} color={SETI.ts} /> main.tsx</div>
              <div className="row" style={{ paddingLeft: 14 }}><Braces size={14} color={SETI.json} /> package.json</div>
              <div className="row" style={{ paddingLeft: 14 }}><FileCode size={14} color={SETI.ts} /> README.md</div>
            </div>
            <div className="vs-section"><ChevronRight size={14} className="vs-twisty" /> Outline</div>
            <div className="vs-section"><ChevronRight size={14} className="vs-twisty" /> Timeline</div>
            {hasPetsView && (
              <>
                <div className="vs-section"><ChevronDown size={14} className="vs-twisty" /> Pixel Pets</div>
                <div className="vs-pets" style={{ background: t.editorBg }}>
                  {sceneStyle && <div className="scene-layer" style={sceneStyle} />}
                  {decor.pets.length > 0 && (
                    <div className={`pet-row anim-${decor.petAnim}`} style={petRow}>
                      {decor.pets.map((p, i) => (
                        <div key={p} className="pet" style={{ animationDelay: `${i * 0.18}s` }}>
                          <PixelPet name={p} scale={decor.petScale} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="vs-right">
          <div className="vs-card vs-editor-col" style={{ background: editorBg, color: c['editor.foreground'] }}>
            <div className="vs-tabs" style={{ background: c['editorGroupHeader.tabsBackground'] }}>
              {/* The current VS Code look draws the open tab in the editor color, not tab.activeBackground. */}
              <div className="vs-tab active" style={{ background: editorBg, color: fg }}>
                <FileCode size={14} color={SETI.ts} /> greet.tsx <X size={13} />
              </div>
              <div className="vs-tab" style={{ background: c['tab.inactiveBackground'], color: c['tab.inactiveForeground'] }}>
                <FileCode size={14} color={SETI.ts} /> App.tsx
              </div>
            </div>
            <div className="vs-breadcrumbs" style={{ color: mix(fg, editorBg, 0.8) }}>src › greet.tsx › greet</div>

            <div
              className="vs-code"
              style={{
                fontFamily: mono,
                fontSize: t.fontSize,
                fontVariantLigatures: t.ligatures ? 'normal' : 'none',
                fontFeatureSettings: t.ligatures ? '"calt" 1, "liga" 1' : '"calt" 0, "liga" 0',
              }}
            >
              {decor.behindCode && sceneStyle && <div className="scene-layer" style={sceneStyle} />}
              {lines.map((line, i) => {
                const n = i + 1
                return (
                  <div key={i} className="vs-line">
                    <span className="ln" style={{ color: n === ACTIVE_LINE ? c['editorLineNumber.activeForeground'] : c['editorLineNumber.foreground'] }}>{n}</span>
                    <span className="code" style={{ background: n === ACTIVE_LINE ? c['editor.lineHighlightBackground'] : undefined }}>
                      <span style={{ background: n === SELECTED_LINE ? c['editor.selectionBackground'] : undefined }}>
                        {line.map((s, j) => (
                          <span key={j} style={{ color: s.color, fontStyle: s.italic ? 'italic' : undefined }}>{s.text}</span>
                        ))}
                      </span>
                      {n === ACTIVE_LINE && <span className="vs-cursor" style={{ background: c['editorCursor.foreground'] }} />}
                      {line.length === 0 && '\u00A0'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="vs-card vs-panel" style={{ background: panelBg }}>
            <div className="vs-panel-tabs" style={{ color: mix(d.panelInactive[0], panelBg, d.panelInactive[1]) }}>
              <span>Problems</span><span>Output</span><span>Debug Console</span>
              <span style={{ background: 'var(--vs-selection)', color: fg }}>Terminal</span>
              <span>Ports</span>
            </div>
            <pre style={{ fontFamily: mono, color: c['terminal.foreground'] }}>
              PS C:\my-app&gt; npm run dev{'\n'}
              {'  '}<span style={{ color: d.ansi.green }}>VITE</span> ready in <b>212 ms</b>{'\n'}
              {'  '}<span style={{ color: d.ansi.green }}>➜</span>  Local: <span style={{ color: d.ansi.cyan }}>http://localhost:5173/</span>
            </pre>
          </div>
        </div>
      </div>

      <div className="vs-statusbar" style={{ background: c['statusBar.background'], color: c['statusBar.foreground'] }}>
        <span><GitBranch size={12} /> main*</span>
        <span><CircleAlert size={12} /> 0 <TriangleAlert size={12} /> 2</span>
        <div style={{ flex: 1 }} />
        <span>Ln {ACTIVE_LINE}, Col 42</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span>TypeScript</span>
        <Bell size={12} />
      </div>
    </div>
  )
}
