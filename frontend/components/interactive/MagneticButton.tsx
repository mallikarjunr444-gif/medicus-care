'use client'

import React, { useRef, useState, useEffect } from 'react'
import { soundFX } from '@/lib/audioEffects'

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  strength?: number // 0 to 1
  className?: string
  sound?: 'click' | 'hover' | 'both' | 'none'
}

export function MagneticButton({
  children,
  strength = 0.35,
  className = '',
  sound = 'both',
  onClick,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    setPosition({ x: deltaX, y: deltaY })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (sound === 'hover' || sound === 'both') {
      soundFX.playHover()
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setPosition({ x: 0, y: 0 })
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sound === 'click' || sound === 'both') {
      soundFX.playClick()
    }
    if (onClick) onClick(e)
  }

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.25, 1, 0.5, 1)'
          : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
