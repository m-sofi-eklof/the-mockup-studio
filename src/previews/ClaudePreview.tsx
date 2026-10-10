import type { ReactNode } from 'react'
import type { ClaudeTheme } from '../presets/claude'
import { SceneLayer, type Decor } from '../decor/Decor'

export function ClaudePreview({ t, decor }: { t: ClaudeTheme; decor: Decor }) {
  const S = ({ c, b, i, bg, children }: { c?: string; b?: boolean; i?: boolean; bg?: string; children: ReactNode }) => (
    <span style={{ color: c, fontWeight: b ? 700 : undefined, fontStyle: i ? 'italic' : undefined, background: bg }}>
      {children}
    </span>
  )
  const dim = t.secondaryText

  return (
    <div className="term-window" style={{ background: t.background }}>
      <div className="term-titlebar mac" style={{ background: t.background, color: dim, borderBottom: `1px solid ${dim}33` }}>
        <span className="dot" style={{ background: '#ff5f57' }} />
        <span className="dot" style={{ background: '#febc2e' }} />
        <span className="dot" style={{ background: '#28c840' }} />
        <span className="mac-title">claude — ~/projects/app</span>
      </div>
      <div className="term-content">
      <SceneLayer decor={decor} base={t.background} />
      <div
        className="cc-body"
        style={{ color: t.text, fontFamily: `'${t.fontFamily}', Consolas, monospace`, fontSize: t.fontSize }}
      >
        {/* Welcome box */}
        <div className="cc-box" style={{ borderColor: t.claude }}>
          <div><S c={t.claude}>✻</S> Welcome to <S b>Claude Code</S>!</div>
          <div style={{ marginTop: 6 }}><S c={dim} i>/help for help, /status for your current setup</S></div>
          <div style={{ marginTop: 6 }}><S c={dim}>cwd: C:\Users\Sofi\projects\app</S></div>
        </div>

        {/* User message */}
        <div className="cc-user" style={{ background: t.userMessageBg }}>
          <S c={dim}>&gt;</S> add a greeting to the header and fix the failing test
        </div>

        {/* Assistant text */}
        <div className="cc-msg">
          <S c={t.text}>●</S>
          <div>I'll update the header component, then run the test suite.</div>
        </div>

        {/* Todo list */}
        <div className="cc-msg">
          <S c={t.success}>●</S>
          <div>
            <S b>Update Todos</S>
            <div className="cc-indent">
              <div><S c={dim}>⎿</S>  <S c={t.success}>☒</S> <S c={dim}><s>Read Header.tsx</s></S></div>
              <div>{'   '}<S c={t.planMode}>☐</S> <S b>Add greeting to header</S></div>
              <div>{'   '}☐ Run tests</div>
            </div>
          </div>
        </div>

        {/* Tool call with diff */}
        <div className="cc-msg">
          <S c={t.success}>●</S>
          <div style={{ flex: 1, minWidth: 0 }}>
            <S b>Update</S>(src/Header.tsx)
            <div className="cc-indent">
              <S c={dim}>⎿</S>  Updated <S b>src/Header.tsx</S> with <S b>1</S> addition and <S b>1</S> removal
            </div>
            <div className="cc-diff">
              <div><S c={dim}>  12 </S>  return (</div>
              <div style={{ background: t.diffRemoved }}>
                <S c={dim}>  13 </S>- {'   <h1>'}<S bg={t.diffRemovedWord}>Dashboard</S>{'</h1>'}
              </div>
              <div style={{ background: t.diffAdded }}>
                <S c={dim}>  13 </S>+ {'   <h1>'}<S bg={t.diffAddedWord}>Hello, {'{user.name}'}!</S>{'</h1>'}
              </div>
              <div><S c={dim}>  14 </S>  )</div>
            </div>
          </div>
        </div>

        {/* Bash with error */}
        <div className="cc-msg">
          <S c={t.error}>●</S>
          <div>
            <S b>Bash</S>(npm test)
            <div className="cc-indent">
              <S c={dim}>⎿</S>  <S c={t.error}>FAIL src/api.test.ts — expected 200, received 404</S>
            </div>
            <div className="cc-indent"><S c={t.warning}>   ⚠ 1 test failed, 12 passed</S></div>
          </div>
        </div>

        {/* Permission prompt */}
        <div className="cc-box" style={{ borderColor: t.permission }}>
          <div><S c={t.permission} b>Edit file</S></div>
          <div style={{ marginTop: 4 }}>Do you want to make this edit to <S b>api.ts</S>?</div>
          <div style={{ marginTop: 4 }}><S c={t.permission}>❯ 1. Yes</S></div>
          <div>{'  '}2. Yes, allow all edits during this session <S c={dim}>(shift+tab)</S></div>
          <div>{'  '}3. No, and tell Claude what to do differently <S c={dim}>(esc)</S></div>
        </div>

        {/* Spinner */}
        <div className="cc-spinner">
          <S c={t.claude}>✶ Percolating…</S> <S c={dim}>(12s · ↓ 1.4k tokens · esc to interrupt)</S>
        </div>

        {/* Input box */}
        <div className="cc-input" style={{ borderColor: t.inputBorder }}>
          <S c={t.text}>&gt;</S> <span className="cc-caret" style={{ background: t.text }} />
          <S c={dim}> Try "refactor api.ts"</S>
        </div>
        <div className="cc-footer">
          <S c={t.planMode}>⏸ plan mode on</S> <S c={dim}>(shift+tab to cycle)</S>
          <div style={{ flex: 1 }} />
          <S c={dim}>Opus 5.5 · ctx 38%</S>
        </div>
      </div>
      </div>
    </div>
  )
}
