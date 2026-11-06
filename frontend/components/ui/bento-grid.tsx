'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SpotlightCard } from '@/components/ui/spotlight-card'

/** Asymmetric bento layout (1 col → 2 → 3). Pass span classes per tile. */
export function BentoGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </div>
  )
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Larger, gradient-tinted tile used as the section's visual anchor. */
  featured?: boolean
}

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, featured = false, children, ...props }, ref) => (
    <SpotlightCard
      ref={ref}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border',
        featured
          ? 'gradient-ring border-[#cfe3da] bg-gradient-to-br from-[#f4faf6] via-white to-[#eef7f2] shadow-[0_18px_50px_-24px_rgba(15,117,101,.35)]'
          : 'border-[#e1e9e4] bg-white shadow-[0_4px_18px_rgba(27,65,52,.045)]',
        'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#cfe0d6] hover:shadow-[0_12px_32px_rgba(27,65,52,.09)]',
        className,
      )}
      {...props}
    >
      {children}
    </SpotlightCard>
  ),
)
BentoCard.displayName = 'BentoCard'

export { BentoCard }
