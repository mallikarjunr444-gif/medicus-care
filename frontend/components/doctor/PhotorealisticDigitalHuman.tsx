'use client'

import React, { useRef, useEffect, useState } from 'react'
import type { DoctorId, DoctorState } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import {
  RotateCcw,
  WifiOff,
} from 'lucide-react'

interface PhotorealisticDigitalHumanProps {
  doctorId: DoctorId
  doctorState: DoctorState
  isMuted?: boolean
  isRenderingLipSync?: boolean
  hasSeparateTtsAudio?: boolean
  subtitles?: string
  speakingVideoSrc?: string | null
  onSpeakingVideoEnded?: () => void
  onSpeakingVideoError?: () => void
  onStateChange?: (state: DoctorState) => void
  onReconnect?: () => void
  className?: string
}

export function PhotorealisticDigitalHuman({
  doctorId,
  doctorState,
  isMuted = false,
  isRenderingLipSync = false,
  hasSeparateTtsAudio = false,
  subtitles = '',
  speakingVideoSrc = null,
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

  // Physiological Simulation state refs (avoid React re-render lag)
  const simRef = useRef({
    startTime: 0,
    breathing: 0,
    head: { pitch: 0, yaw: 0, roll: 0, targetPitch: 0, targetYaw: 0, targetRoll: 0 },
    brows: { lift: 0, furrow: 0 },
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
        setPlaybackBlocked(false)
        videoRef.current.play().catch(() => setPlaybackBlocked(true))
      } else {
        videoRef.current.pause()
        setPlaybackBlocked(false)
      }
    }
  }, [doctorState, speakingVideoSrc])

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

      const t = (now - simRef.current.startTime) / 1000
      const sim = simRef.current

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
          sim.head.targetPitch = 0
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

      ctx.restore()
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [imageLoaded, doctorId, doctorState])

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
          muted={isMuted || hasSeparateTtsAudio}
          className="w-full h-full object-cover object-[center_25%] filter contrast-[1.03] brightness-[1.01]"
          onEnded={() => {
            if (onSpeakingVideoEnded) onSpeakingVideoEnded()
            else onStateChange?.('listening')
          }}
          onError={() => onSpeakingVideoError?.()}
        />
      ) : (
        /* Identity-preserving portrait shown while no generated response clip is active. */
        <canvas
          ref={canvasRef}
          width={1600}
          height={900}
          className="w-full h-full object-cover object-[center_25%] filter contrast-[1.03] brightness-[1.01]"
        />
      )}

      {isRenderingLipSync && !speakingVideoSrc && (
        <div className="absolute inset-x-4 bottom-20 z-20 mx-auto flex max-w-lg items-center justify-center gap-3 rounded-2xl border border-white/15 bg-slate-950/90 px-4 py-3 text-white shadow-xl backdrop-blur">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" />
          <span className="text-sm">
            {hasSeparateTtsAudio ? 'Doctor audio is playing · generating lip-synced video…' : 'Generating lip-synced video…'}
          </span>
        </div>
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

      {/* Doctor identity */}
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
              : doctorState === 'error' || doctorState === 'disconnected'
                ? 'bg-red-500/20 border-red-500/40 text-red-200'
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
              <span>Thinking…</span>
            </>
          )}
          {doctorState === 'error' && <span>Error</span>}
          {doctorState === 'interrupted' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Listening to patient…</span>
            </>
          )}
          {doctorState === 'idle' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Listening to patient…</span>
            </>
          )}
        </div>
      </div>

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
