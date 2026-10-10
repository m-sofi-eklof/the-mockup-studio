import { useState, type ReactNode } from 'react'
import { Bot, Check, ChevronDown, ChevronRight, Download, LoaderCircle, RotateCcw } from 'lucide-react'
import { saveBlob, zip, type PackageResult, type PromptResult } from '../export/download'

type Props = {
  title: string
  presets: Record<string, unknown>
  onPreset: (name: string) => void
  onReset: () => void
  exportText: () => string
  buildPackage: () => Promise<PackageResult>
  buildPrompt: () => Promise<PromptResult>
  packageLabel: string
  assetsName: string
  children: ReactNode
}

type Busy = 'package' | 'prompt' | null

export function ControlPanel(p: Props) {
  const [busy, setBusy] = useState<Busy>(null)
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null)

  const run = async (kind: Exclude<Busy, null>, fn: () => Promise<string>) => {
    setBusy(kind)
    try {
      setToast({ text: await fn() })
    } catch (e) {
      setToast({ text: `Something went wrong: ${e instanceof Error ? e.message : e}`, error: true })
    } finally {
      setBusy(null)
    }
  }

  const downloadPackage = () =>
    run('package', async () => {
      const r = await p.buildPackage()
      saveBlob(r.filename, r.blob)
      return `Downloaded ${r.filename}. ${r.note}`
    })

  const copyPrompt = () =>
    run('prompt', async () => {
      const r = await p.buildPrompt()
      await navigator.clipboard.writeText(r.prompt)
      const n = Object.keys(r.assets).length
      if (n) saveBlob(`${p.assetsName}-assets.zip`, zip(r.assets))
      return n
        ? `Prompt copied to clipboard and ${p.assetsName}-assets.zip downloaded (${n} image${n > 1 ? 's' : ''}). Paste the prompt into your AI and attach the images.`
        : 'Prompt copied to clipboard. Paste it into your AI.'
    })

  const copyJson = () =>
    run('prompt', async () => {
      await navigator.clipboard.writeText(p.exportText())
      return 'Raw JSON copied.'
    })

  return (
    <aside className="control-panel">
      <div className="panel-header">
        <h2>{p.title}</h2>
        <select
          className="preset-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) p.onPreset(e.target.value)
            e.target.value = ''
          }}
        >
          <option value="" disabled>
            Load preset…
          </option>
          {Object.keys(p.presets).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-wide" onClick={downloadPackage} disabled={busy !== null}>
          {busy === 'package' ? <LoaderCircle size={14} className="spin" /> : <Download size={14} />} {p.packageLabel}
        </button>
        <div className="panel-actions">
          <button className="btn" onClick={copyPrompt} disabled={busy !== null} title="Copies a build prompt for your own AI and downloads the images it needs">
            {busy === 'prompt' ? <LoaderCircle size={14} className="spin" /> : <Bot size={14} />} AI prompt + PNGs
          </button>
          <button className="btn" onClick={p.onReset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <button className="link-btn" onClick={copyJson}>
          Copy raw JSON
        </button>
        {toast && (
          <div className={`toast ${toast.error ? 'error' : ''}`} onClick={() => setToast(null)}>
            {!toast.error && <Check size={14} />} <span>{toast.text}</span>
          </div>
        )}
      </div>
      <div className="panel-body">{p.children}</div>
    </aside>
  )
}

export function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="section">
      <button className="section-title" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <Field label={`${label} · ${value}${unit}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  )
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <Field label={label}>
      <div className="segmented">
        {options.map((o) => (
          <button key={o} className={o === value ? 'active' : ''} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </Field>
  )
}
