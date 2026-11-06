'use client'

import Image from 'next/image'
import { ArrowRight, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

const OLIVE = '#6B8F3E'
const LIME = '#9BC24A'

/**
 * Editorial hero in the "Neuro Pulse" mood: warm cream canvas, sage blobs,
 * oversized display type, pill CTAs and a framed portrait card.
 */
export function EditorialHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#F6F5EF]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 h-[34rem] w-[34rem] rounded-full bg-[#E5ECE8] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 left-[16%] h-[26rem] w-[26rem] rounded-full bg-[#EAF0E2] blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#DCE4D0] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#4E6338]">
            <Sparkles size={14} aria-hidden="true" /> Calm, private health check-ins
          </span>

          <h1 className="mt-5 font-display text-[2.7rem] font-medium leading-[1.03] tracking-[-0.03em] text-[#0F150A] sm:text-6xl lg:text-[4.4rem]">
            Care begins when you feel <span style={{ color: OLIVE }}>heard.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-[#5C6B62] sm:text-lg">
            Talk or type about what is on your mind. Choose an AI care assistant and continue in Kannada, English
            or Hindi — at your own pace.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#doctor-selection"
              className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#0F150A] pl-6 pr-2 text-sm font-semibold text-white transition hover:bg-[#26301f]"
            >
              Start a consultation
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#0F150A] transition group-hover:translate-x-0.5"
                style={{ backgroundColor: LIME }}
              >
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#C9D2BD] bg-white/60 px-5 text-sm font-medium text-[#3C473D] transition hover:bg-white"
            >
              How it works
            </a>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs font-medium text-[#68766E]">
            <ShieldCheck size={15} style={{ color: OLIVE }} aria-hidden="true" />
            AI-assisted information, not a diagnosis
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] border border-[#DDE5D4] bg-[#E9EFE3] shadow-[0_30px_70px_-30px_rgba(15,21,10,.35)]">
            <div className="relative aspect-[4/4.4]">
              <Image
                src="/doctor/dr_ananya.jpg"
                alt="Dr. Ananya, an AI care assistant"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 42vw"
                className="object-cover object-[50%_22%]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0F150A]/55 via-transparent to-transparent"
              />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2 rounded-2xl border border-white/25 bg-white/10 p-3 backdrop-blur-md">
                <div>
                  <p className="text-sm font-semibold text-white">Dr. Ananya</p>
                  <p className="text-[11px] text-white/80">Wellness &amp; reports</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#3C473D]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: OLIVE }} /> Available
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectDoctor('dr_ananya')}
            className="absolute -left-3 top-6 hidden items-center gap-2 rounded-2xl border border-[#DDE5D4] bg-white/95 px-3.5 py-2.5 text-left shadow-lg transition hover:-translate-y-0.5 sm:flex"
          >
            <Stethoscope size={16} style={{ color: OLIVE }} aria-hidden="true" />
            <span>
              <span className="block text-[11px] font-semibold text-[#0F150A]">Talk to Dr. Ananya</span>
              <span className="block text-[10px] text-[#68766E]">AI-assisted · available now</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
