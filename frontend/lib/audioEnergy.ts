/**
 * Real-time loudness / brightness of the doctor's voice, read from the audio that is actually
 * playing. This is what drives the talking portrait's mouth, so lip movement follows the real
 * signal. Uses the browser's own Web Audio API: free, CPU-only, no service involved.
 *
 * Each doctor audio chunk is a fresh <audio> element, so we attach per element. Output goes
 * source -> gain -> speakers (gain implements Mute without silencing the analyser) and
 * source -> analyser.
 */
let ctx: AudioContext | null = null
let gain: GainNode | null = null
let analyser: AnalyserNode | null = null
let time: Uint8Array<ArrayBuffer> | null = null
let freq: Uint8Array<ArrayBuffer> | null = null
let attached: HTMLMediaElement | null = null
let muted = false

function ensureGraph(): boolean {
  if (typeof window === 'undefined') return false
  if (ctx && gain && analyser) return true
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return false
  try {
    ctx = new Ctor()
    gain = ctx.createGain()
    analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.35
    gain.connect(ctx.destination)
    time = new Uint8Array(new ArrayBuffer(analyser.fftSize))
    freq = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    return true
  } catch {
    ctx = null
    gain = null
    analyser = null
    return false
  }
}

/** Route `el` through the analyser. Returns false (and leaves the element alone) if unsupported. */
export function attachAudioAnalyser(el: HTMLMediaElement, isMuted: boolean): boolean {
  muted = isMuted
  if (!ensureGraph() || !ctx || !gain || !analyser) {
    el.muted = isMuted
    return false
  }
  try {
    if (ctx.state === 'suspended') void ctx.resume()
    const source = ctx.createMediaElementSource(el)
    source.connect(gain)
    source.connect(analyser)
    el.muted = false
    gain.gain.value = isMuted ? 0 : 1
    attached = el
    return true
  } catch {
    el.muted = isMuted
    return false
  }
}

/** Apply the Mute button to whichever path the current element uses. */
export function setAudioOutputMuted(isMuted: boolean, el?: HTMLMediaElement | null) {
  muted = isMuted
  if (el && el === attached && gain) gain.gain.value = isMuted ? 0 : 1
  else if (el) el.muted = isMuted
}

export interface VoiceDrive {
  /** 0..1 loudness. */
  level: number
  /** 0..1, higher when more energy sits in the upper speech band (open "ee" vs round "oo"). */
  bright: number
}

/** Latest drive from the playing voice, or null when nothing is attached/playing. */
export function readVoiceDrive(): VoiceDrive | null {
  if (!analyser || !time || !freq || !attached || attached.paused || attached.ended) return null
  analyser.getByteTimeDomainData(time)
  let sum = 0
  for (let i = 0; i < time.length; i++) {
    const v = (time[i] - 128) / 128
    sum += v * v
  }
  const rms = Math.sqrt(sum / time.length)
  analyser.getByteFrequencyData(freq)
  const bins = freq.length
  let low = 0
  let high = 0
  for (let i = 2; i < bins; i++) {
    if (i < bins * 0.18) low += freq[i]
    else if (i < bins * 0.6) high += freq[i]
  }
  const total = low + high
  return { level: Math.min(1, rms * 4), bright: total > 0 ? high / total : 0.5 }
}

export function isAudioMuted() {
  return muted
}

// Development-only hook so the lip-sync path can be exercised in a browser test with a real audio file.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as unknown as Record<string, unknown>).__playTestVoice = (url: string) => {
    const el = new Audio(url)
    attachAudioAnalyser(el, false)
    void el.play()
    return el
  }
}
