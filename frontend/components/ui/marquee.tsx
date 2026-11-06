import { cn } from '@/lib/utils'

export interface MarqueeProps {
  items: string[]
  className?: string
}

/** Infinite horizontal marquee with faded edges. Content is duplicated for a seamless loop. */
export function Marquee({ items, className }: MarqueeProps) {
  const half = (hidden: boolean) => (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span key={item} className="flex shrink-0 items-center gap-8">
          <span>{item}</span>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-30" />
        </span>
      ))}
    </div>
  )

  return (
    <div className={cn('marquee-mask relative flex w-full overflow-hidden', className)}>
      <div className="animate-marquee flex w-max items-center">
        {half(false)}
        {half(true)}
      </div>
    </div>
  )
}
