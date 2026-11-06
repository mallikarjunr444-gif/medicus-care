import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Text with a light sheen that sweeps across it — a React Bits-style "Shiny
 * Text" effect. Colours are tuned for the light MediCare register.
 */
export function ShinyText({
  children,
  className,
  duration = 4,
}: {
  children: React.ReactNode
  className?: string
  duration?: number
}) {
  return (
    <span
      className={cn('shiny-text', className)}
      style={{ '--shiny-duration': `${duration}s` } as React.CSSProperties}
    >
      {children}
    </span>
  )
}
