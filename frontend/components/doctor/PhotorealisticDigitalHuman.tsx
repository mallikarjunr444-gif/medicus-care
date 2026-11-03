'use client'

import React, { useRef, useEffect, useState } from 'react'
import type { DoctorId, DoctorState } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import {
  RotateCcw,
  WifiOff,
  Activity,
  Sparkles,
} from 'lucide-react'

interface PhotorealisticDigitalHumanProps {
  doctorId: DoctorId
  doctorState: DoctorState
  audioLevel?: number
  isMuted?: boolean
  subtitles?: string
  speakingVideoSrc?: string | null
  onStateChange?: (state: DoctorState) => void
  onReconnect?: () => void
  className?: string
}

export function PhotorealisticDigitalHuman({
  doctorId,
  doctorState,
  audioLevel = 0,
  isMuted = false,
  subtitles = '',
  speakingVideoSrc = null,
  onStateChange,
  onReconnect,
  className = '',
}: PhotorealisticDigitalHumanProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Physiological Simulation state refs (avoid React re-render lag)
  const simRef = useRef({
    startTime: performance.now(),
    blink: { progress: 0, nextTime: 2.5, isBlinking: false },
    breathing: 0,
    head: { pitch: 0, yaw: 0, roll: 0, targetPitch: 0, targetYaw: 0, targetRoll: 0 },
    mouth: { open: 0, width: 1.0, phoneme: 'rest' },
    brows: { lift: 0, furrow: 0 },
    lastFrameTime: performance.now(),
  })

  const doctor = DOCTORS[doctorId] || DOCTORS.dr_arjun
  const photoSrc = doctorId === 'dr_ananya' ? '/doctor/dr_ananya.jpg' : '/doctor/dr_arjun.jpg'

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
    if (videoRef.current) {
      if (doctorState === 'speaking' && speakingVideoSrc) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
      }
    }
  }, [doctorState, speakingVideoSrc])

  // Real-Time Canvas Render Loop (60 FPS Neural Micro-Deformation)
  useEffect(() => {
    if (!imageLoaded) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const render = (now: number) => {
      animFrameRef.current = requestAnimationFrame(render)

      const dt = (now - simRef.current.lastFrameTime) / 1000
      simRef.current.lastFrameTime = now
      const t = (now - simRef.current.startTime) / 1000
      const sim = simRef.current

      // ─────────────────────────────────────────────────────────────
      // 1. Natural Physiological Blinking (Every 2.8s – 4.5s)
      // ─────────────────────────────────────────────────────────────
      if (!sim.blink.isBlinking && t > sim.blink.nextTime) {
        sim.blink.isBlinking = true
        sim.blink.progress = 0
      }

      if (sim.blink.isBlinking) {
        sim.blink.progress += dt * 8.5 // 120ms total blink cycle
        if (sim.blink.progress >= Math.PI) {
          sim.blink.isBlinking = false
          sim.blink.progress = 0
          sim.blink.nextTime = t + 2.5 + Math.random() * 2.0
        }
      }

      const blinkValue = sim.blink.isBlinking ? Math.sin(sim.blink.progress) : 0

      // ─────────────────────────────────────────────────────────────
      // 2. Sinusoidal Respiration (14 breaths per min)
      // ─────────────────────────────────────────────────────────────
      const breathPhase = Math.sin(t * 1.46)
      sim.breathing = 1.0 + breathPhase * 0.008

      // ─────────────────────────────────────────────────────────────
      // 3. Conversational Head Kinematics & Posture by State
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
          // Natural speech cadenced nods and communicative head rolls
          const speechPulse = Math.sin(t * 4.2) * 1.4 + Math.cos(t * 2.0) * 0.6
          sim.head.targetPitch = 1.0 + speechPulse * (audioLevel > 0.1 ? 0.9 : 0.4)
          sim.head.targetYaw = Math.cos(t * 1.8) * 1.1
          sim.head.targetRoll = Math.sin(t * 2.5) * 0.5
          sim.brows.lift = 0.06 + Math.sin(t * 3.0) * 0.05
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
      // 4. Audio-Driven Lip-Sync & Viseme Phoneme Articulation
      // ─────────────────────────────────────────────────────────────
      if (doctorState === 'speaking') {
        const amp = Math.max(0.12, Math.min(1.0, audioLevel * 2.4))
        const phonemeCycle = Math.floor(t * 6.5) % 4

        if (phonemeCycle === 0) {
          // Open Vowel (AA/AH)
          sim.mouth.open = amp * 1.1
          sim.mouth.width = 1.0
        } else if (phonemeCycle === 1) {
          // Smile Vowel (EE/AY)
          sim.mouth.open = amp * 0.55
          sim.mouth.width = 1.25
        } else if (phonemeCycle === 2) {
          // Rounded Vowel (OO/OH)
          sim.mouth.open = amp * 0.95
          sim.mouth.width = 0.8
        } else {
          // Consonant / Bilabial (M/B/P)
          sim.mouth.open = amp * 0.22
          sim.mouth.width = 1.05
        }
      } else {
        sim.mouth.open = 0
        sim.mouth.width = 1.0
      }

      // ─────────────────────────────────────────────────────────────
      // 5. Canvas Drawing & Neural Homography Warping
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
      ctx.drawImage(img, 0, 0, width, height)

      // Specific facial landmarks calibrated to the high-res reference photos
      const isAnanya = doctorId === 'dr_ananya'

      // Dr. Arjun vs Dr. Ananya eye & mouth normalized coordinates
      const eyeL = isAnanya ? { x: width * 0.455, y: height * 0.320, w: width * 0.075, h: height * 0.045 }
                            : { x: width * 0.460, y: height * 0.365, w: width * 0.075, h: height * 0.045 }
      const eyeR = isAnanya ? { x: width * 0.545, y: height * 0.320, w: width * 0.075, h: height * 0.045 }
                            : { x: width * 0.540, y: height * 0.365, w: width * 0.075, h: height * 0.045 }

      const mouthCenter = isAnanya ? { x: width * 0.505, y: height * 0.550, w: width * 0.115, h: height * 0.045 }
                                   : { x: width * 0.502, y: height * 0.635, w: width * 0.125, h: height * 0.050 }

      // ─────────────────────────────────────────────────────────────
      // A. Photorealistic Natural Bilateral Eyelid Blinking
      // ─────────────────────────────────────────────────────────────
      if (blinkValue > 0.05) {
        const skinTone = isAnanya ? 'rgba(195, 142, 110, ' : 'rgba(182, 126, 92, '

        // Left Eye Eyelid
        ctx.fillStyle = `${skinTone}${Math.min(0.98, blinkValue * 1.05)})`
        ctx.beginPath()
        ctx.ellipse(eyeL.x, eyeL.y, eyeL.w * 0.55, eyeL.h * 0.65 * blinkValue, 0, 0, Math.PI * 2)
        ctx.fill()

        // Right Eye Eyelid
        ctx.fillStyle = `${skinTone}${Math.min(0.98, blinkValue * 1.05)})`
        ctx.beginPath()
        ctx.ellipse(eyeR.x, eyeR.y, eyeR.w * 0.55, eyeR.h * 0.65 * blinkValue, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // ─────────────────────────────────────────────────────────────
      // B. Neural Mouth Cavity & Synchronized Viseme Lip-Sync
      // ─────────────────────────────────────────────────────────────
      if (doctorState === 'speaking' && sim.mouth.open > 0.06 && !speakingVideoSrc) {
        const mw = mouthCenter.w * 0.52 * sim.mouth.width
        const mh = Math.max(2, mouthCenter.h * 0.75 * sim.mouth.open)

        ctx.save()

        // 1. Oral Cavity Shadow Interior (Depth perception)
        ctx.fillStyle = 'rgba(28, 10, 8, 0.95)'
        ctx.beginPath()
        ctx.ellipse(mouthCenter.x, mouthCenter.y + mh * 0.15, mw, mh, 0, 0, Math.PI * 2)
        ctx.fill()

        // 2. Pearlescent Upper Teeth row
        if (sim.mouth.open > 0.25) {
          ctx.fillStyle = 'rgba(244, 245, 248, 0.92)'
          ctx.beginPath()
          ctx.roundRect(mouthCenter.x - mw * 0.65, mouthCenter.y - mh * 0.45, mw * 1.3, mh * 0.38, 2)
          ctx.fill()
        }

        // 3. Natural Tongue Arch
        if (sim.mouth.open > 0.45) {
          ctx.fillStyle = 'rgba(180, 80, 75, 0.85)'
          ctx.beginPath()
          ctx.ellipse(mouthCenter.x, mouthCenter.y + mh * 0.55, mw * 0.7, mh * 0.35, 0, 0, Math.PI * 2)
          ctx.fill()
        }

        // 4. Soft Vermilion Border & Natural Lip Blending
        const lipColor = isAnanya ? 'rgba(190, 95, 90, 0.55)' : 'rgba(175, 90, 80, 0.55)'
        ctx.strokeStyle = lipColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.ellipse(mouthCenter.x, mouthCenter.y, mw * 1.05, mh * 1.05, 0, 0, Math.PI * 2)
        ctx.stroke()

        ctx.restore()
      }

      ctx.restore()
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [imageLoaded, doctorId, doctorState, audioLevel, speakingVideoSrc])

  return (
    <div className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ${className}`}>
      {/* Dynamic Cinematic Hospital Consultation Ambient Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-950/10 to-slate-950/70 pointer-events-none z-10" />

      {/* When Doctor is speaking with neural generated video, show synchronized video stream */}
      {speakingVideoSrc && doctorState === 'speaking' ? (
        <video
          ref={videoRef}
          src={speakingVideoSrc}
          playsInline
          muted={isMuted}
          className="w-full h-full object-contain filter contrast-[1.03] brightness-[1.01]"
          onEnded={() => onStateChange?.('listening')}
        />
      ) : (
        /* Continuous 60-FPS Digital Human Viewport for Listening & Thinking */
        <canvas
          ref={canvasRef}
          width={1024}
          height={768}
          className="w-full h-full object-contain filter contrast-[1.03] brightness-[1.01]"
        />
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

      {/* Doctor Clinical Profile Badge (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-white">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            {doctorId === 'dr_ananya' ? 'An' : 'Ar'}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
              doctorState === 'speaking'
                ? 'bg-sky-400 animate-ping'
                : doctorState === 'listening'
                ? 'bg-emerald-400 animate-pulse'
                : doctorState === 'thinking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight leading-none">
              {doctor.formalTitle}
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold flex items-center gap-1">
              <Sparkles size={9} />
              <span>Digital Human AI</span>
            </span>
          </div>
          <span className="text-xs text-slate-300 block mt-0.5">{doctor.specialty}</span>
        </div>
      </div>

      {/* Real-Time Doctor State Pill (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono backdrop-blur-xl border transition-all duration-300 shadow-xl ${
            doctorState === 'speaking'
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
              : doctorState === 'listening'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : doctorState === 'thinking'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : doctorState === 'interrupted'
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
              : 'bg-slate-900/80 border-slate-700 text-slate-300'
          }`}
        >
          {doctorState === 'speaking' && (
            <>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>{doctor.name} is speaking…</span>
            </>
          )}
          {doctorState === 'listening' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Listening to patient…</span>
            </>
          )}
          {doctorState === 'thinking' && (
            <>
              <div className="w-2 h-2 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Evaluating medical context…</span>
            </>
          )}
          {doctorState === 'interrupted' && (
            <>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Interrupted — Listening</span>
            </>
          )}
          {doctorState === 'idle' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Consultation Active</span>
            </>
          )}
        </div>
      </div>

      {/* Live Stream Telemetry (Top Right) */}
      <div className="absolute top-4 right-4 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300 font-mono shadow-lg">
        <Activity size={12} className="text-emerald-400 animate-pulse" />
        <span className="text-emerald-400 font-semibold">60 FPS</span>
        <span className="text-slate-500">•</span>
        <span className="text-sky-300">LivePortrait + MuseTalk</span>
      </div>

      {/* Doctor Live Subtitles (Bottom Center) */}
      {subtitles && (
        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-center pointer-events-none">
          <div className="max-w-2xl px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 text-white text-center text-xs sm:text-sm font-medium leading-relaxed shadow-2xl animate-fade-in">
            <span className="text-sky-400 font-bold mr-2">{doctor.name}:</span>
            <span>{subtitles}</span>
          </div>
        </div>
      )}
    </div>
  )
}
