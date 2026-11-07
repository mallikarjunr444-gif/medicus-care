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
              <path
                d="M123 21 C123 11 132 5 144 6 L315 28 Q332 30 349 28 L520 6 C532 5 541 11 541 21 L540 29 C540 20 533 14 521 15 L350 35 Q332 37 314 35 L143 15 C131 14 124 20 124 29 Z"
                fill="#25282a"
              />
              <path
                d="M130 18 C133 12 138 9 145 10 L315 31 Q332 33 349 31 L519 10 C526 9 531 12 534 18"
                fill="none"
                stroke="#b8bdc0"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <path
                d="M132 22 C135 18 139 16 145 17 L315 37 Q332 39 349 37 L519 17 C525 16 529 18 532 22"
                fill="none"
                stroke="#111315"
                strokeLinecap="round"
                strokeWidth="3"
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
