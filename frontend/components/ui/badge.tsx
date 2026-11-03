'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'glass'
  glow?: boolean
}

function Badge({ className, variant = 'default', glow = false, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold font-mono tracking-tight transition-colors focus:outline-none select-none',
        variant === 'default' && 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
        variant === 'secondary' && 'bg-slate-800 text-slate-300 border border-slate-700',
        variant === 'success' && 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        variant === 'warning' && 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        variant === 'destructive' && 'bg-red-500/15 text-red-300 border border-red-500/40',
        variant === 'outline' && 'text-slate-300 border border-slate-700',
        variant === 'glass' && 'glass-pill text-sky-200 shadow-sm',
        glow && 'shadow-[0_0_12px_rgba(56,189,248,0.25)]',
        className
      )}
      {...props}
    />
  )
}

export { Badge }
