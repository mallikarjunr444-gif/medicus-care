import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Soft animated gradient halo behind a panel — a light-touch take on React
 * Bits' "Border Glow". Wrap any rounded surface; the glow intensifies on hover.
 */
export function BorderGlow({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('group relative isolate rounded-[inherit]', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 -z-10 rounded-[inherit] bg-gradient-to-r from-[#0058b0] via-[#0071e3] to-[#12b76a] opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-75"
      />
      {children}
    </div>
  )
}
