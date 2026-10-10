import type { CSSProperties, ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Choice, Section, Slider } from '../components/ControlPanel'
import { PETS, PET_NAMES, type PetName } from './pets'
import { SCENE_NAMES, downloadScene, sceneUrl, type SceneName } from './scenes'
import { shade } from '../utils/color'

export const SCENE_TARGETS = ['window', 'wallpaper', 'both'] as const
export const PET_POSITIONS = ['bottom-right', 'bottom-left', 'perched'] as const
export const PET_ANIMS = ['none', 'bob', 'hop', 'walk'] as const

export type Decor = {
  scene: SceneName | 'none'
  target: (typeof SCENE_TARGETS)[number]
  strength: number
  pets: PetName[]
  petPosition: (typeof PET_POSITIONS)[number]
  petAnim: (typeof PET_ANIMS)[number]
  petScale: number
  /** Terminal exports: animate pets in the background as a GIF (Windows Terminal). */
  animatedBg: boolean
  /** Terminal exports: play a pixel-pet greeting when a new tab opens. */
  greeting: boolean
  /** VS Code: also draw the scene behind the code. The theme can't do this; it needs the Background extension. */
  behindCode: boolean
}

export const defaultDecor: Decor = {
  scene: 'none',
  target: 'window',
  strength: 100,
  pets: [],
  petPosition: 'bottom-right',
  petAnim: 'bob',
  petScale: 4,
  animatedBg: true,
  greeting: true,
  behindCode: false,
}

const pixelated: CSSProperties = { imageRendering: 'pixelated', backgroundSize: 'cover', backgroundPosition: 'center' }

/** Scene drawn inside a window, behind its text. Parent must be position: relative. */
export function SceneLayer({ decor, base }: { decor: Decor; base: string }) {
  if (decor.target === 'wallpaper') return null
  const url = sceneUrl(decor.scene, base)
  if (!url) return null
  return <div className="scene-layer" style={{ ...pixelated, backgroundImage: `url(${url})`, opacity: decor.strength / 100 }} />
}

/** Style for the preview area behind the window. */
export function wallpaperStyle(decor: Decor, base: string): CSSProperties | undefined {
  if (decor.target === 'window') return undefined
  const url = sceneUrl(decor.scene, shade(base, -10))
  return url ? { ...pixelated, backgroundImage: `url(${url})` } : undefined
}

export function PixelPet({ name, scale }: { name: PetName; scale: number }) {
  const { sprite, palette } = PETS[name]
  const w = sprite[0].length
  const h = sprite.length
  const pal = palette as Record<string, string>
  return (
    <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-label={name}>
      {sprite.flatMap((row, y) =>
        [...row].map((ch, x) => (pal[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={pal[ch]} /> : null)),
      )}
    </svg>
  )
}

/** Wraps a preview window so pets can sit in / on it. */
export function PetStage({ decor, width, inset = 12, children }: { decor: Decor; width: string; inset?: number; children: ReactNode }) {
  const pos = decor.petPosition
  const style: CSSProperties =
    pos === 'perched'
      ? { bottom: '100%', right: 40, marginBottom: -2 }
      : { bottom: inset, [pos === 'bottom-left' ? 'left' : 'right']: 16 }
  return (
    <div className="pet-stage" style={{ width }}>
      {children}
      {decor.pets.length > 0 && (
        <div className={`pet-row anim-${decor.petAnim}`} style={decor.petAnim === 'walk' ? { ...style, left: undefined, right: undefined } : style}>
          {decor.pets.map((p, i) => (
            <div key={p} className="pet" style={{ animationDelay: `${i * 0.18}s` }}>
              <PixelPet name={p} scale={decor.petScale} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DecorSection({
  decor,
  set,
  base,
  terminal,
  vscode,
}: {
  decor: Decor
  set: <K extends keyof Decor>(k: K, v: Decor[K]) => void
  base: string
  /** Show terminal export options for this platform. */
  terminal?: 'windows' | 'macos'
  /** VS Code page: the scene lives in the Pixel Pets panel, so offer "behind code" in place of "Show on". */
  vscode?: boolean
}) {
  const togglePet = (p: PetName) =>
    set('pets', decor.pets.includes(p) ? decor.pets.filter((x) => x !== p) : [...decor.pets, p])

  return (
    <>
      <Section title="Pixel background">
        <div className="scene-grid">
          <button className={`scene-thumb none ${decor.scene === 'none' ? 'active' : ''}`} onClick={() => set('scene', 'none')}>
            none
          </button>
          {SCENE_NAMES.map((s) => (
            <button
              key={s}
              className={`scene-thumb ${decor.scene === s ? 'active' : ''}`}
              style={{ ...pixelated, backgroundImage: `url(${sceneUrl(s, base)})` }}
              onClick={() => set('scene', s)}
              title={s}
            >
              <span>{s}</span>
            </button>
          ))}
        </div>
        {decor.scene !== 'none' && (
          <>
            {vscode ? (
              <>
                <span className="hint">The scene and pets show in the Pixel Pets panel of the Explorer.</span>
                <label className="check">
                  <input type="checkbox" checked={decor.behindCode} onChange={(e) => set('behindCode', e.target.checked)} /> Also behind the code
                </label>
                {decor.behindCode && (
                  <span className="hint">
                    Needs the Background extension in VS Code. The downloaded theme sets its image up for you.
                  </span>
                )}
              </>
            ) : (
              <Choice label="Show on" value={decor.target} options={SCENE_TARGETS} onChange={(v) => set('target', v)} />
            )}
            <Slider label="Scene strength" value={decor.strength} min={10} max={100} unit="%" onChange={(v) => set('strength', v)} />
            <button className="btn" onClick={() => downloadScene(decor.scene as SceneName, base)}>
              <Download size={14} /> Download PNG (1920×1080)
            </button>
          </>
        )}
      </Section>
      <Section title="Pixel pets">
        <div className="pet-grid">
          {PET_NAMES.map((p) => (
            <button key={p} className={`pet-pick ${decor.pets.includes(p) ? 'active' : ''}`} onClick={() => togglePet(p)} title={p}>
              <PixelPet name={p} scale={3} />
              <span>{p}</span>
            </button>
          ))}
        </div>
        {decor.pets.length > 0 && (
          <>
            <Choice label="Position" value={decor.petPosition} options={PET_POSITIONS} onChange={(v) => set('petPosition', v)} />
            <Choice label="Animation" value={decor.petAnim} options={PET_ANIMS} onChange={(v) => set('petAnim', v)} />
            <Slider label="Pet size" value={decor.petScale} min={2} max={8} unit="×" onChange={(v) => set('petScale', v)} />
            {terminal && (
              <div className="export-opts">
                <span className="export-opts-title">In the exported terminal</span>
                <label className="check">
                  <input type="checkbox" checked={decor.greeting} onChange={(e) => set('greeting', e.target.checked)} /> Pet greeting when a tab opens
                </label>
                {terminal === 'windows' ? (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={decor.animatedBg}
                      disabled={decor.petAnim === 'none'}
                      onChange={(e) => set('animatedBg', e.target.checked)}
                    />{' '}
                    Animated background (GIF)
                  </label>
                ) : (
                  <span className="hint">iTerm2 backgrounds are still images, so pets are drawn into it. The greeting is animated.</span>
                )}
              </div>
            )}
          </>
        )}
      </Section>
    </>
  )
}
