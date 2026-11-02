'use client'

import React, { useRef, useState } from 'react'
import { soundFX } from '@/lib/audioEffects'

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxTilt?: number // degrees
  glare?: boolean
  className?: string
}

export function TiltCard({
  children,
  maxTilt = 12,
  glare = true,
  className = '',
  onMouseEnter,
  onMouseLeave,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate rotation (-maxTilt to +maxTilt)
    const rotateX = ((y - centerY) / centerY) * -maxTilt
    const rotateY = ((x - centerX) / centerX) * maxTilt

    setRotate({ x: rotateX, y: rotateY })

    // Calculate glare percentage
    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100
    setGlarePos({ x: glareX, y: glareY, opacity: 0.15 })
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    soundFX.playHover()
    if (onMouseEnter) onMouseEnter(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setRotate({ x: 0, y: 0 })
    setGlarePos((prev) => ({ ...prev, opacity: 0 }))
    if (onMouseLeave) onMouseLeave(e)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: rotate.x === 0 && rotate.y === 0
          ? 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
          : 'transform 0.1s ease-out',
        transformStyle: 'preserve-3d',
      }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Dynamic Specular Glare Overlay */}
      {glare && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 240px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 80%)`,
          }}
        />
      )}
      {children}
    </div>
  )
}
