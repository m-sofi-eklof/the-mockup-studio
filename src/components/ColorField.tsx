import { useEffect, useRef, useState } from 'react'
import { HexColorInput, HexColorPicker } from 'react-colorful'

type Props = {
  label: string
  value: string
  onChange: (v: string) => void
}

export function ColorField({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="color-field" ref={ref}>
      <button
        className="swatch"
        style={{ background: value }}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Pick ${label}`}
      />
      <span className="color-label">{label}</span>
      <HexColorInput className="hex-input" color={value} onChange={onChange} prefixed />
      {open && (
        <div className="picker-popover">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
