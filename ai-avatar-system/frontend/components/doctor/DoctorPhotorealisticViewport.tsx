'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Video,
  Volume2,
  VolumeX,
  Sparkles,
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertCircle,
  Clock,
  Radio,
} from 'lucide-react'
import type { DoctorId, DoctorState, TriageLevel } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'

interface DoctorPhotorealisticViewportProps {
  doctorId: DoctorId
  doctorState: DoctorState
  audioLevel?: number
  isMuted?: boolean
  videoSrc?: string | null
  subtitles?: string
  activeTriage?: TriageLevel
  onStateChange?: (state: DoctorState) => void
  className?: string
}

export function DoctorPhotorealisticViewport({
  doctorId,
  doctorState,
  audioLevel = 0,
  isMuted = false,
  videoSrc = null,
  subtitles = '',
  activeTriage = 1,
  onStateChange,
  className = '',
}: DoctorPhotorealisticViewportProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doctor = DOCTORS[doctorId]

  // Micro-motion and natural physiological simulation state
  const [blinkPhase, setBlinkPhase] = useState<'open' | 'closing' | 'closed'>('open')
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0 })
  const [breathingScale, setBreathingScale] = useState(1.0)
  const [mouthOpen, setMouthOpen] = useState(0)

  // Physiological Blinking (every 2.8s to 4.5s)
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout
    let blinkCloseTimeout: NodeJS.Timeout

    const scheduleNextBlink = () => {
      const delay = 2800 + Math.random() * 1700
      blinkTimeout = setTimeout(() => {
        setBlinkPhase('closed')
        blinkCloseTimeout = setTimeout(() => {
          setBlinkPhase('open')
          scheduleNextBlink()
        }, 120) // 120ms natural blink duration
      }, delay)
    }

    scheduleNextBlink()
    return () => {
      clearTimeout(blinkTimeout)
      clearTimeout(blinkCloseTimeout)
    }
  }, [])

  // Sinusoidal Breathing Cycle (14 breaths per min = ~4.3s cycle)
  useEffect(() => {
    let frameId: number
    const startTime = performance.now()

    const animateBreathing = (now: number) => {
      const elapsed = (now - startTime) / 1000
      // 14 breaths/min = 0.233 Hz => angular freq = 2 * PI * 0.233 ~= 1.46 rad/s
      const cycle = Math.sin(elapsed * 1.46)
      const scale = 1.0 + cycle * 0.006 // subtle 0.6% chest/shoulder expansion
      setBreathingScale(scale)

      // Subtle natural gaze drift
      if (doctorState === 'listening') {
        setHeadTilt({
          x: Math.sin(elapsed * 0.8) * 0.4,
          y: Math.cos(elapsed * 0.6) * 0.3 + 0.8, // slight attentive forward tilt
        })
      } else if (doctorState === 'thinking') {
        setHeadTilt({
          x: 1.2, // glance slightly to the upper side
          y: -0.8,
        })
      } else if (doctorState === 'speaking') {
        // Conversational head nods modulated by audio level
        setHeadTilt({
          x: Math.sin(elapsed * 2.5) * 0.6,
          y: Math.sin(elapsed * 3.5) * 0.8 + (audioLevel > 0.1 ? 0.5 : 0),
        })
      } else {
        // Idle
        setHeadTilt({
          x: Math.sin(elapsed * 0.5) * 0.3,
          y: Math.cos(elapsed * 0.4) * 0.2,
        })
      }

      frameId = requestAnimationFrame(animateBreathing)
    }

    frameId = requestAnimationFrame(animateBreathing)
    return () => cancelAnimationFrame(frameId)
  }, [doctorState, audioLevel])

  // Mouth Viseme modulation during speech
  useEffect(() => {
    if (doctorState === 'speaking') {
      const targetOpen = Math.min(1.0, Math.max(0.1, audioLevel * 2.8))
      setMouthOpen(targetOpen)
    } else {
      setMouthOpen(0)
    }
  }, [doctorState, audioLevel])

  // Video element playback
  useEffect(() => {
    if (videoSrc && videoRef.current) {
      videoRef.current.src = videoSrc
      videoRef.current.play().catch(() => {})
    }
  }, [videoSrc])

  return (
    <div
      className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {/* ── Background Clinical Lighting Simulation ── */}
      <div className="absolute inset-0 bg-radial-gradient from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* ── Main Photorealistic Video Display Container ── */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${breathingScale}) translate3d(${headTilt.x}px, ${headTilt.y}px, 0)`,
        }}
      >
        {/* If video chunks are playing from MuseTalk */}
        {videoSrc ? (
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover rounded-none"
          />
        ) : (
          /* Photorealistic Doctor Visual Consultation Stream */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Base High-Resolution Doctor Image */}
            <img
              src="/doctor/Friendly Doctor in a Modern Consultation Office.png"
              alt="Dr. Smit, M.D. - MediCare AI Doctor"
              className="w-full h-full object-cover filter contrast-[1.02] brightness-[1.01]"
              onError={(e) => {
                // Graceful fallback to root asset path if relative path differs
                const target = e.target as HTMLImageElement
                if (!target.src.includes('avatar_doctor_ref.jpg')) {
                  target.src = '/doctor/doctor_portrait.jpg'
                }
              }}
            />

            {/* Neural Natural Eye Blinking Layer */}
            {blinkPhase === 'closed' && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-75"
                style={{
                  clipPath: 'circle(12% at 50% 32%)',
                  backdropFilter: 'blur(1px)',
                  backgroundColor: 'rgba(30, 20, 15, 0.45)',
                }}
              />
            )}

            {/* Speaking Viseme Mouth Synchronization Overlay (when active speech without video chunks) */}
            {doctorState === 'speaking' && mouthOpen > 0.05 && (
              <div
                className="absolute pointer-events-none transition-all duration-75 ease-out rounded-full"
                style={{
                  top: '44.8%',
                  left: '49.8%',
                  width: `${26 + mouthOpen * 6}px`,
                  height: `${10 + mouthOpen * 14}px`,
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(ellipse at center, #2e100c 45%, #6e2c21 75%, transparent 100%)',
                  opacity: Math.min(0.85, 0.3 + mouthOpen * 0.7),
                  boxShadow: '0 0 4px rgba(46, 16, 12, 0.6)',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Telemedicine Consultation Call Overlays ── */}

      {/* Top Left: Doctor Clinical Profile Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-lg text-white">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
            MD
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-tight">{doctor.formalTitle}</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
              AI Doctor
            </span>
          </div>
          <span className="text-[10px] text-slate-300 block">{doctor.specialty}</span>
        </div>
      </div>

      {/* Top Center: State Indicator Pill */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono backdrop-blur-md border transition-all duration-300 shadow-md ${
            doctorState === 'speaking'
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
              : doctorState === 'listening'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : doctorState === 'thinking'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : 'bg-slate-900/80 border-slate-700 text-slate-300'
          }`}
        >
          {doctorState === 'speaking' && (
            <>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Dr. Smit is speaking...</span>
            </>
          )}
          {doctorState === 'listening' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Listening attentively...</span>
            </>
          )}
          {doctorState === 'thinking' && (
            <>
              <div className="w-2 h-2 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Evaluating clinical context...</span>
            </>
          )}
          {doctorState === 'idle' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Consultation active</span>
            </>
          )}
        </div>
      </div>

      {/* Top Right: Call Quality & Video Standard Badge */}
      <div className="absolute top-4 right-20 sm:right-24 z-10 hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-slate-300 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>1080p • 25 FPS • Photorealistic</span>
      </div>

      {/* Bottom Center: Real-time Live Subtitles Bar */}
      {subtitles && (
        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-center pointer-events-none">
          <div className="max-w-2xl px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 text-white text-center text-xs sm:text-sm font-medium leading-relaxed shadow-2xl animate-fade-in">
            <span className="text-sky-400 font-bold mr-2">{doctor.name}:</span>
            <span>{subtitles}</span>
          </div>
        </div>
      )}
    </div>
  )
}
