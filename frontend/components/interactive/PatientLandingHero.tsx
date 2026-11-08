'use client'

import Image from 'next/image'
import { ArrowDown, ArrowUpRight, AudioLines, Languages, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { GlowEffect } from '@/components/ui/glow-effect'
import { StatusBadge } from '@/components/ui/status-badge'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { GradientText } from '@/components/ui/gradient-text'
import { ShinyText } from '@/components/ui/shiny-text'

const featuredAssistants: { id: DoctorId; image: string; alt: string; focus: string }[] = [
  {
    id: 'dr_arjun',
    image: '/doctor/dr_arjun.jpg',
    alt: 'AI care assistant Dr. Smit',
    focus: 'General health',
  },
  {
    id: 'dr_ananya',
    image: '/doctor/dr_ananya.jpg',
    alt: 'AI care assistant Dr. Ananya',
    focus: 'Wellness and reports',
  },
]

export function PatientLandingHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[#d2d2d7] bg-[#f5f5f7]">
      <AuroraBackground />

      <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[.95fr_1.05fr] lg:gap-14 lg:py-[4.5rem]">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-sm">
            <MessageCircle size={14} aria-hidden="true" />{' '}
            <ShinyText>Thoughtful care, one conversation at a time</ShinyText>
          </span>
          <h1 className="mt-5 text-[2.75rem] font-semibold leading-[1.02] tracking-[-.055em] text-[#1d1d1f] sm:text-6xl lg:text-[4.4rem]">
            Care begins when you feel <GradientText className="font-accent font-normal italic">heard.</GradientText>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#6e6e73] sm:text-lg sm:leading-8">
            Talk or type about what is on your mind. Choose an AI care assistant and continue in Kannada, English, or Hindi.
          </p>

          <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
            <a
              href="#doctor-selection"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0058b0] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0058b0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c7c7cc]"
            >
              Choose an assistant <ArrowDown size={16} aria-hidden="true" />
            </a>
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d2d2d7] bg-white/70 px-4 text-sm font-medium text-[#6e6e73]">
              <AudioLines size={16} className="text-[#0058b0]" aria-hidden="true" /> Voice or text
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#6e6e73]">
            <span className="inline-flex items-center gap-1.5"><Languages size={15} className="text-[#0058b0]" aria-hidden="true" /> Kannada · English · Hindi</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-[#0058b0]" aria-hidden="true" /> Clear about AI care</span>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#d2d2d7] bg-white/80 p-3 shadow-[0_24px_70px_-42px_rgba(26,74,60,.42)] backdrop-blur-sm sm:p-4">
          <div className="flex items-start justify-between gap-3 px-2 pb-3 pt-1 sm:px-3 sm:pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6e73]">Your first step</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#1d1d1f] sm:text-xl">Choose who to talk with</h2>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-2.5 py-1.5 text-[11px] font-medium text-[#6e6e73] min-[420px]:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" /> Start when you’re ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {featuredAssistants.map(({ id, image, alt, focus }) => {
              const assistant = DOCTORS[id]
              const glowColors =
                id === 'dr_ananya'
                  ? ['#7c3aed', '#2563eb', '#06b6d4']
                  : ['#0f766e', '#0284c7', '#10b981']

              return (
                <div key={id} className="group relative rounded-2xl">
                  <GlowEffect
                    colors={glowColors}
                    mode="rotate"
                    blur="medium"
                    duration={7}
                    className="rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => onSelectDoctor(id)}
                    className="relative isolate flex min-h-52 w-full flex-col justify-end overflow-hidden rounded-2xl bg-[#1d1d1f] text-left transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c7c7cc] sm:min-h-64"
                    aria-label={`Start an AI care conversation with ${assistant.name}`}
                  >
                    <Image
                      src={image}
                      alt={alt}
                      fill
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 40vw, 26vw"
                      className="-z-10 object-cover object-[50%_25%] transition duration-700 group-hover:scale-[1.05]"
                      priority={id === 'dr_arjun'}
                    />
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1d1d1f]/95 via-[#1d1d1f]/30 to-transparent" />
                    <div className="absolute left-3 top-3 right-3 flex items-center justify-between sm:left-4 sm:top-4 sm:right-4">
                      <span className="rounded-full border border-white/65 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#1d1d1f] shadow-sm">
                        AI Doctor
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <span className="flex items-end justify-between gap-2 p-3 text-white sm:p-4">
                      <span>
                        <span className="block text-sm font-bold tracking-tight sm:text-base">{assistant.name}</span>
                        <span className="mt-0.5 block text-[11px] text-white/90 sm:text-xs font-medium">{focus}</span>
                      </span>
                      <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30 transition-all duration-300 group-hover:bg-white group-hover:text-[#1d1d1f] group-hover:scale-110">
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                </div>
              )
            })}
          </div>

          <p className="px-2 pb-1 pt-3 text-[11px] leading-5 text-[#6e6e73] sm:px-3 sm:pt-4">
            AI health information, not a diagnosis or a substitute for emergency care.
          </p>
        </div>
      </div>
    </section>
  )
}
