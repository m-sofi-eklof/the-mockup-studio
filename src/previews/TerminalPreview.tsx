import type { CSSProperties, ReactNode } from 'react'
import { Minus, Plus, Square, X } from 'lucide-react'
import type { TerminalTheme } from '../presets/terminal'
import { shade, withAlpha } from '../utils/color'
import { SceneLayer, type Decor } from '../decor/Decor'

// Powerline separator glyph (needs a Nerd Font / Cascadia Code PL to render as an arrow)
const SEP = ''
const BRANCH = ''

export function TerminalPreview({ t, decor }: { t: TerminalTheme; decor: Decor }) {
  const a = t.ansi
  const C = ({ c, b, children }: { c: number; b?: boolean; children: ReactNode }) => (
    <span style={{ color: a[c], fontWeight: b ? 700 : undefined }}>{children}</span>
  )

  const Prompt = () => {
    if (t.prompt === 'powerline') {
      return (
        <span className="pl">
          <span style={{ background: a[4], color: t.background }}> sofi </span>
          <span style={{ color: a[4], background: a[5] }}>{SEP}</span>
          <span style={{ background: a[5], color: t.background }}> ~/projects/app </span>
          <span style={{ color: a[5], background: a[2] }}>{SEP}</span>
          <span style={{ background: a[2], color: t.background }}> {BRANCH} main </span>
          <span style={{ color: a[2] }}>{SEP}</span>{' '}
        </span>
      )
    }
    if (t.prompt === 'minimal') return <C c={5} b>{'❯ '}</C>
    if (t.platform === 'macos') {
      return (
        <>
          <C c={2} b>sofi@MacBook-Air</C> <C c={4} b>app</C> <C c={6}>(main)</C> %{' '}
        </>
      )
    }
    return (
      <>
        <C c={7}>PS </C><C c={4} b>C:\Users\Sofi\projects\app</C><C c={6}> (main)</C>&gt;{' '}
      </>
    )
  }

  const cursorStyle: CSSProperties =
    t.cursorStyle === 'block'
      ? { background: t.cursorColor, width: '0.6em' }
      : t.cursorStyle === 'bar'
        ? { background: t.cursorColor, width: 2 }
        : { borderBottom: `2px solid ${t.cursorColor}`, width: '0.6em' }

  const bg = t.opacity < 100 ? withAlpha(t.background, t.opacity / 100) : t.background

  return (
    <div className="term-window" style={{ background: bg, backdropFilter: t.opacity < 100 ? 'blur(14px)' : undefined }}>
      {t.chrome === 'windows' && (
        <div className="term-titlebar win" style={{ background: shade(t.background, -14), color: t.foreground }}>
          <div className="win-tab" style={{ background: bg }}>
            <span style={{ color: a[4] }}>{'❯_'}</span> PowerShell <X size={12} />
          </div>
          <Plus size={14} style={{ opacity: 0.6, marginLeft: 8 }} />
          <div style={{ flex: 1 }} />
          <div className="win-controls">
            <Minus size={14} /> <Square size={12} /> <X size={14} />
          </div>
        </div>
      )}
      {t.chrome === 'macos' && (
        <div className="term-titlebar mac" style={{ background: shade(t.background, -14), color: t.foreground }}>
          <span className="dot" style={{ background: '#ff5f57' }} />
          <span className="dot" style={{ background: '#febc2e' }} />
          <span className="dot" style={{ background: '#28c840' }} />
          <span className="mac-title">sofi — zsh — 80×24</span>
        </div>
      )}
      <div className="term-content">
      <SceneLayer decor={decor} base={t.background} />
      <pre
        className="term-body"
        style={{
          color: t.foreground,
          fontFamily: `'${t.fontFamily}', Consolas, monospace`,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          padding: t.padding,
        }}
      >
        <Prompt />
        ls -la{'\n'}
        <C c={4} b>drwxr-xr-x</C>  <C c={3}>sofi</C>  4.0K  <C c={4} b>src/</C>{'\n'}
        <C c={4} b>drwxr-xr-x</C>  <C c={3}>sofi</C>  4.0K  <C c={4} b>node_modules/</C>{'\n'}
        -rw-r--r--  <C c={3}>sofi</C>  1.2K  package.json{'\n'}
        -rwxr-xr-x  <C c={3}>sofi</C>   512  <C c={2} b>build.sh</C>{'\n'}
        -rw-r--r--  <C c={3}>sofi</C>   88B  <span style={{ background: t.selectionBackground }}>README.md</span>{'\n'}
        {'\n'}
        <Prompt />
        git status{'\n'}
        On branch <C c={6}>main</C>{'\n'}
        Changes not staged for commit:{'\n'}
        {'  '}<C c={1}>modified:   src/App.tsx</C>{'\n'}
        {'  '}<C c={1}>deleted:    src/old.ts</C>{'\n'}
        Untracked files:{'\n'}
        {'  '}<C c={2}>src/components/</C>{'\n'}
        {'\n'}
        <Prompt />
        npm test{'\n'}
        <span style={{ background: a[2], color: t.background, fontWeight: 700 }}> PASS </span> src/app.test.ts <C c={8}>(1.2 s)</C>{'\n'}
        <span style={{ background: a[1], color: t.background, fontWeight: 700 }}> FAIL </span> src/api.test.ts{'\n'}
        <C c={3}>  {'⚠'} 1 warning</C>  <C c={9}>{'✖'} 1 failed</C>  <C c={10}>{'✔'} 12 passed</C>{'\n'}
        {'\n'}
        {a.slice(0, 8).map((c, i) => (
          <span key={i} className="ansi-block" style={{ background: c }} />
        ))}
        {'\n'}
        {a.slice(8).map((c, i) => (
          <span key={i} className="ansi-block" style={{ background: c }} />
        ))}
        {'\n\n'}
        <Prompt />
        <span className="cursor" style={cursorStyle}>
          {' '}
        </span>
      </pre>
      </div>
    </div>
  )
}
