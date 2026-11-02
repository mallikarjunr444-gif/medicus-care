// High-performance Web Audio API micro-sound synthesizer for medical UI interactions
// Does not load external audio files; generates pristine synthetic chimes & tones on demand.

class SoundFX {
  private ctx: AudioContext | null = null
  private enabled: boolean = false

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable
    if (enable && !this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
  }

  public isEnabled() {
    return this.enabled
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // Soft glass click
  public playClick() {
    const ctx = this.getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }

  // Subtle hover shimmer
  public playHover() {
    const ctx = this.getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06)

    gain.gain.setValueAtTime(0.015, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.07)
  }

  // Medical ECG pulse chirp
  public playHeartbeatPulse() {
    const ctx = this.getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.03)
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08)

    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  }

  // Telemetry radar ping
  public playTelemetryPing() {
    const ctx = this.getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime) // C6
    osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.12) // E6

    gain.gain.setValueAtTime(0.035, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  }
}

export const soundFX = new SoundFX()
