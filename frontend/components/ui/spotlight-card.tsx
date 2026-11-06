'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Card with a cursor-following radial spotlight and a soft teal glow.
 * Wrap any surface; the spotlight renders behind its content (z-10).
 */
const SpotlightCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, onMouseMove, onMouseLeave, ...props }, ref) => {
    const [spot, setSpot] = React.useState({ x: 0, y: 0, o: 0 })

    return (
      <div
        ref={ref}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top, o: 1 })
          onMouseMove?.(e)
        }}
        onMouseLeave={(e) => {
          setSpot((prev) => ({ ...prev, o: 0 }))
          onMouseLeave?.(e)
        }}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(360px circle at ${spot.x}px ${spot.y}px, rgba(15,117,101,0.12), transparent 70%)`,
            opacity: spot.o,
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    )
  },
)
SpotlightCard.displayName = 'SpotlightCard'

export { SpotlightCard }
