'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import type { DoctorId, DoctorState } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { DOCTOR_FACE_DATA } from '@/lib/doctorFaceData'
import { PortraitWarp } from '@/lib/portraitWarp'
import { readVoiceDrive } from '@/lib/audioEnergy'
import {
  RotateCcw,
  WifiOff,
} from 'lucide-react'
import { VoiceOrb } from '@/components/ui/voice-orb'

interface PhotorealisticDigitalHumanProps {
  doctorId: DoctorId
  doctorState: DoctorState
  isMuted?: boolean
  hasSeparateTtsAudio?: boolean
  subtitles?: string
  /** 0..1 level for speech that has no audio element (browser speech synthesis fallback). */
  fallbackSpeechLevel?: number
  speakingVideoSrc?: string | null
  speakingVideoStartAt?: number
  getSpeakingAudioTime?: () => number | null
  onSpeakingVideoEnded?: () => void
  onSpeakingVideoError?: () => void
  onStateChange?: (state: DoctorState) => void
  onReconnect?: () => void
  className?: string
}

const FACE_ANCHORS = {
  dr_ananya: { eyes: [{ x: 0.459, y: 0.193 }, { x: 0.539, y: 0.183 }], mouth: { x: 0.502, y: 0.294 }, eyeWidth: 0.025, mouthWidth: 0.032 },
  dr_arjun: { eyes: [{ x: 0.489, y: 0.198 }, { x: 0.548, y: 0.189 }], mouth: { x: 0.522, y: 0.296 }, eyeWidth: 0.022, mouthWidth: 0.028 },
} as const

