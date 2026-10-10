import { ColorField } from '../components/ColorField'
import { ControlPanel, Field, Section, Slider } from '../components/ControlPanel'
import { useLocalTheme } from '../hooks/useLocalTheme'
import { buildVSCodePackage } from '../export/vscode'
import { vscodePrompt } from '../export/prompts'
import { slugify } from '../export/download'
import { DecorSection, defaultDecor } from '../decor/Decor'
import {
  TOKEN_KEYS, WORKBENCH_KEYS, defaultVSCode, loadVSCode, toVSCodeSettings, vscodePresets,
  type TokenKey, type WorkbenchKey,
} from '../presets/vscode'
import { VSCodePreview } from '../previews/VSCodePreview'

const FONTS = ['Cascadia Code', 'Consolas', 'JetBrains Mono', 'Fira Code', 'Courier New']

export function VSCodePage() {
  const { theme: t, setTheme, set } = useLocalTheme('tms.vscode', defaultVSCode, loadVSCode)
  const { theme: decor, set: setDecor } = useLocalTheme('tms.vscode.decor', defaultDecor)

  return (
    <div className="tool-layout">
      <ControlPanel
        title="VS Code"
        presets={vscodePresets}
        onPreset={(p) => setTheme({ ...t, ...vscodePresets[p] })}
        onReset={() => setTheme(defaultVSCode)}
        exportText={() => toVSCodeSettings(t)}
        buildPackage={() => buildVSCodePackage(t, decor)}
        buildPrompt={() => vscodePrompt(t, decor)}
        packageLabel="Download VS Code extension (.vsix)"
        assetsName={slugify(t.name)}
      >
        <Section title="Theme">
          <Field label="Theme name (shown in VS Code)">
            <input className="text-input" value={t.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
        </Section>
        <Section title="Workbench">
          {(Object.keys(WORKBENCH_KEYS) as WorkbenchKey[]).map((k) => (
            <ColorField key={k} label={WORKBENCH_KEYS[k].label} value={t[k]} onChange={(v) => set(k, v)} />
          ))}
        </Section>
        <Section title="Syntax tokens">
          {(Object.keys(TOKEN_KEYS) as TokenKey[]).map((k) => (
            <ColorField key={k} label={TOKEN_KEYS[k].label} value={t[k]} onChange={(v) => set(k, v)} />
          ))}
        </Section>
        <Section title="Font">
          <Field label="Font family">
            <select className="text-input" value={t.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
              {FONTS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Slider label="Font size" value={t.fontSize} min={10} max={22} unit="px" onChange={(v) => set('fontSize', v)} />
          <label className="check">
            <input type="checkbox" checked={t.ligatures} onChange={(e) => set('ligatures', e.target.checked)} /> Font ligatures
          </label>
          <label className="check">
            <input type="checkbox" checked={t.italicComments} onChange={(e) => set('italicComments', e.target.checked)} /> Italic comments
          </label>
        </Section>
        <DecorSection decor={decor} set={setDecor} base={t.editorBg} vscode />
      </ControlPanel>
      <div className="preview-area">
        <div className="pet-stage" style={{ width: 'min(1100px, 100%)' }}>
          <VSCodePreview t={t} decor={decor} />
        </div>
      </div>
    </div>
  )
}
