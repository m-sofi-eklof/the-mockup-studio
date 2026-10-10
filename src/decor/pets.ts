import { FAWN_FRAMES, FAWN_FRAME_MS, FAWN_PALETTE } from './fawn'

// Hand-drawn 13px-wide pixel pets. '.' = transparent, other chars map to the pet's palette.
export type Pet = {
  sprite: string[]
  palette: Record<string, string>
  /** Size of one sprite pixel compared with the hand-drawn pets'. Detailed sprites use smaller pixels (default 1). */
  px?: number
  /** The pet's own frame-by-frame animation, played where it is shown live (app preview, VS Code panel). */
  anim?: { frames: string[][]; frameMs: number }
}

const outline = '#2b2033'

const CAT = [
  '.k.........k.',
  '.kk.......kk.',
  '.kpk.....kpk.',
  '.kbbkkkkkbbk.',
  'kbbbbbbbbbbbk',
  'kbbebbbbbebbk',
  'kbbebbbbbebbk',
  'kbpbbbkbbbpbk',
  'kbbbbkbkbbbbk',
  '.kbbbbbbbbbk.',
  '.kbbbbbbbbbk.',
  '.kbkbbbbbkbk.',
  '.kk.kkkkk.kk.',
]

const BUNNY = [
  '..kk.....kk..',
  '.kwpk...kpwk.',
  '.kwpk...kpwk.',
  '.kwpk...kpwk.',
  '..kwkkkkkwk..',
  '.kwwwwwwwwwk.',
  'kwwwwwwwwwwwk',
  'kwwewwwwwewwk',
  'kwpewwkwwewpk',
  'kwwwwkwkwwwwk',
  '.kwwwwwwwwwk.',
  '..kkkkkkkkk..',
]

const FROG = [
  '..kkk...kkk..',
  '.kwewk.kwewk.',
  '.kgggkkkgggk.',
  'kgggggggggggk',
  'kgpgggggggpgk',
  'kggkgggggkggk',
  'kgggkkkkkgggk',
  'kgggggggggggk',
  '.kgglllllggk.',
  'kgkkkkkkkkkgk',
  'kkk.......kkk',
]

const GHOST = [
  '....kkkkk....',
  '..kkwwwwwkk..',
  '.kwwwwwwwwwk.',
  '.kwwwwwwwwwk.',
  'kwwewwwwwewwk',
  'kwwewwwwwewwk',
  'kwpwwwkwwwpwk',
  'kwwwwwwwwwwwk',
  'kwwwwwwwwwwwk',
  'kwwkkwwwkkwwk',
  'kkk..kkk..kkk',
]

const SLIME = [
  '......k......',
  '.....kgk.....',
  '....kgwgk....',
  '...kgwgggk...',
  '..kgwgggggk..',
  '.kgggggggggk.',
  'kggegggggeggk',
  'kggegggggeggk',
  'kgpgggggggpgk',
  'kggggkkkggggk',
  '.kgggggggggk.',
  '..kkkkkkkkk..',
]

const CHICK = [
  '.....kkk.....',
  '....kyyyk....',
  '...kyyyyyk...',
  '..kyeyyyeyk..',
  '..kpyoooypk..',
  '.kyyyyoyyyyk.',
  'kyyyyyyyyyyyk',
  'kywyyyyyyywyk',
  'kyywyyyyywyyk',
  '.kyyyyyyyyyk.',
  '..kkkkkkkkk..',
  '....o...o....',
]

const PUPPY = [
  '.kk.......kk.',
  'kddk.....kddk',
  'kddkkkkkkkddk',
  'kddbbbbbbbddk',
  'kdbbebbbebbdk',
  '.kbbebbbebbk.',
  '.kpbbbkbbbpk.',
  '.kbbbkpkbbbk.',
  '..kbbbbbbbk..',
  '.kbbbbbbbbbk.',
  '.kbkbbbbbkbk.',
  '.kk.kkkkk.kk.',
]

export const PETS = {
  'Orange cat': { sprite: CAT, palette: { k: outline, b: '#ffa94d', p: '#ff8fab', e: outline } },
  'Gray cat': { sprite: CAT, palette: { k: outline, b: '#b8bcc8', p: '#ff8fab', e: outline } },
  'Black cat': { sprite: CAT, palette: { k: '#000000', b: '#3a3442', p: '#ff8fab', e: '#ffe066' } },
  Bunny: { sprite: BUNNY, palette: { k: outline, w: '#fffaf5', p: '#ffb3c7', e: outline } },
  Frog: { sprite: FROG, palette: { k: outline, g: '#7bd389', l: '#d4f5c9', w: '#ffffff', e: outline, p: '#ff9fb5' } },
  Ghost: { sprite: GHOST, palette: { k: '#5a5370', w: '#f4f1ff', e: '#2b2033', p: '#ffc2d6' } },
  Slime: { sprite: SLIME, palette: { k: '#2c5f8a', g: '#7cc8ff', w: '#e3f5ff', e: '#16324a', p: '#ff9fc8' } },
  Chick: { sprite: CHICK, palette: { k: outline, y: '#ffe066', w: '#ffd43b', e: outline, o: '#ff922b', p: '#ffa8a8' } },
  Puppy: { sprite: PUPPY, palette: { k: outline, d: '#9c6b4a', b: '#e8c39e', e: outline, p: '#ff8fab' } },
  Fawn: { sprite: FAWN_FRAMES[0], palette: FAWN_PALETTE, px: 0.5, anim: { frames: FAWN_FRAMES, frameMs: FAWN_FRAME_MS } },
} satisfies Record<string, Pet>

export type PetName = keyof typeof PETS
export const PET_NAMES = Object.keys(PETS) as PetName[]
export const petInfo = (name: PetName): Pet => PETS[name]
