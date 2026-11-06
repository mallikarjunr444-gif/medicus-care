'use client'

import React from 'react'

export interface GlowEffectProps {
  className?: string
  style?: React.CSSProperties
  colors?: string[]
  mode?: 'rotate' | 'pulse' | 'breathe' | 'colorShift' | 'static'
  blur?: 'softest' | 'soft' | 'medium' | 'strong' | 'stronger'
  scale?: number
  duration?: number
  children?: React.ReactNode
}

const blurMap = {
  softest: 'blur-xs',
  soft: 'blur-sm',
  medium: 'blur-md',
  strong: 'blur-xl',
  stronger: 'blur-2xl',
}

export function GlowEffect({
  className = '',
  style,
  colors = ['#0f766e', '#0284c7', '#38bdf8', '#10b981'],
  mode = 'rotate',
  blur = 'strong',
  scale = 1,
  duration = 6,
  children,
}: GlowEffectProps) {
  const gradientColors = colors.join(', ')

  return (
    <div className={`relative isolate ${className}`} style={style}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -inset-1 -z-10 rounded-inherit opacity-75 transition-opacity duration-500 group-hover:opacity-100 ${blurMap[blur] || 'blur-xl'}`}
        style={{
          background:
            mode === 'rotate'
              ? `conic-gradient(from 0deg at 50% 50%, ${gradientColors})`
              : `radial-gradient(circle at 50% 50%, ${colors[0]} 0%, transparent 80%)`,
          animation:
            mode === 'rotate'
              ? `spin ${duration}s linear infinite`
              : mode === 'pulse'
                ? `pulse ${duration / 2}s cubic-bezier(0.4, 0, 0.6, 1) infinite`
                : undefined,
          transform: `scale(${scale})`,
        }}
      />
      {children}
    </div>
  )
}

