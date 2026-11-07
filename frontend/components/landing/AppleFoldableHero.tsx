'use client'

import { useState } from 'react'
import Image from 'next/image'
import { HeartPulse, MessageCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'
import { BrandLogo } from '@/components/ui/BrandLogo'

/**
 * Foldable hero with a Medicus-branded care experience on both screens.
 */
export function AppleFoldableHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  const [replay, setReplay] = useState(0)

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-8 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">Medicus Duo</p>
        <h1 className="mt-1 font-sans text-[3.2rem] font-bold leading-[1.02] tracking-[-0.04em] text-[#1d1d1f] sm:text-7xl lg:text-[5.4rem]">
          Hello, hello.
        </h1>

        <div
          key={replay}
          role="img"
          aria-label="Two hands open a foldable phone to reveal the Medicus Care experience."
          className="duo-v-stage relative mx-auto mt-6 w-full sm:mt-8"
          style={{ aspectRatio: '664 / 370', perspective: '1500px' }}
        >
          {/* left half (left hand + left screen) */}
          <div className="duo-v-left absolute left-0 top-0 h-full w-[50.9%]">
            <Image
              src="/landing/duo-neuro-left.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 51vw, 460px"
              className="object-contain"
              priority
            />
            <div className="duo-v-screen duo-v-screen-left" aria-hidden="true">
              <div className="duo-screen-brand-row">
                <BrandLogo className="h-[clamp(9px,1.25vw,15px)] w-[clamp(42px,5.6vw,68px)]" />
                <span className="duo-screen-live"><span /> AI CARE</span>
              </div>
              <p className="duo-screen-eyebrow">WELLBEING, AT YOUR PACE</p>
              <h2 className="duo-screen-title">Care that starts with listening.</h2>
              <p className="duo-screen-copy">Thoughtful support in the language that feels like yours.</p>
              <div className="duo-screen-checkin">
                <span className="duo-glass-mark"><HeartPulse aria-hidden="true" /></span>
                <span><strong>Your daily check-in</strong><small>How are you feeling today?</small></span>
              </div>
            </div>
          </div>
          {/* right half (right hand + right screen) */}
          <div className="duo-v-right absolute left-[50.9%] top-0 h-full w-[49.1%]">
            <Image
              src="/landing/duo-neuro-right.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 49vw, 440px"
              className="object-contain"
              priority
            />
            <div className="duo-v-screen duo-v-screen-right" aria-hidden="true">
              <div className="duo-screen-trust"><ShieldCheck aria-hidden="true" /> PRIVATE BY DESIGN</div>
              <p className="duo-screen-eyebrow">A CLEAR NEXT STEP</p>
              <h2 className="duo-screen-title">Talk it through.</h2>
              <p className="duo-screen-copy">Start with an AI care guide that listens, without judgment.</p>
              <div className="duo-screen-visit">
                <span className="duo-screen-message"><MessageCircle aria-hidden="true" /></span>
                <span><strong>Start a conversation</strong><small>Private AI care</small></span>
                <span className="duo-screen-arrow" aria-hidden="true">→</span>
              </div>
              <div className="duo-screen-languages"><span>ENGLISH</span><span>ಕನ್ನಡ</span><span>हिंदी</span></div>
            </div>
          </div>
          <div className="duo-v-hinge" aria-hidden="true" />
        </div>

        <div className="mt-3 flex flex-col items-center gap-2.5">
          <div className="flex w-fit items-center gap-5 rounded-full border border-[#d2d2d7]/80 bg-[#f5f5f7]/90 py-2 pl-5 pr-2 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="text-left">
              <p className="text-[12px] font-semibold tracking-tight text-[#1d1d1f]">Free to start · ₹0</p>
              <p className="text-[11px] text-[#86868b]">AI care in Kannada, Hindi &amp; English</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectDoctor('dr_ananya')}
              className="rounded-full bg-[#6B8F3E] px-5 py-2 text-sm font-semibold text-white shadow-[0_3px_10px_rgba(68,104,48,0.2)] transition-all hover:bg-[#5f7d38] active:scale-95"
            >
              Start free
            </button>
          </div>

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
