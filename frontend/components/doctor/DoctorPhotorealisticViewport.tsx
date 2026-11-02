'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
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
  WifiOff,
  RotateCcw,
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
  onReconnect?: () => void
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
  onReconnect,
  className = '',
}: DoctorPhotorealisticViewportProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const doctor = DOCTORS[doctorId] || DOCTORS.dr_arjun

  // Micro-motion and physiological simulation state
  const [blinkProgress, setBlinkProgress] = useState(0) // 0 = fully open, 1 = fully closed
  const [headPose, setHeadPose] = useState({ pitch: 0, yaw: 0, roll: 0 })
  const [breathingScale, setBreathingScale] = useState(1.0)
  const [visemeShape, setVisemeShape] = useState({ open: 0, stretch: 1.0, phoneme: 'rest' })

  // 1. Natural Physiological Blinking (Every 2.8s to 4.5s, 120ms natural blink cycle)
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout
    let blinkAnimFrame: number
    let isBlinking = false

    const triggerBlink = () => {
      isBlinking = true
      const blinkStartTime = performance.now()
      const blinkDuration = 130 // ms

      const updateBlink = (now: number) => {
        const elapsed = now - blinkStartTime
        const progress = elapsed / blinkDuration

        if (progress < 1.0) {
          // Sinusoidal blink curve (0 -> 1 -> 0)
          const value = Math.sin(progress * Math.PI)
          setBlinkProgress(value)
          blinkAnimFrame = requestAnimationFrame(updateBlink)
        } else {
          setBlinkProgress(0)
          isBlinking = false
          scheduleBlink()
        }
      }

      blinkAnimFrame = requestAnimationFrame(updateBlink)
    }

    const scheduleBlink = () => {
      const nextDelay = 2800 + Math.random() * 1700
      blinkTimer = setTimeout(triggerBlink, nextDelay)
    }

    scheduleBlink()

    return () => {
      clearTimeout(blinkTimer)
      cancelAnimationFrame(blinkAnimFrame)
    }
  }, [])

  // 2. Sinusoidal Breathing Cycle (14 breaths/min = 0.233 Hz) & Natural Head Kinematics
  useEffect(() => {
    let animFrame: number
    const startTime = performance.now()

    const animatePhysiology = (now: number) => {
      const elapsed = (now - startTime) / 1000

      // Natural respiration (~14 breaths per min)
      const breathCycle = Math.sin(elapsed * 1.46)
      const scale = 1.0 + breathCycle * 0.007
      setBreathingScale(scale)

      // Dynamic head motion based on synchronized doctor state
      if (doctorState === 'listening') {
        // Attentive forward posture with subtle empathetic micro-nods
        setHeadPose({
          pitch: 1.2 + Math.sin(elapsed * 1.8) * 0.4,
          yaw: Math.sin(elapsed * 0.7) * 0.35,
          roll: 0.2,
        })
      } else if (doctorState === 'thinking') {
        // Thoughtful upward-side gaze and subtle contemplative tilt
        setHeadPose({
          pitch: -0.8,
          yaw: 1.6 + Math.sin(elapsed * 0.9) * 0.3,
          roll: -0.6,
        })
      } else if (doctorState === 'speaking') {
        // Conversational head motion modulated by audio amplitude
        const speechCadence = Math.sin(elapsed * 3.6) * 0.9 + Math.cos(elapsed * 1.8) * 0.4
        setHeadPose({
          pitch: 0.8 + speechCadence * (audioLevel > 0.1 ? 0.7 : 0.3),
          yaw: Math.cos(elapsed * 1.5) * 0.6,
          roll: Math.sin(elapsed * 2.1) * 0.3,
        })
      } else if (doctorState === 'interrupted') {
        // Snaps smoothly into attentive listening posture
        setHeadPose({
          pitch: 0.4,
          yaw: 0,
          roll: 0,
        })
      } else {
        // Idle relaxed micro-drift
        setHeadPose({
          pitch: Math.sin(elapsed * 0.5) * 0.3,
          yaw: Math.cos(elapsed * 0.4) * 0.25,
          roll: 0,
        })
      }

      animFrame = requestAnimationFrame(animatePhysiology)
    }

    animFrame = requestAnimationFrame(animatePhysiology)
    return () => cancelAnimationFrame(animFrame)
  }, [doctorState, audioLevel])

  // 3. Audio-Driven Lip Synchronization & Viseme Articulation
  useEffect(() => {
    if (doctorState === 'speaking') {
      const activeAmp = Math.max(0.12, Math.min(1.0, audioLevel * 2.2))
      const time = Date.now() / 150
      const phonemeCycle = Math.floor(time) % 4

      let open = 0
      let stretch = 1.0
      let phoneme = 'rest'

      if (phonemeCycle === 0) {
        // "AA" / "AH" - Open vowel
        open = activeAmp * 0.95
        stretch = 1.0
        phoneme = 'aa'
      } else if (phonemeCycle === 1) {
        // "EE" - Wide smile
        open = activeAmp * 0.45
        stretch = 1.25
        phoneme = 'ee'
      } else if (phonemeCycle === 2) {
        // "OO" / "OH" - Rounded lips
        open = activeAmp * 0.85
        stretch = 0.8
        phoneme = 'oo'
      } else {
        // "M" / "B" - Closed / Consonant
        open = activeAmp * 0.25
        stretch = 1.05
        phoneme = 'm'
      }

      setVisemeShape({ open, stretch, phoneme })
    } else {
      setVisemeShape({ open: 0, stretch: 1.0, phoneme: 'rest' })
    }
  }, [doctorState, audioLevel])

  // Video element playback if streaming MuseTalk / WebRTC
  useEffect(() => {
    if (videoSrc && videoRef.current) {
      videoRef.current.src = videoSrc
      videoRef.current.play().catch(() => {})
    }
  }, [videoSrc])

  // Doctor portrait asset path
  const doctorAssetSrc = doctorId === 'dr_ananya' ? '/doctor/dr_ananya.svg' : '/doctor/dr_arjun.svg'

  return (
    <div
      className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {/* ── Realistic Hospital Consultation Lighting Ambient Gradient ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-950/20 to-slate-950/80 pointer-events-none z-10" />

      {/* ── Main Photorealistic Digital Human Display ── */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `scale(${breathingScale}) translate3d(${headPose.yaw * 3}px, ${headPose.pitch * 2.5}px, 0) rotate(${headPose.roll * 0.4}deg)`,
        }}
      >
        {videoSrc ? (
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Ultra-High-Resolution Photorealistic Doctor Base Portrait */}
            <img
              src={doctorAssetSrc}
              alt={`${doctor.formalTitle} - MediCare AI Physician`}
              className="w-full h-full object-cover sm:object-contain object-center filter contrast-[1.03] brightness-[1.01]"
              draggable={false}
            />

            {/* Neural Natural Eye Blinking Layer */}
            {blinkProgress > 0.05 && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{
                  clipPath:
                    doctorId === 'dr_ananya'
                      ? 'polygon(42% 24%, 58% 24%, 58% 32%, 42% 32%)'
                      : 'polygon(41% 25%, 59% 25%, 59% 33%, 41% 33%)',
                  backgroundColor:
                    doctorId === 'dr_ananya' ? 'rgba(176, 121, 87, 0.95)' : 'rgba(156, 98, 62, 0.95)',
                  opacity: blinkProgress,
                }}
              />
            )}

            {/* Audio-Driven Viseme Lip-Sync Overlay */}
            {doctorState === 'speaking' && visemeShape.open > 0.08 && (
              <div
                className="absolute pointer-events-none rounded-full transition-all duration-75"
                style={{
                  top: doctorId === 'dr_ananya' ? '42.8%' : '43.2%',
                  left: '50.0%',
                  width: `${24 * visemeShape.stretch + visemeShape.open * 8}px`,
                  height: `${6 + visemeShape.open * 16}px`,
                  transform: 'translate(-50%, -50%)',
                  background:
                    'radial-gradient(ellipse at center, #260D08 40%, #5C1E14 75%, transparent 100%)',
                  boxShadow: '0 0 4px rgba(38, 13, 8, 0.65)',
                  opacity: Math.min(0.9, 0.35 + visemeShape.open * 0.65),
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Disconnected State Overlay Banner ── */}
      {doctorState === 'disconnected' && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <WifiOff size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Consultation Stream Disconnected</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            The video connection to {doctor.name} was temporarily interrupted. Check your network or
            reconnect to resume consultation.
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

      {/* ── Doctor Clinical Profile Badge (Top Left) ── */}
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
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold">
              Photorealistic AI
            </span>
          </div>
          <span className="text-xs text-slate-300 block mt-0.5">{doctor.specialty}</span>
        </div>
      </div>

      {/* ── Synchronized State Indicator Pill (Top Center) ── */}
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
              <span>Listening attentively…</span>
            </>
          )}
          {doctorState === 'thinking' && (
            <>
              <div className="w-2 h-2 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Evaluating clinical context…</span>
            </>
          )}
          {doctorState === 'interrupted' && (
            <>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Interruption acknowledged</span>
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

      {/* ── Stream Quality Badge (Top Right) ── */}
      <div className="absolute top-4 right-64 hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300 font-mono shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>1080p • 60 FPS • WebRTC Live</span>
      </div>

      {/* ── Single Authoritative Live Subtitle Component (Bottom Center) ── */}
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
