import * as React from 'react'
import { cn } from '@/lib/utils'

/** Loading placeholder. Pulse animation is already defined by Tailwind's `animate-pulse`. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[#e8f0ea]', className)}
      {...props}
    />
  )
}

export { Skeleton }
