'use client'

import { useState } from 'react'
import Image from 'next/image'
import { RotateCcw } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

export interface AppleFoldableHeroProps {
  onSelectDoctor: (id: DoctorId) => void
  eyebrow?: string
  headline?: React.ReactNode
  tagline?: string
}

/**
 * Foldable phone hero with a Medicus-branded headline.
 */
export function AppleFoldableHero({
  onSelectDoctor,
  eyebrow = 'Medicus Care',
  headline,
  tagline = 'AI care that listens, in a language that feels like yours.',
}: AppleFoldableHeroProps) {
  const [replay, setReplay] = useState(0)
  const isDefaultHeadline = headline === undefined

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-8 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        {eyebrow && (
          <p className="mb-2 text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
            {eyebrow}
          </p>
        )}
        <h1
          className="duo-brand-heading"
          aria-label={isDefaultHeadline ? 'Care, built around you.' : undefined}
        >
          {headline ?? <BrandRevealHeadline />}
        </h1>
        {tagline && (
          <p className="mt-3 text-lg font-medium tracking-tight text-[#6e6e73] sm:text-xl">
            {tagline}
          </p>
        )}

        <div
          key={replay}
          role="group"
          aria-label="An open foldable phone held in two hands."
          className="duo-v-stage relative mx-auto mt-6 w-full sm:mt-8"
          style={{ aspectRatio: '664 / 370', perspective: '1500px' }}
        >
          {/* left half (left hand + phone display) */}
          <div className="duo-v-left absolute left-0 top-0 h-full w-[50.9%]">
            <Image
              src="/landing/apple-duo-left-transparent.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 51vw, 460px"
              className="object-contain"
              priority
            />
          </div>
          {/* right half (right hand + phone display) */}
          <div className="duo-v-right absolute left-[50.9%] top-0 h-full w-[49.1%]">
            <Image
              src="/landing/apple-duo-right-transparent.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 49vw, 440px"
              className="object-contain"
              priority
            />
          </div>
          <div className="duo-v-hinge" aria-hidden="true" />
          <div className="duo-v-top-frame" aria-hidden="true">
            <svg viewBox="0 0 664 370" preserveAspectRatio="none">
              <defs>
                <linearGradient id="duo-top-frame-metal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b9bdc0" />
                  <stop offset="20%" stopColor="#55595d" />
                  <stop offset="78%" stopColor="#222427" />
                  <stop offset="100%" stopColor="#909498" />
                </linearGradient>
                <linearGradient id="duo-top-frame-glass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#303235" />
                  <stop offset="100%" stopColor="#111214" />
                </linearGradient>
              </defs>
              <path
                d="M122 22 C122 8 131 1 144 2 L315 25 Q332 27 349 25 L520 2 C533 1 542 8 542 22 L541 34 C541 21 534 13 521 14 L350 38 Q332 40 314 38 L143 14 C130 13 123 21 123 34 Z"
                fill="url(#duo-top-frame-metal)"
              />
              <path
                d="M126 22 C126 12 133 5 144 6 L315 29 Q332 31 349 29 L520 6 C531 5 538 12 538 22 L537 29 C537 21 531 16 520 17 L350 35 Q332 37 314 35 L144 17 C133 16 127 21 127 29 Z"
                fill="url(#duo-top-frame-glass)"
              />
              <path
                d="M133 8 C137 4 141 3 148 4 L315 26 Q332 28 349 26 L516 4 C523 3 527 4 531 8"
                fill="none"
                stroke="rgba(255,255,255,0.72)"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div className="duo-v-device-cta">
            <span className="duo-device-cta-copy">
              <strong>Free to start · ₹0</strong>
              <small>Private Medicus AI care</small>
            </span>
            <button
              type="button"
              onClick={() => onSelectDoctor('dr_ananya')}
              className="duo-device-cta-button"
            >
              Start free
            </button>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setReplay((r) => r + 1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Replay animation
          </button>
        </div>
      </div>
    </section>
  )
}

function BrandRevealHeadline() {
  const lines = [
    [['Care,', 180], ['built', 300]],
    [['around', 420], ['you.', 540]],
  ] as const

  return (
    <>
      {lines.map((line, lineIndex) => (
        <span className="duo-brand-heading-line" key={lineIndex} aria-hidden="true">
          {line.map(([word, delay]) => (
            <span
              className={`duo-brand-word${word === 'you.' ? ' duo-brand-accent' : ''}`}
              key={word}
              style={{ animationDelay: `${delay}ms` }}
            >
              <span>{word}</span>
            </span>
          ))}
        </span>
      ))}
    </>
  )
}
