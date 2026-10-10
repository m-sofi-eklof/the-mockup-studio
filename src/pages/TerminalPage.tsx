import { ColorField } from '../components/ColorField'
import { Choice, ControlPanel, Field, Section, Slider } from '../components/ControlPanel'
import { useLocalTheme } from '../hooks/useLocalTheme'
import { buildTerminalPackage } from '../export/terminal'
import { terminalPrompt } from '../export/prompts'
import { slugify } from '../export/download'
import { Apple, Monitor } from 'lucide-react'
import { DecorSection, PetStage, defaultDecor, wallpaperStyle } from '../decor/Decor'
import {
  ANSI_NAMES, CURSOR_STYLES, PLATFORMS, PLATFORM_INFO, PROMPTS, defaultTerminal, terminalPresets, toWindowsTerminalScheme,
  type Platform,
} from '../presets/terminal'
import { TerminalPreview } from '../previews/TerminalPreview'

const PLATFORM_ICONS = { windows: Monitor, macos: Apple }

export function TerminalPage() {
  const { theme: t, setTheme, set } = useLocalTheme('tms.terminal', defaultTerminal)
  const { theme: decor, set: setDecor } = useLocalTheme('tms.terminal.decor', defaultDecor)
  const info = PLATFORM_INFO[t.platform]

  const switchPlatform = (platform: Platform) => {
    const next = PLATFORM_INFO[platform]
    setTheme({
      ...t,
      platform,
      chrome: next.chromes[0],
      fontFamily: next.fonts.includes(t.fontFamily) ? t.fontFamily : next.fonts[0],
    })
  }

  return (
    <div className="tool-layout">
      <ControlPanel
        title="Terminal"
        presets={terminalPresets}
        // presets only carry colors/feel — keep the chosen platform, its window style and font
        onPreset={(p) => setTheme({ ...t, ...terminalPresets[p], platform: t.platform, chrome: t.chrome, fontFamily: t.fontFamily })}
        onReset={() => (t.platform === 'windows' ? setTheme(defaultTerminal) : setTheme({ ...defaultTerminal, platform: 'macos', chrome: 'macos', fontFamily: 'SF Mono' }))}
        exportText={() => toWindowsTerminalScheme(t)}
        buildPackage={() => buildTerminalPackage(t, decor)}
        buildPrompt={() => terminalPrompt(t, decor)}
        packageLabel={`Download ${info.app} package`}
        assetsName={slugify(t.name)}
      >
        <Section title="Platform">
          <div className="platform-switch">
            {PLATFORMS.map((p) => {
              const Icon = PLATFORM_ICONS[p]
              return (
                <button key={p} className={t.platform === p ? 'active' : ''} onClick={() => switchPlatform(p)}>
                  <Icon size={18} />
                  {PLATFORM_INFO[p].label}
                  <small>{PLATFORM_INFO[p].app}</small>
                </button>
              )
            })}
          </div>
        </Section>
        <Section title="Scheme">
          <Field label="Scheme name">
            <input className="text-input" value={t.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <ColorField label="Background" value={t.background} onChange={(v) => set('background', v)} />
          <ColorField label="Foreground" value={t.foreground} onChange={(v) => set('foreground', v)} />
          <ColorField label="Cursor" value={t.cursorColor} onChange={(v) => set('cursorColor', v)} />
          <ColorField label="Selection" value={t.selectionBackground} onChange={(v) => set('selectionBackground', v)} />
        </Section>
        <Section title="ANSI colors">
          {ANSI_NAMES.map((n, i) => (
            <ColorField
              key={n}
              label={n}
              value={t.ansi[i]}
              onChange={(v) => set('ansi', t.ansi.map((c, j) => (j === i ? v : c)))}
            />
          ))}
        </Section>
        <Section title="Font & cursor">
          <Field label="Font family">
            <select className="text-input" value={t.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
              {info.fonts.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Slider label="Font size" value={t.fontSize} min={10} max={24} unit="px" onChange={(v) => set('fontSize', v)} />
          <Slider label="Line height" value={t.lineHeight} min={1} max={2} step={0.05} onChange={(v) => set('lineHeight', v)} />
          <Choice label="Cursor style" value={t.cursorStyle} options={CURSOR_STYLES} onChange={(v) => set('cursorStyle', v)} />
        </Section>
        <Section title="Window">
          <Choice label="Window chrome" value={t.chrome} options={info.chromes} onChange={(v) => set('chrome', v)} />
          <Choice label="Prompt style" value={t.prompt} options={PROMPTS} onChange={(v) => set('prompt', v)} />
          <Slider label="Padding" value={t.padding} min={0} max={40} unit="px" onChange={(v) => set('padding', v)} />
          <Slider
            label={t.platform === 'windows' ? 'Opacity' : 'Opacity (iTerm2 transparency)'}
            value={t.opacity}
            min={30}
            max={100}
            unit="%"
            onChange={(v) => set('opacity', v)}
          />
        </Section>
        <DecorSection decor={decor} set={setDecor} base={t.background} terminal={t.platform} />
      </ControlPanel>
      <div className="preview-area" style={wallpaperStyle(decor, t.background)}>
        <PetStage decor={decor} width="min(820px, 100%)" inset={12}>
          <TerminalPreview t={t} decor={decor} />
        </PetStage>
      </div>
    </div>
  )
}
