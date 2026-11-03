'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { soundFX } from '@/lib/audioEffects'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'ghost'
    | 'glass'
    | 'shimmer'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  sound?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', sound = true, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (sound) soundFX.playClick()
      if (onClick) onClick(e)
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-slate-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
          // Variant styling
          variant === 'default' &&
            'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20',
          variant === 'secondary' &&
            'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
          variant === 'destructive' &&
            'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20',
          variant === 'outline' &&
            'border border-slate-700 hover:border-sky-500/60 bg-transparent text-slate-300 hover:text-white',
          variant === 'ghost' &&
            'bg-transparent hover:bg-slate-800/80 text-slate-400 hover:text-white',
          variant === 'glass' &&
            'glass-pill text-white hover:bg-slate-800/80 shadow-md',
          variant === 'shimmer' &&
            'relative overflow-hidden bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 text-white shadow-xl shadow-sky-500/25',
          // Size styling
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-8 rounded-lg px-3 text-[11px]',
          size === 'lg' && 'h-12 rounded-2xl px-6 text-sm font-bold',
          size === 'icon' && 'h-9 w-9 p-0',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
