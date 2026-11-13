// Language-independent lip-sync "frames".
// Every character of the spoken text is mapped to a mouth shape (how open, how wide)
// from its Unicode script, so Kannada, Hindi and English all animate from the same table.

export interface MouthFrame {
  /** 0 = lips closed, 1 = fully open jaw */
  open: number
  /** <1 = pursed/rounded lips, >1 = spread lips */
  wide: number
}

export const CLOSED: MouthFrame = { open: 0.02, wide: 1 }
const REST: MouthFrame = { open: 0.06, wide: 1 }
const OPEN_A: MouthFrame = { open: 0.92, wide: 1.02 }
const MID_E: MouthFrame = { open: 0.5, wide: 1.14 }
const SPREAD_I: MouthFrame = { open: 0.3, wide: 1.18 }
const ROUND_O: MouthFrame = { open: 0.58, wide: 0.86 }
const ROUND_U: MouthFrame = { open: 0.28, wide: 0.82 }
const CONSONANT: MouthFrame = { open: 0.3, wide: 1 }
const TEETH: MouthFrame = { open: 0.16, wide: 1.1 } // f v s z t d n l th

const LATIN_VOWELS: Record<string, MouthFrame> = { a: OPEN_A, e: MID_E, i: SPREAD_I, o: ROUND_O, u: ROUND_U, y: SPREAD_I }
const LATIN_LABIAL = new Set('mbpMBP')
const LATIN_TEETH = new Set('fvszdtnlFVSZDTNL')

// Kannada (U+0C80–0CFF): independent vowels, vowel signs, labial consonants.
const KN_A = new Set([0x0c85, 0x0c86, 0x0cbe]) // ಅ ಆ ಾ
const KN_I = new Set([0x0c87, 0x0c88, 0x0c8e, 0x0c8f, 0x0c90, 0x0cbf, 0x0cc0, 0x0cc6, 0x0cc7, 0x0cc8]) // ಇ ಈ ಎ ಏ ಐ ಿ ೀ ೆ ೇ ೈ
const KN_U = new Set([0x0c89, 0x0c8a, 0x0c92, 0x0c93, 0x0c94, 0x0cc1, 0x0cc2, 0x0cca, 0x0ccb, 0x0ccc]) // ಉ ಊ ಒ ಓ ಔ ು ೂ ೊ ೋ ೌ
const KN_LABIAL = new Set([0x0caa, 0x0cab, 0x0cac, 0x0cad, 0x0cae]) // ಪ ಫ ಬ ಭ ಮ

// Devanagari (U+0900–097F)
const HI_A = new Set([0x0905, 0x0906, 0x093e]) // अ आ ा
const HI_I = new Set([0x0907, 0x0908, 0x090f, 0x0910, 0x093f, 0x0940, 0x0947, 0x0948]) // इ ई ए ऐ ि ी े ै
const HI_U = new Set([0x0909, 0x090a, 0x0913, 0x0914, 0x0941, 0x0942, 0x094b, 0x094c]) // उ ऊ ओ औ ु ू ो ौ
const HI_LABIAL = new Set([0x092a, 0x092b, 0x092c, 0x092d, 0x092e]) // प फ ब भ म

export function charToViseme(ch: string): MouthFrame {
  const cp = ch.codePointAt(0) ?? 0
  if (/\s/.test(ch)) return REST
  if (/[.,;:!?…।\-—]/.test(ch)) return CLOSED

  if (cp >= 0x0c80 && cp <= 0x0cff) {
    if (KN_A.has(cp)) return OPEN_A
    if (KN_I.has(cp)) return cp === 0x0c90 || cp === 0x0cc8 ? MID_E : SPREAD_I
    if (KN_U.has(cp)) return cp === 0x0cc1 || cp === 0x0cc2 || cp === 0x0c89 || cp === 0x0c8a ? ROUND_U : ROUND_O
    if (KN_LABIAL.has(cp)) return CLOSED
    if (cp === 0x0ccd) return CLOSED // virama: consonant cluster, no vowel
    return CONSONANT
  }
  if (cp >= 0x0900 && cp <= 0x097f) {
    if (HI_A.has(cp)) return OPEN_A
    if (HI_I.has(cp)) return cp === 0x090f || cp === 0x0910 || cp === 0x0947 || cp === 0x0948 ? MID_E : SPREAD_I
    if (HI_U.has(cp)) return cp === 0x0909 || cp === 0x090a || cp === 0x0941 || cp === 0x0942 ? ROUND_U : ROUND_O
    if (HI_LABIAL.has(cp)) return CLOSED
    if (cp === 0x094d) return CLOSED
    return CONSONANT
  }
  const v = LATIN_VOWELS[ch.toLowerCase()]
  if (v) return v
  if (LATIN_LABIAL.has(ch)) return CLOSED
  if (LATIN_TEETH.has(ch)) return TEETH
  return CONSONANT
}

/** One frame per character, with a speaking-rate weight so pauses last longer. */
export function buildFrames(text: string): { frames: MouthFrame[]; weights: number[] } {
  const frames: MouthFrame[] = []
  const weights: number[] = []
  for (const ch of Array.from(text)) {
    frames.push(charToViseme(ch))
    weights.push(/[.!?।…]/.test(ch) ? 6 : /[,;:]/.test(ch) ? 3 : /\s/.test(ch) ? 0.6 : 1)
  }
  return { frames, weights }
}

/** Shared, mutation-only channel read by the portrait renderer every animation frame. */
export const mouthChannel = { active: false, open: 0, wide: 1 }

export interface LipSyncHandle {
  /** Call with the char index from SpeechSynthesisUtterance 'boundary' events to re-align. */
  boundary(charIndex: number): void
  stop(): void
}

/**
 * Plays the viseme frames for `text`. Timing is estimated from the speaking rate
 * and re-aligned whenever the speech engine reports a word boundary.
 */
export function startLipSync(text: string, rate = 1): LipSyncHandle {
  const { frames, weights } = buildFrames(text)
  const total = weights.reduce((a, b) => a + b, 0) || 1
  const unitsPerSecond = 14 * rate // ≈ characters per second of natural speech
  const cumulative: number[] = []
  weights.reduce((acc, w, i) => ((cumulative[i] = acc + w), acc + w), 0)
  const start = performance.now()
  let anchorTime = start
  let anchorUnits = 0
  mouthChannel.active = true
  const timer = setInterval(() => {
    const units = anchorUnits + ((performance.now() - anchorTime) / 1000) * unitsPerSecond
    if (units > total + 20) return stop()
    let i = cumulative.findIndex((c) => c >= units)
    if (i < 0) i = frames.length - 1
    // Slight co-articulation: blend with the next frame.
    const f = frames[i]
    const n = frames[Math.min(i + 1, frames.length - 1)]
    mouthChannel.open = f.open * 0.75 + n.open * 0.25
    mouthChannel.wide = f.wide * 0.75 + n.wide * 0.25
  }, 33)
  function stop() {
    clearInterval(timer)
    mouthChannel.active = false
    mouthChannel.open = 0
    mouthChannel.wide = 1
  }
  return {
    boundary(charIndex: number) {
      const idx = Math.min(Math.max(0, charIndex), cumulative.length - 1)
      anchorUnits = idx > 0 ? cumulative[idx - 1] : 0
      anchorTime = performance.now()
    },
    stop,
  }
}
