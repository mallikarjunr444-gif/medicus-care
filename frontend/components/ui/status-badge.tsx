'use client'

import React from 'react'

export interface StatusBadgeProps {
  status: 'active' | 'live' | 'idle' | 'warning' | 'error' | 'success' | 'doctor'
  label: string
  sublabel?: string
  pulse?: boolean
  className?: string
  icon?: React.ReactNode
}

export function StatusBadge({
  status = 'active',
  label,
  sublabel,
  pulse = true,
  className = '',
  icon,
}: StatusBadgeProps) {
  const styles: Record<
    StatusBadgeProps['status'],
    { container: string; dot: string; ping: string; text: string }
  > = {
    active: {
      container: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
      dot: 'bg-teal-400',
      ping: 'bg-teal-400',
      text: 'text-teal-200',
    },
    live: {
      container: 'border-sky-500/40 bg-sky-500/15 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
      dot: 'bg-sky-400',
      ping: 'bg-sky-400',
      text: 'text-sky-100',
    },
    idle: {
      container: 'border-slate-700/50 bg-slate-800/40 text-slate-400',
      dot: 'bg-slate-400',
      ping: 'bg-slate-400',
      text: 'text-slate-300',
    },
    warning: {
      container: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      dot: 'bg-amber-400',
      ping: 'bg-amber-400',
      text: 'text-amber-200',
    },
    error: {
      container: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
      dot: 'bg-rose-400',
      ping: 'bg-rose-400',
      text: 'text-rose-200',
    },
    success: {
      container: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      dot: 'bg-emerald-400',
      ping: 'bg-emerald-400',
      text: 'text-emerald-200',
    },
    doctor: {
      container: 'border-cyan-500/30 bg-gradient-to-r from-teal-900/40 to-cyan-900/40 text-cyan-200 backdrop-blur-md',
      dot: 'bg-cyan-400',
      ping: 'bg-cyan-400',
      text: 'text-cyan-100',
    },
  }

  const current = styles[status] || styles.active

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md transition-all duration-300 ${current.container} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${current.ping}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${current.dot}`} />
      </span>
      {icon && <span className="opacity-90">{icon}</span>}
      <span className={current.text}>{label}</span>
      {sublabel && <span className="text-[10px] font-normal opacity-70">({sublabel})</span>}
    </span>
  )
}

