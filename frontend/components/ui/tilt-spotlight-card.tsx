'use client'

import * as React from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'

/** A card that tilts a few degrees toward the pointer and lights up under it. */
export function TiltSpotlightCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [4, -4]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-5, 5]), { stiffness: 150, damping: 18 })

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || e.pointerType !== 'mouse') return
    ref.current!.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current!.style.setProperty('--my', `${e.clientY - r.top}px`)
    if (!reduce) {
      px.set((e.clientX - r.left) / r.width - 0.5)
      py.set((e.clientY - r.top) / r.height - 0.5)
    }
  }
  const leave = () => {
    px.set(0)
    py.set(0)
  }

  return (
    <div className="h-full" style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className={cn('group relative h-full overflow-hidden', className)}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: 'radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(0,113,227,0.14), transparent 60%)' }}
        />
        <div className="relative flex h-full flex-col justify-between">{children}</div>
      </motion.div>
    </div>
  )
}
