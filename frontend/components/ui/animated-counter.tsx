'use client'

import { useEffect, useRef, useState } from 'react'

export interface AnimatedCounterProps {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

/** Counts up from 0 to `to` the first time it scrolls into view. */
export function AnimatedCounter({ to, duration = 1800, prefix = '', suffix = '', className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setValue(to)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * to))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )

    io.observe(node)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  )
}
