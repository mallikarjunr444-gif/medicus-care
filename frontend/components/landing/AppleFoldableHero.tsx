'use client'

import Image from 'next/image'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { DoctorId } from '@/lib/doctorTypes'

/**
 * Apple iPhone Duo-style hero.
 *
 * Matches the reference starting animation: two hands hold the fully open
 * foldable, and the screen content starts blurred + darkened, then sharpens
 * into the calm landscape. The hands and bezel stay sharp throughout.
 */
export function AppleFoldableHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  const [replay, setReplay] = useState(0)

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-8 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">MediCare Duo</p>
        <h1 className="mt-1 font-sans text-[3.2rem] font-bold leading-[1.02] tracking-[-0.04em] text-[#1d1d1f] sm:text-7xl lg:text-[5.4rem]">
          Hello, hello.
        </h1>

        <div key={replay} className="relative mx-auto mt-4 w-full sm:mt-5">
          <Image
            src="/landing/duo-base.png"
            alt="Two hands holding the MediCare foldable"
            width={664}
            height={300}
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="h-auto w-full"
          />

          {/* Live screen overlay, aligned to the device display */}
          <div
            className="screen-reveal absolute overflow-hidden"
            style={{
              left: '22.59%',
              top: '0.67%',
              width: '56.48%',
              height: '93.67%',
              borderRadius: '6%',
            }}
          >
            <Image
              src="/landing/calm-lake.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 56vw, 520px"
              className="object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#07130c]/85 via-[#07130c]/15 to-transparent"
            />
            <div className="absolute inset-x-[6%] bottom-[8%] text-left">
              <h2 className="font-sans text-[clamp(10px,1.6vw,18px)] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.4)]">
                Tune out the noise,
                <br />
                tune into yourself.
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/70 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white">
                  Products
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#2f4a2a]">
                  Get started
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center gap-2.5 sm:mt-3">
          <div className="flex w-fit items-center gap-5 rounded-full border border-[#d2d2d7]/80 bg-[#f5f5f7]/90 py-2 pl-5 pr-2 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="text-left">
              <p className="text-[12px] font-semibold tracking-tight text-[#1d1d1f]">Free to start · ₹0</p>
              <p className="text-[11px] text-[#86868b]">AI care in Kannada, Hindi &amp; English</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectDoctor('dr_ananya')}
              className="rounded-full bg-[#0071e3] px-5 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-[#0077ed] active:scale-95"
            >
              Start
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
