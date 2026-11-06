'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BentoCard } from '@/components/ui/bento-grid'

export interface MedicalInfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lucide icon rendered inside the accent medallion. */
  icon: LucideIcon
  title: string
  body: string
  /** Optional small eyebrow label above the title. */
  tag?: string
}

/**
 * Medical information card — a bento tile for services, guidance and triage
 * facts. Light botanical register with the cursor-following spotlight.
 */
const MedicalInfoCard = React.forwardRef<HTMLDivElement, MedicalInfoCardProps>(
  ({ icon: Icon, title, body, tag, className, ...props }, ref) => {
    return (
      <BentoCard ref={ref} className={cn('p-6', className)} {...props}>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf6f1] text-[#0f7565]">
          <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
        </span>
        {tag ? (
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f7565]">{tag}</p>
        ) : null}
        <h3 className={cn('font-semibold text-[#25423b]', tag ? 'mt-1 text-base' : 'mt-4 text-base')}>{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-[#687b74]">{body}</p>
      </BentoCard>
    )
  },
)
MedicalInfoCard.displayName = 'MedicalInfoCard'

export { MedicalInfoCard }
