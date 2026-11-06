'use client'

import Image from 'next/image'
import { ArrowRight, Mic } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

/**
 * Apple-product-style hero: light canvas, a small eyebrow, an oversized
 * headline, a centred app/device mockup and a "price + CTA" pill underneath.
 */
export function EditorialHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  return (
    <section className="relative overflow-hidden bg-[#F5F5F7] pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-sm font-semibold text-[#0F150A]">Medicus Care</p>

        <h1 className="mt-2 font-sans text-[3rem] font-bold leading-[0.98] tracking-[-0.045em] text-[#0F150A] sm:text-7xl lg:text-[5.6rem]">
          Say hello to
          <br />
          calmer care.
        </h1>

        {/* Device mockup */}
        <div className="relative mx-auto mt-10 w-[280px] sm:mt-12 sm:w-[360px]">
          <div className="relative rounded-[2.6rem] border-[9px] border-[#1b1b1d] bg-[#1b1b1d] shadow-[0_50px_100px_-30px_rgba(0,0,0,.45)]">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1b1b1d]"
            />

            <div className="relative flex aspect-[9/16] flex-col overflow-hidden rounded-[2rem] bg-[#faf9f5]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#EAF0E2] blur-2xl"
              />
              {/* status bar */}
              <div className="flex items-center justify-between px-5 pb-1 pt-6 text-[10px] font-semibold text-[#0F150A]">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-3 rounded-sm bg-[#0F150A]/80" />
                  <span className="h-2 w-4 rounded-sm border border-[#0F150A]/40" />
                </span>
              </div>

              {/* app header */}
              <div className="flex items-center gap-2 px-4 pb-3 pt-2">
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#e6e3da]">
                  <Image
                    src="/doctor/dr_ananya.jpg"
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover object-[50%_25%]"
                  />
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#0F150A]">Dr. Ananya</p>
                  <p className="flex items-center gap-1 text-[9px] text-[#5C6B62]">
                    <span className="h-1 w-1 rounded-full bg-[#6B8F3E]" /> AI care assistant
                  </p>
                </div>
                <span className="ml-auto rounded-full bg-[#EDF2E3] px-2 py-0.5 text-[9px] font-semibold text-[#4E6338]">
                  Live
                </span>
              </div>

              {/* conversation */}
              <div className="relative flex flex-1 flex-col justify-end gap-2 px-3 pb-3">
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm bg-[#0F150A] px-3 py-2 text-[11px] leading-4 text-white">
                  I&apos;ve felt anxious all week.
                </div>
                <div className="w-fit max-w-[80%] rounded-2xl rounded-tl-sm border border-[#E5E1D6] bg-white px-3 py-2 text-[11px] leading-4 text-[#3C473D]">
                  Thanks for telling me. Let&apos;s take it one step at a time.
                </div>
                <div className="flex w-fit items-center gap-1.5 rounded-full border border-[#E5E1D6] bg-white px-2.5 py-1 text-[9px] text-[#8a8a8a]">
                  <span className="h-1 w-1 rounded-full bg-[#9BC24A]" /> Dr. Ananya is listening…
                </div>
              </div>

              {/* composer */}
              <div className="flex items-center gap-2 border-t border-[#E5E1D6] bg-white px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F1F0EA] text-[#5C6B62]">
                  <Mic size={13} aria-hidden="true" />
                </span>
                <span className="flex-1 truncate text-left text-[10px] text-[#9a9a9a]">Speak or type…</span>
                <button
                  type="button"
                  onClick={() => onSelectDoctor('dr_ananya')}
                  aria-label="Start with Dr. Ananya"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F150A] text-white"
                >
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* soft ground shadow */}
          <div aria-hidden="true" className="mx-auto mt-4 h-4 w-3/4 rounded-full bg-black/10 blur-md" />
        </div>

        {/* "price + CTA" pill */}
        <div className="mx-auto mt-8 flex w-fit items-center gap-4 rounded-full border border-[#E3E1D9] bg-white py-2 pl-5 pr-2 shadow-sm sm:mt-10">
          <div className="text-left">
            <p className="text-xs font-semibold text-[#0F150A]">Free to start · No sign-up</p>
            <p className="text-[11px] text-[#6b6b6b]">Private AI care in 3 languages</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectDoctor('dr_ananya')}
            className="rounded-full bg-[#0F150A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#26301f]"
          >
            Start
          </button>
        </div>
      </div>
    </section>
  )
}
