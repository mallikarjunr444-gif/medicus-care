'use client'

import * as React from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { cn } from '@/lib/utils'

interface MotionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  large?: boolean
  variant?: 'solid' | 'dark' | 'light'
  className?: string
  arrow?: boolean
}

/** Pill button that leans toward the pointer, presses in on click and sweeps a soft shine across on hover. */
export function MotionButton({ children, onClick, large = false, variant = 'solid', className, arrow = true }: MotionButtonProps) {
  const reduce = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 })
  const ref = React.useRef<HTMLButtonElement>(null)

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - (r.left + r.width / 2)) * 0.18)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const tone =
    variant === 'solid'
      ? 'bg-[#0071e3] text-white shadow-[0_10px_30px_-10px_rgba(0,113,227,0.7)] hover:bg-[#0077ed]'
      : variant === 'dark'
        ? 'bg-[#1d1d1f] text-white hover:bg-black'
        : 'bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-normal transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30',
        large ? 'h-12 px-7 text-[17px]' : 'h-11 px-6 text-[17px]',
        tone,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/30 opacity-0 blur-md transition-all duration-700 ease-out group-hover:left-[120%] group-hover:opacity-100"
      />
      <span className="relative">{children}</span>
      {arrow && (
        <span aria-hidden="true" className="relative inline-block transition-transform duration-300 group-hover:translate-x-1">
          ›
        </span>
      )}
    </motion.button>
  )
}
