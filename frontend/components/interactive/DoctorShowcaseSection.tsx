'use client'

import Image from 'next/image'
import type { DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { ArrowUpRight, Languages, Mic2, Stethoscope } from 'lucide-react'

interface DoctorShowcaseSectionProps {
  onSelectDoctor: (doctorId: DoctorId) => void
}

const doctorCards: Array<{
  id: DoctorId
  image: string
  imageAlt: string
  focus: string
  accent: 'teal' | 'blue'
}> = [
  {
    id: 'dr_arjun',
    image: '/doctor/dr_arjun.jpg',
    imageAlt: 'Dr. Arjun in his white coat with a stethoscope',
    focus: 'General health guidance',
    accent: 'teal',
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
    <section id="doctor-selection" aria-labelledby="doctor-selection-title" className="relative w-full px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300">
            <Stethoscope size={14} className="text-teal-300" />
            Choose your consultation
          </div>
          <h2 id="doctor-selection-title" className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Meet your doctor
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-400">
            Pick a doctor, choose your language, then talk by voice or text.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {doctorCards.map((card) => {
            const doctor = DOCTORS[card.id]
            const color = card.accent === 'teal'
              ? 'text-teal-800 bg-teal-50 border-teal-100'
              : 'text-blue-800 bg-blue-50 border-blue-100'

            return (
              <article key={card.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-shadow duration-200 hover:shadow-lg">
                <div className="relative aspect-[16/9] bg-slate-100">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-[50%_28%]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  <span className="absolute bottom-4 left-5 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm">
                    {doctor.name}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">{doctor.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{card.focus}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${color}`}>
                      Consultation
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><Mic2 size={14} /> Voice and text</span>
                    <span className="inline-flex items-center gap-1.5"><Languages size={14} /> Kannada, English and more</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectDoctor(card.id)}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-[#123d55] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0d3145] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
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
