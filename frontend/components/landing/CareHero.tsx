'use client'

import { ArrowUpRight, LockKeyhole, MessageCircle, Mic, ShieldCheck } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

interface CareHeroProps {
  onSelectDoctor: (id: DoctorId) => void
}

const prompts = ['A symptom I am noticing', 'A report I want explained', 'A question about my wellbeing']

export function CareHero({ onSelectDoctor }: CareHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#f3f5ef] text-[#12231e]">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(18,35,30,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(18,35,30,.055)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cbd8ce] bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#46705f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#df704f] shadow-[0_0_0_4px_rgba(223,112,79,.14)]" />
            Medicus Care · private by design
          </div>
          <h1 className="max-w-2xl font-display text-[clamp(3rem,7vw,6.6rem)] font-medium leading-[.94] tracking-[-.055em] text-[#12231e]">
            Make sense of what you&apos;re feeling.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#52675f] sm:text-lg sm:leading-8">
            Share a symptom, a report, or a worry in your own words. Get calm, preliminary guidance and a clear next step from an AI care assistant.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectDoctor('dr_arjun')}
              className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#173b32] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,59,50,.18)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#205044]"
            >
              Start with a conversation
              <ArrowUpRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <span className="inline-flex items-center gap-2 px-2 text-xs font-medium text-[#687c73]">
              <LockKeyhole size={14} aria-hidden="true" /> No sign-up required
            </span>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#d6e0d8] pt-4 text-xs font-medium text-[#60766c]">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-[#6b8f3e]" aria-hidden="true" /> Safety-aware guidance</span>
            <span className="inline-flex items-center gap-2"><MessageCircle size={14} className="text-[#6b8f3e]" aria-hidden="true" /> Voice or text</span>
            <span>English · Hindi · Kannada</span>
          </div>
        </div>

        <div className="relative lg:pt-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#173b32] p-5 text-white shadow-[0_24px_70px_rgba(23,59,50,.22)] sm:p-7">
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/10" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a9c8b7]">Your care note</p>
                  <h2 className="mt-2 max-w-xs font-display text-3xl font-medium leading-tight tracking-[-.035em]">Where should we begin?</h2>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[#d9f0e2]">
                  <Mic size={18} aria-hidden="true" />
                </div>
              </div>

              <div className="mt-8 space-y-2">
                {prompts.map((prompt, index) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSelectDoctor(index === 2 ? 'dr_ananya' : 'dr_arjun')}
                    className="group flex min-h-14 w-full items-center justify-between rounded-2xl border border-white/12 bg-white/[.07] px-4 text-left text-sm text-[#e7f2eb] transition-colors hover:border-[#9ac7ae]/60 hover:bg-white/[.13]"
                  >
                    <span>{prompt}</span>
                    <ArrowUpRight size={16} className="text-[#9ac7ae] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="mt-8 border-t border-white/12 pt-4 text-xs leading-5 text-[#b8d0c0]">
                <span className="font-semibold text-white">A gentle starting point.</span> This is preliminary information, not a diagnosis or emergency service.
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7b8e84]">
            <span>Available now</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#df704f]" /> AI care assistant</span>
          </div>
        </div>
      </div>
    </section>
  )
}
