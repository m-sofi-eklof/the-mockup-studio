import { ColorField } from '../components/ColorField'
import { ControlPanel, Field, Section, Slider } from '../components/ControlPanel'
import { useLocalTheme } from '../hooks/useLocalTheme'
import { buildClaudePackage } from '../export/claude'
import { claudePrompt } from '../export/prompts'
import { slugify } from '../export/download'
import { DecorSection, PetStage, defaultDecor, wallpaperStyle } from '../decor/Decor'
import { CLAUDE_COLOR_KEYS, claudePresets, defaultClaude, toClaudeSummary, type ClaudeColorKey } from '../presets/claude'
import { ClaudePreview } from '../previews/ClaudePreview'

const FONTS = ['Cascadia Code', 'Cascadia Mono', 'Consolas', 'JetBrains Mono', 'Fira Code', 'Courier New']
const GROUPS: { title: string; keys: ClaudeColorKey[] }[] = [
  { title: 'Base', keys: ['background', 'text', 'secondaryText', 'claude', 'userMessageBg', 'inputBorder'] },
  { title: 'Status', keys: ['success', 'error', 'warning', 'permission', 'planMode'] },
  { title: 'Diffs', keys: ['diffAdded', 'diffRemoved', 'diffAddedWord', 'diffRemovedWord'] },
]

export function ClaudePage() {
  const { theme: t, setTheme, set } = useLocalTheme('tms.claude', defaultClaude)
  const { theme: decor, set: setDecor } = useLocalTheme('tms.claude.decor', defaultDecor)

  return (
    <div className="tool-layout">
      <ControlPanel
        title="Claude Code"
        presets={claudePresets}
        onPreset={(p) => setTheme({ ...t, ...claudePresets[p] })}
        onReset={() => setTheme(defaultClaude)}
        exportText={() => toClaudeSummary(t)}
        buildPackage={() => buildClaudePackage(t, decor)}
        buildPrompt={() => claudePrompt(t, decor)}
        packageLabel="Download Claude Code package"
        assetsName={`claude-${slugify(t.baseTheme)}`}
      >
        {GROUPS.map((g) => (
          <Section key={g.title} title={g.title}>
            {g.keys.map((k) => (
              <ColorField key={k} label={CLAUDE_COLOR_KEYS[k]} value={t[k]} onChange={(v) => set(k, v)} />
            ))}
          </Section>
        ))}
        <Section title="Font">
          <Field label="Font family">
            <select className="text-input" value={t.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
              {FONTS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Slider label="Font size" value={t.fontSize} min={10} max={22} unit="px" onChange={(v) => set('fontSize', v)} />
        </Section>
        <DecorSection decor={decor} set={setDecor} base={t.background} />
      </ControlPanel>
      <div className="preview-area" style={wallpaperStyle(decor, t.background)}>
        <PetStage decor={decor} width="min(820px, 100%)" inset={12}>
          <ClaudePreview t={t} decor={decor} />
        </PetStage>
      </div>
    </div>
  )
}
