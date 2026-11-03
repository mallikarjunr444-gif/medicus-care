'use client'

import Image from 'next/image'
import type { DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { ArrowUpRight, Languages, Mic2, Sparkles, Stethoscope } from 'lucide-react'

interface DoctorShowcaseSectionProps {
  onSelectDoctor: (doctorId: DoctorId) => void
}

const doctorCards: Array<{
  id: DoctorId
  image: string
  imageAlt: string
  focus: string
  accent: 'green' | 'blue'
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
    accent: 'blue',
  },
]

export function DoctorShowcaseSection({ onSelectDoctor }: DoctorShowcaseSectionProps) {
  return (
    <section id="doctor-selection" aria-labelledby="doctor-selection-title" className="w-full scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#0f7565]">
              <Stethoscope size={15} aria-hidden="true" /> Choose your consultation
            </span>
            <h2 id="doctor-selection-title" className="mt-2 text-2xl font-semibold tracking-tight text-[#1c3c36] sm:text-3xl">Meet your doctor</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6c7d76]">Pick a doctor and choose a language before you begin. You can speak or type.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-[#e1e9e4] bg-white px-3.5 py-2.5 text-xs text-[#60746c] sm:flex">
            <Sparkles size={15} className="text-[#c18243]" aria-hidden="true" /> Each consultation starts when you are ready
          </div>
        </div>

        <div className="grid max-w-5xl gap-4 sm:gap-5 lg:grid-cols-2">
          {doctorCards.map((card) => {
            const doctor = DOCTORS[card.id]
            const colors = card.accent === 'green'
              ? 'bg-[#e9f4ee] text-[#216052] border-[#d8e9df]'
              : 'bg-[#edf2f8] text-[#395c7c] border-[#dfe8f1]'

            return (
              <article key={card.id} className="group overflow-hidden rounded-[1.5rem] border border-[#dfe8e2] bg-white shadow-[0_3px_14px_rgba(31,71,54,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#c3d9cc] hover:shadow-[0_16px_36px_-20px_rgba(31,71,54,.24)]">
                <div className="relative aspect-[16/9] overflow-hidden bg-[#e9eeeb] sm:aspect-[1.9/1]">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-[50%_28%] transition duration-500 group-hover:scale-[1.025]"
                    priority={card.id === 'dr_arjun'}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#122a27]/55 to-transparent" aria-hidden="true" />
                  <span className="absolute bottom-4 left-4 rounded-full border border-white/75 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#243e37] shadow-sm sm:left-5">
                    {doctor.name}
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-[#203e37]">{doctor.name}</h3>
                      <p className="mt-1 text-sm text-[#687a73]">{card.focus}</p>
                    </div>
                    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${colors}`}>
                      AI care assistant
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#6d7d77]">
                    <span className="inline-flex items-center gap-1.5"><Mic2 size={14} className="text-[#0f7565]" aria-hidden="true" /> Voice and text</span>
                    <span className="inline-flex items-center gap-1.5"><Languages size={14} className="text-[#0f7565]" aria-hidden="true" /> Kannada, English, Hindi</span>
                    <span className="inline-flex items-center gap-1.5">{doctor.gender === 'male' ? 'Male voice' : 'Female voice'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectDoctor(card.id)}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-[#0f6257] px-4 text-sm font-semibold text-white transition hover:bg-[#0b5149] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b9dacf]"
                  >
                    <span>Start with {doctor.name}</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
