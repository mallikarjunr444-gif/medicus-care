'use client'

import React, { useEffect, useState } from 'react'

export function CursorGlow() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-30 transition-opacity duration-500 ease-out"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 0.35 : 0,
      }}
    >
      <div className="w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-sky-500/20 via-indigo-500/15 to-teal-400/10 blur-[100px]" />
    </div>
  )
}
