'use client'

import Image from 'next/image'
import { ArrowRight, Mic2 } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

/**
 * "InMind"-style editorial hero: warm peach canvas, an oversized serif
 * watermark, and a cinematic portrait screen with a light serif headline,
 * a centred availability pill and a compact CTA.
 */
export function EditorialHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#F3D7BE] pb-12 pt-6 sm:pb-16 sm:pt-8">
      {/* Oversized watermark wordmark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-8 select-none text-center leading-none sm:-top-12"
      >
        <span className="font-accent text-[27vw] italic tracking-[-0.04em] text-[#E9C3A3] sm:text-[22vw]">
          Medicus
        </span>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-[#E3BD9C] bg-[#150d08] shadow-[0_40px_90px_-30px_rgba(60,35,15,.6)]">
          <div className="relative aspect-[4/5] sm:aspect-[16/9]">
            <Image
              src="/doctor/dr_ananya.jpg"
              alt="A calm portrait of an AI care assistant"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover object-[50%_28%]"
            />

            {/* Cinematic warm + green wash */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#1a0f08]/92 via-[#1a0f08]/35 to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#3a1f12]/30 via-transparent to-[#2f4a2a]/35"
            />

            {/* Centred availability pill */}
            <div className="absolute inset-x-0 top-4 flex justify-center px-4 sm:top-5">
              <button
                type="button"
                onClick={() => onSelectDoctor('dr_ananya')}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md transition hover:bg-white/25"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#9BC24A]" aria-hidden="true" />
                Talk to Dr. Ananya — available now
              </button>
            </div>

            {/* Headline + CTA */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <h1 className="max-w-2xl font-accent text-[2.6rem] leading-[1.02] tracking-[-0.02em] text-[#FBF1E4] sm:text-6xl lg:text-[4.3rem]">
                You deserve
                <br />
                to feel truly
                <br />
                <span className="italic">understood.</span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-[#F3E4D3]/85 sm:text-base">
                A calm, private space to talk about how you feel — and find clear, gentle next steps.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="#doctor-selection"
                  className="inline-flex items-center gap-2 rounded-full bg-[#FBF1E4] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#1a0f08] transition hover:bg-white"
                >
                  Start a consultation <ArrowRight size={14} aria-hidden="true" />
                </a>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                  <Mic2 size={13} aria-hidden="true" /> Voice or text · 3 languages
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-5 text-[#8a6a4f]">
          AI-assisted health information — never a diagnosis or a substitute for emergency care.
        </p>
      </div>
    </section>
  )
}
