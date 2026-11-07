'use client'

import { ArrowUpRight, LockKeyhole, MessageCircle, ShieldCheck } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

interface CareHeroProps {
  onSelectDoctor: (id: DoctorId) => void
}

const features = [
  ['Voice-first care', 'Say what is happening naturally, in your own words.'],
  ['Clear next steps', 'Receive preliminary guidance without the clinical fog.'],
  ['Private by design', 'Your conversation stays focused on your care.'],
]

export function CareHero({ onSelectDoctor }: Readonly<CareHeroProps>) {
  return (
    <section className="relative isolate min-h-[calc(100svh-4.25rem)] overflow-hidden bg-[#1a1711] text-white lg:min-h-[calc(100svh-4.5rem)]">
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="A calm visual introduction to MediCare"
      >
        <source src="/landing/care-hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,13,10,.72)_0%,rgba(13,13,10,.26)_55%,rgba(13,13,10,.34)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d0d0a]/65 via-transparent to-[#0d0d0a]/10" />
      <div className="relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-7xl flex-col justify-between px-4 pb-8 pt-28 sm:px-6 sm:pb-10 lg:min-h-[calc(100svh-4.5rem)] lg:pt-32">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">A calmer way to start a health conversation</p>
          <h1 className="max-w-4xl font-display text-[clamp(3.2rem,8vw,7.8rem)] font-medium leading-[.88] tracking-[-.065em] text-white">
            See clearly.<br />Feel supported.<br /><span className="text-[#dcebbf]">Move forward.</span>
          </h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid max-w-2xl gap-5 border-t border-white/30 pt-4 sm:grid-cols-3">
            {features.map(([title, description]) => (
              <div key={title}>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-white/70">{description}</p>
              </div>
            ))}
          </div>
          <div className="max-w-sm lg:pb-1">
            <p className="text-sm leading-6 text-white/80 sm:text-base">
              Share a symptom, a report, or a worry in your own words. Get preliminary guidance and a clear next step from an AI care assistant.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectDoctor('dr_arjun')}
                className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-5 text-sm font-semibold text-[#11140d] transition-colors hover:bg-[#dcebbf]"
              >
                Start a conversation
                <ArrowUpRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-white/75"><LockKeyhole size={14} aria-hidden="true" /> No sign-up required</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-xs font-medium text-white/75">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-[#dcebbf]" aria-hidden="true" /> Safety-aware guidance</span>
          <span className="hidden items-center gap-2 sm:inline-flex"><MessageCircle size={14} className="text-[#dcebbf]" aria-hidden="true" /> English · Hindi · Kannada</span>
        </div>
      </div>
    </section>
  )
}
