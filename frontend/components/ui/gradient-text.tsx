import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Animated gradient text (shimmering teal → sky → mint). Use for headline accents. */
export function GradientText({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('text-gradient animate-gradient-x', className)}>{children}</span>
  )
}
