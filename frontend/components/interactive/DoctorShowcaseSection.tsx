'use client'

import Image from 'next/image'
import type { DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { ArrowUpRight, Languages, Mic2, Sparkles, Stethoscope } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'
import { GlowEffect } from '@/components/ui/glow-effect'
import { StatusBadge } from '@/components/ui/status-badge'

interface DoctorShowcaseSectionProps {
  onSelectDoctor: (doctorId: DoctorId) => void
}

const doctorCards: Array<{
  id: DoctorId
  image: string
  imageAlt: string
  focus: string
  accent: 'green' | 'sand'
}> = [
  {
    id: 'dr_arjun',
    image: '/doctor/dr_arjun.jpg',
    imageAlt: 'Dr. Smit in his white coat with a stethoscope',
    focus: 'General health and symptom guidance',
    accent: 'green',
  },
  {
    id: 'dr_ananya',
    image: '/doctor/dr_ananya.jpg',
    imageAlt: 'Dr. Ananya in her white coat with a blue stethoscope',
    focus: 'Wellness and report support',
    accent: 'sand',
  },
]

export function DoctorShowcaseSection({ onSelectDoctor }: DoctorShowcaseSectionProps) {
  return (
    <section id="doctor-selection" aria-labelledby="doctor-selection-title" className="w-full scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#0071e3]">
              <Stethoscope size={15} aria-hidden="true" /> Choose your consultation
            </span>
            <h2 id="doctor-selection-title" className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f] sm:text-3xl">Choose an AI care assistant</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e6e73]">Choose a voice and language before you begin. You can speak or type at your own pace.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-xs text-[#6e6e73] sm:flex">
            <Sparkles size={15} className="text-[#c18243]" aria-hidden="true" /> Each consultation starts when you are ready
          </div>
        </div>

        <Reveal className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {doctorCards.map((card) => {
              const doctor = DOCTORS[card.id]
              const glowColors =
                card.id === 'dr_ananya'
                  ? ['#7c3aed', '#2563eb', '#06b6d4']
                  : ['#0f766e', '#0284c7', '#10b981']

              return (
                <div key={card.id} className="group relative rounded-[1.75rem]">
                  <GlowEffect
                    colors={glowColors}
                    mode="rotate"
                    blur="strong"
                    duration={8}
                    className="rounded-[1.75rem] transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  />
                  <article className="relative overflow-hidden rounded-[1.5rem] border border-[#d2d2d7] bg-white shadow-[0_3px_14px_rgba(31,71,54,.045)] transition duration-300 hover:-translate-y-1 hover:border-[#c7c7cc] hover:shadow-[0_20px_40px_-20px_rgba(31,71,54,.3)]">
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#eaf2fd] sm:aspect-[1.9/1]">
                      <Image
                        src={card.image}
                        alt={card.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover object-[50%_28%] transition duration-700 group-hover:scale-[1.03]"
                        priority={card.id === 'dr_arjun'}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#1d1d1f]/75 via-[#1d1d1f]/30 to-transparent" aria-hidden="true" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between sm:left-5 sm:right-5">
                        <span className="rounded-full border border-white/75 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-sm">
                          {doctor.name}
                        </span>
                        <StatusBadge
                          status="live"
                          label="Available Now"
                          sublabel="Photorealistic AI"
                          className="!bg-black/60 !border-white/20 !text-white text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                        <div>
                          <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">{doctor.name}</h3>
                          <p className="mt-1 text-sm text-[#6e6e73] font-medium">{card.focus}</p>
                        </div>
                        <span className="inline-flex w-fit items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                          {doctor.specialty}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#6e6e73]">
                        <span className="inline-flex items-center gap-1.5"><Mic2 size={14} className="text-[#0071e3]" aria-hidden="true" /> Real-time voice &amp; text</span>
                        <span className="inline-flex items-center gap-1.5"><Languages size={14} className="text-[#0071e3]" aria-hidden="true" /> Kannada, English, Hindi</span>
                        <span className="inline-flex items-center gap-1.5 font-medium">{doctor.gender === 'male' ? 'Natural male voice' : 'Natural female voice'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectDoctor(card.id)}
                        className="mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-[#0071e3] px-5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#0071e3] hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c7c7cc]"
                      >
                        <span>Start consultation with {doctor.name}</span>
                        <ArrowUpRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    </div>
                  </article>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
