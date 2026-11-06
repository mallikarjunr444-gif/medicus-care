import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MedicalInfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lucide icon rendered inside the accent medallion. */
  icon: LucideIcon
  title: string
  body: string
  /** Optional small eyebrow label above the title. */
  tag?: string
}

/**
 * Medical information card — a reusable surface for services, conditions,
 * guidance and triage facts. Light botanical register, matching
 * `clinical-primitives` and the landing page.
 */
const MedicalInfoCard = React.forwardRef<HTMLDivElement, MedicalInfoCardProps>(
  ({ icon: Icon, title, body, tag, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group rounded-2xl border border-[#e1e9e4] bg-white p-6',
          'shadow-[0_4px_18px_rgba(27,65,52,.045)]',
          'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(27,65,52,.09)] hover:border-[#cfe0d6]',
          className,
        )}
        {...props}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf6f1] text-[#0f7565] transition-colors group-hover:bg-[#e2f0e9]">
          <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
        </span>
        {tag ? (
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f7565]">{tag}</p>
        ) : null}
        <h3 className={cn('font-semibold text-[#25423b]', tag ? 'mt-1 text-base' : 'mt-4 text-base')}>{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-[#687b74]">{body}</p>
      </div>
    )
  },
)
MedicalInfoCard.displayName = 'MedicalInfoCard'

export { MedicalInfoCard }
