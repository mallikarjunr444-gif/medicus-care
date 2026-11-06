'use client'

import React, { useEffect, useState } from 'react'

export type AudioVisualizerState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted'

interface AudioFrequencyVisualizerProps {
  state?: AudioVisualizerState
  audioLevel?: number
  barCount?: number
  className?: string
  showBadge?: boolean
}

export function AudioFrequencyVisualizer({
  state = 'idle',
  audioLevel = 0,
  barCount = 24,
  className = '',
  showBadge = true,
}: AudioFrequencyVisualizerProps) {
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(15))

  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    const updateBars = (time: number) => {
      if (time - lastTime > 65) {
        lastTime = time
        setBars((prev) =>
          prev.map((_, i) => {
            const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2)
            const bellMultiplier = Math.cos(centerDistance * (Math.PI / 2.2))

            if (state === 'speaking') {
              const liveMultiplier = Math.max(0.2, audioLevel * 2)
              const base = 25 + Math.random() * 65 * bellMultiplier * liveMultiplier
              return Math.min(100, Math.max(12, base))
            }

            if (state === 'listening') {
              const liveMultiplier = Math.max(0.15, audioLevel * 1.5)
              const base = 15 + Math.random() * 45 * bellMultiplier * liveMultiplier
              return Math.min(95, Math.max(10, base))
            }

            if (state === 'thinking') {
              const wave = Math.sin((time / 180) + i * 0.4) * 20 + 25
              return Math.max(10, wave)
            }

            // Idle breathing
            const idleWave = Math.sin((time / 400) + i * 0.2) * 6 + 12
            return Math.max(8, idleWave)
          })
        )
      }
      animId = requestAnimationFrame(updateBars)
    }

    animId = requestAnimationFrame(updateBars)
    return () => cancelAnimationFrame(animId)
  }, [state, audioLevel, barCount])

  const stateColors: Record<AudioVisualizerState, { bar: string; badge: string; text: string; label: string }> = {
    idle: {
      bar: 'bg-slate-500/40',
      badge: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
      text: 'Standby',
      label: 'Doctor Ready',
    },
    listening: {
      bar: 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      text: 'Listening',
      label: 'Listening to Patient…',
    },
    thinking: {
      bar: 'bg-gradient-to-t from-amber-600 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      text: 'Analyzing',
      label: 'Thinking…',
    },
    speaking: {
      bar: 'bg-gradient-to-t from-sky-600 to-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.6)]',
      badge: 'bg-sky-950/80 text-sky-300 border-sky-500/40',
      text: 'Speaking',
      label: 'Doctor Explaining…',
    },
    interrupted: {
      bar: 'bg-gradient-to-t from-rose-600 to-pink-400',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      text: 'Interrupted',
      label: 'Paused',
    },
  }

  const currentTheme = stateColors[state] || stateColors.idle

  return (
    <div className={`relative flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 py-2 backdrop-blur-xl shadow-xl transition-all duration-300 ${className}`}>
      {showBadge && (
        <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${currentTheme.badge}`}>
          <span className={`h-2 w-2 rounded-full ${state === 'speaking' || state === 'listening' ? 'animate-ping' : ''} ${
            state === 'speaking' ? 'bg-sky-400' : state === 'listening' ? 'bg-emerald-400' : state === 'thinking' ? 'bg-amber-400' : 'bg-slate-400'
          }`} />
          <span>{currentTheme.text}</span>
        </div>
      )}

      {/* Real-time Frequency Spectrum Bars */}
      <div className="flex h-8 items-end gap-1 overflow-hidden px-1">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ease-out ${currentTheme.bar}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  )
}
