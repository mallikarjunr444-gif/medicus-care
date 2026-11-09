'use client'

import { useRef, type ElementType } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

/** A heading whose words rise and sharpen one after another the first time it scrolls into view. */
export function WordReveal({ children, className, as: Tag = 'h2' }: { children: string; className?: string; as?: ElementType }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })
  const reduce = useReducedMotion()
  const words = children.split(' ')
  return (
    <Tag ref={ref} className={className} aria-label={children}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: '110%', opacity: 0, filter: 'blur(6px)' }}
            animate={inView || reduce ? { y: '0%', opacity: 1, filter: 'blur(0px)' } : undefined}
            transition={{ duration: 0.7, delay: i * 0.07, ease: [0.28, 0.11, 0.32, 1] }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
