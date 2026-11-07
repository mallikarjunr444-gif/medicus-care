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
    <section className="relative overflow-hidden bg-white text-[#11140d]">
      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="flex items-center justify-between border-b border-[#dfe5dc] pb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b786f]">
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#df704f]" /> Medicus Care</span>
          <span className="hidden sm:inline">Voice · Text · Guidance</span>
        </div>
        <div className="grid gap-10 pt-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-20 lg:pt-20">
          <div>
            <p className="mb-5 text-sm font-medium text-[#6b786f]">A calmer way to start a health conversation.</p>
            <h1 className="max-w-5xl font-display text-[clamp(3.2rem,8vw,8.5rem)] font-medium leading-[.88] tracking-[-.065em] text-[#11140d]">
              See clearly.<br />Feel supported.<br /><span className="text-[#6b8f3e]">Move forward.</span>
            </h1>
          </div>
          <div className="flex max-w-md flex-col justify-end lg:pb-2">
            <p className="text-base leading-7 text-[#56635b] sm:text-lg sm:leading-8">
              Share a symptom, a report, or a worry in your own words. Get preliminary guidance and a clear next step from an AI care assistant.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectDoctor('dr_arjun')}
                className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#11140d] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#31553b]"
              >
                Start a conversation
                <ArrowUpRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <span className="inline-flex items-center gap-2 px-1 text-xs font-medium text-[#68756c]"><LockKeyhole size={14} aria-hidden="true" /> No sign-up required</span>
            </div>
          </div>
        </div>
        <div className="relative mt-14 overflow-hidden bg-[#101611] shadow-[0_24px_70px_rgba(17,20,13,.14)] sm:mt-20">
          <video
            className="aspect-video w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="A calm visual introduction to Medicus Care"
          >
            <source src="/landing/care-hero.mp4" type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101611]/35 via-transparent to-white/5" />
          <div className="pointer-events-none absolute bottom-4 left-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 sm:bottom-6 sm:left-6">
            Care that starts with listening
          </div>
        </div>
        <div className="mt-14 grid border-y border-[#dfe5dc] sm:grid-cols-3">
          {features.map(([title, description], index) => (
            <div key={title} className={`py-5 sm:px-5 ${index > 0 ? 'border-t border-[#dfe5dc] sm:border-l sm:border-t-0' : ''}`}>
              <p className="text-sm font-semibold text-[#11140d]">{title}</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-[#6b786f]">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#68756c]">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-[#6b8f3e]" aria-hidden="true" /> Safety-aware guidance</span>
          <span className="inline-flex items-center gap-2"><MessageCircle size={14} className="text-[#6b8f3e]" aria-hidden="true" /> English · Hindi · Kannada</span>
        </div>
      </div>
    </section>
  )
}