export function PhotorealisticDigitalHuman({
  doctorId,
  doctorState,
  isMuted = false,
  hasSeparateTtsAudio = false,
  subtitles = '',
  fallbackSpeechLevel = 0,
  speakingVideoSrc = null,
  speakingVideoStartAt = 0,
  getSpeakingAudioTime,
  onSpeakingVideoEnded,
  onSpeakingVideoError,
  onStateChange,
  onReconnect,
  className = '',
}: PhotorealisticDigitalHumanProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [playbackBlocked, setPlaybackBlocked] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  // Physiological Simulation state refs (avoid React re-render lag)
  const simRef = useRef({
    startTime: 0,
    lastFrameTime: 0,
    nextBlinkAt: 2.4,
    blinkStartedAt: -1,
    breathing: 0,
    head: { pitch: 0, yaw: 0, roll: 0, targetPitch: 0, targetYaw: 0, targetRoll: 0 },
    brows: { lift: 0, furrow: 0 },
    mouth: { open: 0, wide: 1 },
    browLift: 0,
    doubleBlink: false,
  })
  const fallbackLevelRef = useRef(fallbackSpeechLevel)
  useEffect(() => {
    fallbackLevelRef.current = fallbackSpeechLevel
  }, [fallbackSpeechLevel])

  const doctor = DOCTORS[doctorId] || DOCTORS.dr_arjun
  const photoSrc = doctorId === 'dr_ananya' ? '/doctor/dr_ananya.jpg' : '/doctor/dr_arjun.jpg'
  // Normalized landmark estimates for the two bundled portraits. This keeps
  // the fallback animation local and inexpensive; no cloud model or GPU needed.
  const face = FACE_ANCHORS[doctorId]
  const warp = useMemo(() => new PortraitWarp(DOCTOR_FACE_DATA[doctorId === 'dr_ananya' ? 'dr_ananya' : 'dr_arjun']), [doctorId])

  // Preload Doctor High-Res Photograph
  useEffect(() => {
    setImageLoaded(false)
    const img = new Image()
    img.src = photoSrc
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
    }
  }, [photoSrc])

  // Synchronized Video playback for speaking animation
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      setPlaybackBlocked(false)
      setVideoReady(false)
      return
    }
    video.pause()
    setPlaybackBlocked(false)
    setVideoReady(false)
    if (doctorState !== 'speaking' || !speakingVideoSrc) return

    let cancelled = false
    const startFromMatchingAudioTime = () => {
      if (cancelled) return
      const audioTime = getSpeakingAudioTime?.()
      if (getSpeakingAudioTime && audioTime === null) return
      const startAt = audioTime ?? speakingVideoStartAt
      const latestSafeTime = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.04) : startAt
      video.currentTime = Math.min(Math.max(0, startAt), latestSafeTime)
      video.play().catch(() => setPlaybackBlocked(true))
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      startFromMatchingAudioTime()
    } else {
      video.addEventListener('loadedmetadata', startFromMatchingAudioTime, { once: true })
    }

    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', startFromMatchingAudioTime)
    }
  }, [doctorState, speakingVideoSrc, speakingVideoStartAt, getSpeakingAudioTime])

  // Subtle idle/listening movement while the real response video is prepared.
  useEffect(() => {
    if (!imageLoaded) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    simRef.current.startTime = performance.now()

    const render = (now: number) => {
      animFrameRef.current = requestAnimationFrame(render)

      // A still portrait needs only gentle motion; cap work to ~24fps for
      // laptops without a discrete GPU instead of repainting at display rate.
      if (now - simRef.current.lastFrameTime < 1000 / 24) return
      simRef.current.lastFrameTime = now

      const t = (now - simRef.current.startTime) / 1000
      const sim = simRef.current

      if (t >= sim.nextBlinkAt) {
        sim.blinkStartedAt = t
        // Mostly single blinks every 2.5-6 s, sometimes a quick double blink, as people do.
        sim.doubleBlink = Math.random() < 0.18
        sim.nextBlinkAt = t + (sim.doubleBlink ? 0.55 : 2.5 + Math.random() * 3.5)
      }
      const blinkCurve = (age: number) =>
        age < 0 ? 0 : age < 0.08 ? age / 0.08 : age < 0.26 ? 1 - (age - 0.08) / 0.18 : 0
      let blink = blinkCurve(t - sim.blinkStartedAt)
      if (sim.doubleBlink) blink = Math.max(blink, blinkCurve(t - sim.blinkStartedAt - 0.3))

      // ─────────────────────────────────────────────────────────────
      // 1. Subtle idle breathing
      // ─────────────────────────────────────────────────────────────
      const breathPhase = Math.sin(t * 1.46)
      sim.breathing = 1.0 + breathPhase * 0.008

      // ─────────────────────────────────────────────────────────────
      // 2. Conversational Head Kinematics & Posture by State
      // ─────────────────────────────────────────────────────────────
      switch (doctorState) {
        case 'listening':
          // Attentive forward posture with micro-nods
          sim.head.targetPitch = 2.2 + Math.sin(t * 2.2) * 0.9
          sim.head.targetYaw = Math.sin(t * 0.8) * 0.6
          sim.head.targetRoll = 0.4
          sim.brows.lift = 0.08
          sim.brows.furrow = 0.0
          break

        case 'thinking':
          // Contemplative upward-side glance
          sim.head.targetPitch = -1.5
          sim.head.targetYaw = 2.4 + Math.sin(t * 1.0) * 0.5
          sim.head.targetRoll = -0.8
          sim.brows.lift = 0.0
          sim.brows.furrow = 0.15
          break

        case 'speaking':
          sim.head.targetPitch = sim.mouth.open * 0.9 - 0.2
          sim.head.targetYaw = 0
          sim.head.targetRoll = 0
          sim.brows.lift = 0
          sim.brows.furrow = 0.0
          break

        case 'interrupted':
          // Recoils attentively
          sim.head.targetPitch = -0.5
          sim.head.targetYaw = 0
          sim.head.targetRoll = 0
          sim.brows.lift = 0.18
          break

        case 'idle':
        default:
          sim.head.targetPitch = Math.sin(t * 0.6) * 0.5
          sim.head.targetYaw = Math.cos(t * 0.5) * 0.4
          sim.head.targetRoll = 0
          sim.brows.lift = 0
          sim.brows.furrow = 0
          break
      }

      // Smooth lerp damping
      const lerp = 0.08
      sim.head.pitch += (sim.head.targetPitch - sim.head.pitch) * lerp
      sim.head.yaw += (sim.head.targetYaw - sim.head.yaw) * lerp
      sim.head.roll += (sim.head.targetRoll - sim.head.roll) * lerp

      // ─────────────────────────────────────────────────────────────
      // Canvas drawing for the listening portrait
      // ─────────────────────────────────────────────────────────────
      const width = canvas.width
      const height = canvas.height
      const img = imageRef.current
      if (!img) return

      ctx.clearRect(0, 0, width, height)

      ctx.save()
      // Center origin for scale & perspective rotation
      ctx.translate(width / 2, height / 2)
      ctx.scale(sim.breathing, sim.breathing)
      ctx.translate(sim.head.yaw * 3.5, sim.head.pitch * 3.0)
      ctx.rotate((sim.head.roll * Math.PI) / 180)
      ctx.translate(-width / 2, -height / 2)

      // Draw Base Doctor Photorealistic Portrait
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
      const drawWidth = img.naturalWidth * scale
      const drawHeight = img.naturalHeight * scale
      // Bias the crop upward so the doctor's hair remains in frame in a wide viewport.
      ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) * 0.25, drawWidth, drawHeight)

      // Animate the real photograph: eyelids, jaw/lips (driven by the voice that is playing), brows.
      const drawX = (width - drawWidth) / 2
      const drawY = (height - drawHeight) * 0.25
      const forceVoice = process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as unknown as { __portraitForceVoice?: boolean }).__portraitForceVoice
      const voice = doctorState === 'speaking' || forceVoice ? readVoiceDrive() : null
      let openTarget = 0
      let wideTarget = 1
      if (voice) {
        openTarget = Math.min(1, Math.max(0, voice.level * 1.4 - 0.05))
        wideTarget = 0.97 + voice.bright * 0.1
      } else if (doctorState === 'speaking' && fallbackLevelRef.current > 0) {
        openTarget = Math.min(1, fallbackLevelRef.current * 0.8)
        wideTarget = 1 + (openTarget - 0.4) * 0.1
      }
      const mouth = sim.mouth
      mouth.open += (openTarget - mouth.open) * (openTarget > mouth.open ? 0.6 : 0.3)
      mouth.wide += (wideTarget - mouth.wide) * 0.3
      if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') (window as unknown as { __portraitMouth?: number }).__portraitMouth = mouth.open
      sim.browLift += (Math.min(1, mouth.open * 1.4) * 0.6 - sim.browLift) * 0.1

      const debug = typeof window !== 'undefined' && process.env.NODE_ENV !== 'production'
        ? (window as unknown as { __portraitPose?: Partial<{ blink: number; open: number; wide: number; brow: number }> }).__portraitPose
        : undefined
      ctx.save()
      ctx.translate(drawX, drawY)
      ctx.scale(drawWidth / img.naturalWidth, drawHeight / img.naturalHeight)
      warp.draw(ctx, img, {
        blink: debug?.blink ?? blink,
        open: debug?.open ?? mouth.open,
        wide: debug?.wide ?? mouth.wide,
        brow: debug?.brow ?? sim.browLift,
      })
      ctx.restore()

      ctx.restore()
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [imageLoaded, doctorId, doctorState, speakingVideoSrc, videoReady, warp])

  return (
    <div className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ${className}`}>
      {/* Dynamic Cinematic Hospital Consultation Ambient Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-950/10 to-slate-950/70 pointer-events-none z-10" />

      {/* When Doctor is speaking with neural generated video, show synchronized video stream */}
      <canvas
        ref={canvasRef}
        width={1600}
        height={900}
        className="absolute inset-0 h-full w-full object-cover object-[center_25%] filter contrast-[1.03] brightness-[1.01]"
      />

      {speakingVideoSrc && doctorState === 'speaking' && (
        <video
          key={speakingVideoSrc}
          ref={videoRef}
          src={speakingVideoSrc}
          playsInline
          muted={isMuted || hasSeparateTtsAudio}
          className={`absolute inset-0 h-full w-full object-cover object-[center_25%] filter contrast-[1.03] brightness-[1.01] transition-opacity duration-150 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          onPlaying={() => setVideoReady(true)}
          onWaiting={() => setVideoReady(false)}
          onEnded={() => {
            setVideoReady(false)
            if (onSpeakingVideoEnded) onSpeakingVideoEnded()
            else onStateChange?.('listening')
          }}
          onError={() => onSpeakingVideoError?.()}
        />
      )}

      {playbackBlocked && speakingVideoSrc && doctorState === 'speaking' && (
        <button
          type="button"
          onClick={() => videoRef.current?.play().then(() => setPlaybackBlocked(false)).catch(() => setPlaybackBlocked(true))}
          className="absolute z-30 rounded-xl border border-white/20 bg-slate-950/90 px-4 py-3 text-sm font-medium text-white shadow-xl"
        >
          Tap to play synchronized response
        </button>
      )}

      {/* Disconnected State Overlay */}
      {doctorState === 'disconnected' && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <WifiOff size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Consultation Stream Disconnected</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            Connection to {doctor.name} was temporarily interrupted. Reconnect to resume.
          </p>
          <button
            onClick={onReconnect}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
          >
            <RotateCcw size={14} />
            <span>Reconnect to Doctor</span>
          </button>
        </div>
      )}

      {/* VoiceOrb Visual Feedback when Doctor is Attentively Listening */}
      {doctorState === 'listening' && (
        <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-1.5 pointer-events-none transition-all duration-300">
          <div className="relative flex items-center justify-center p-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 shadow-xl shadow-emerald-950/50">
            <VoiceOrb
              activity={Math.min(1, Math.max(0.18, fallbackSpeechLevel * 1.5))}
              colors={doctorId === 'dr_ananya' ? ['#0d9488', '#99f6e4', '#042f2e'] : ['#0e6257', '#5eead4', '#064e3b']}
              className="w-16 h-16 sm:w-20 sm:h-20"
              speed={1.2}
            />
          </div>
          <span className="text-[11px] font-semibold text-emerald-300 tracking-wide bg-slate-950/85 px-2.5 py-0.5 rounded-full border border-emerald-500/20 backdrop-blur-sm shadow-md">
            Doctor listening…
          </span>
        </div>
      )}

      {/* Doctor Live Subtitles (Bottom Center) */}
      {subtitles && (
        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-center pointer-events-none" aria-live="polite" aria-atomic="true">
          <div className="max-h-20 max-w-4xl overflow-hidden px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 text-white text-center text-xs sm:text-sm font-medium leading-relaxed shadow-2xl animate-fade-in">
            <span className="text-sky-400 font-bold mr-2">{doctor.name}:</span>
            <span>{subtitles}</span>
          </div>
        </div>
      )}
    </div>
  )
}
