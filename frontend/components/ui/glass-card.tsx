import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Light-register glassmorphism surface for the MediCare landing page.
 *
 * The repo already has dark glass utilities (`.glass-card`, `.glass-panel`)
 * used by the in-app consultation views. This component is the light sibling:
 * translucent white with a soft blur and hairline, so frosted cards still work
 * on the pale `#f5f8f6` canvas instead of stacking the dark variant.
 */
const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-white/70 bg-white/55',
        'backdrop-blur-xl backdrop-saturate-150',
        'shadow-[0_8px_32px_rgba(24,51,49,.08)]',
        className,
      )}
      {...props}
    />
  ),
)
GlassCard.displayName = 'GlassCard'

export { GlassCard }
