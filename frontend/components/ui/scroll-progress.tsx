'use client'

import { motion, useScroll, useSpring } from 'motion/react'

/** A hairline at the very top of the page that fills as you scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.3 })
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#0071e3] via-[#7a5cff] to-[#30b8d5]"
    />
  )
}
