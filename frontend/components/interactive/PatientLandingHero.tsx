'use client'

import Image from 'next/image'
import { ArrowDown, ArrowUpRight, AudioLines, Languages, MessageCircle, ShieldCheck } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'

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
    <section className="relative isolate overflow-hidden border-b border-[#e1e9e4] bg-[#edf5f0]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 -z-10 h-[30rem] w-[30rem] rounded-full bg-[#dcece2] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-[28%] -z-10 h-80 w-80 rounded-full bg-white/80 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[.95fr_1.05fr] lg:gap-14 lg:py-[4.5rem]">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d5e4da] bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#326357] shadow-sm">
            <MessageCircle size={14} aria-hidden="true" /> Thoughtful care, one conversation at a time
          </span>
          <h1 className="mt-5 text-[2.75rem] font-semibold leading-[1.02] tracking-[-.055em] text-[#173a35] sm:text-6xl lg:text-[4.4rem]">
            Care begins when you feel <span className="font-accent font-normal italic text-[#0f7565]">heard.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#536a63] sm:text-lg sm:leading-8">
            Talk or type about what is on your mind. Choose an AI care assistant and continue in Kannada, English, or Hindi.
          </p>

          <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
            <a
              href="#doctor-selection"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f6257] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b5149] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#acd5c9]"
            >
              Choose an assistant <ArrowDown size={16} aria-hidden="true" />
            </a>
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d6e3da] bg-white/70 px-4 text-sm font-medium text-[#49655d]">
              <AudioLines size={16} className="text-[#0f7565]" aria-hidden="true" /> Voice or text
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#5c716b]">
            <span className="inline-flex items-center gap-1.5"><Languages size={15} className="text-[#0f7565]" aria-hidden="true" /> Kannada · English · Hindi</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-[#0f7565]" aria-hidden="true" /> Clear about AI care</span>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#d9e5dc] bg-white/80 p-3 shadow-[0_24px_70px_-42px_rgba(26,74,60,.42)] backdrop-blur-sm sm:p-4">
          <div className="flex items-start justify-between gap-3 px-2 pb-3 pt-1 sm:px-3 sm:pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#788981]">Your first step</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#203e37] sm:text-xl">Choose who to talk with</h2>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-[#e2ebe4] bg-[#f7faf8] px-2.5 py-1.5 text-[11px] font-medium text-[#667970] min-[420px]:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4f9b78]" /> Start when you’re ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {featuredAssistants.map(({ id, image, alt, focus }) => {
              const assistant = DOCTORS[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectDoctor(id)}
                  className="group relative isolate flex min-h-52 flex-col justify-end overflow-hidden rounded-2xl bg-[#24453d] text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#acd5c9] sm:min-h-64"
                  aria-label={`Start an AI care conversation with ${assistant.name}`}
                >
                  <Image
                    src={image}
                    alt={alt}
                    fill
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 40vw, 26vw"
                    className="-z-10 object-cover object-[50%_25%] transition duration-500 group-hover:scale-[1.04]"
                    priority={id === 'dr_arjun'}
                  />
                  <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#102e29]/95 via-[#102e29]/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/65 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#2e5147] shadow-sm sm:left-4 sm:top-4">
                    AI assistant
                  </span>
                  <span className="flex items-end justify-between gap-2 p-3 text-white sm:p-4">
                    <span>
                      <span className="block text-sm font-semibold sm:text-base">{assistant.name}</span>
                      <span className="mt-0.5 block text-[11px] text-white/80 sm:text-xs">{focus}</span>
                    </span>
                    <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 transition group-hover:bg-white group-hover:text-[#164d43]">
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <p className="px-2 pb-1 pt-3 text-[11px] leading-5 text-[#71817b] sm:px-3 sm:pt-4">
            AI health information, not a diagnosis or a substitute for emergency care.
          </p>
        </div>
      </div>
    </section>
  )
}
