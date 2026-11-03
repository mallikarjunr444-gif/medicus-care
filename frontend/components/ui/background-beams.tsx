'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]',
        className
      )}
    >
      <svg
        className="absolute left-0 top-0 h-full w-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        fill="none"
      >
        <g filter="url(#beamsFilter)">
          <path
            d="M -100 200 C 300 100, 700 600, 1540 300"
            stroke="url(#beamGrad1)"
            strokeWidth="2"
            strokeDasharray="8 12"
          />
          <path
            d="M -50 400 C 400 250, 900 800, 1600 450"
            stroke="url(#beamGrad2)"
            strokeWidth="1.5"
            strokeDasharray="6 14"
          />
          <path
            d="M 100 100 C 500 500, 800 200, 1500 700"
            stroke="url(#beamGrad1)"
            strokeWidth="2"
            strokeDasharray="10 16"
          />
        </g>
        <defs>
          <filter id="beamsFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#818CF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
