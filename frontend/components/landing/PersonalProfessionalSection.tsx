'use client'

import { ArrowUpRight, Briefcase, HeartHandshake, ShieldCheck } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

interface PersonalProfessionalSectionProps {
  onSelectDoctor: (id: DoctorId) => void
}

const capabilities = [
  ['Understand the signal', 'Turn symptoms, reports, and questions into a clearer starting point.'],
  ['Keep the thread', 'Return to your summaries and notes when you are ready to continue.'],
  ['Move at your pace', 'Use voice or text, in English, Hindi, or Kannada.'],
]

export function PersonalProfessionalSection({ onSelectDoctor }: Readonly<PersonalProfessionalSectionProps>) {
  return (
    <section id="personal-professional" className="border-y border-[#d2d2d7] bg-[#f5f5f7]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">One place for care</p>
            <h2 className="mt-3 max-w-lg font-display text-4xl font-medium leading-[.94] tracking-[-.05em] text-[#1d1d1f] sm:text-6xl">
              Designed for you.<br />Built to evolve with you.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[#6e6e73] sm:text-lg sm:leading-8">
            Whether you are trying to understand what is changing or helping someone else make sense of it, Medicare keeps the next step clear, human, and within reach.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <article className="group relative overflow-hidden rounded-[1.75rem] bg-[#1d1d1f] p-6 text-white shadow-[0_20px_50px_-25px_rgba(23,59,50,.6)] sm:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10 transition-transform duration-500 group-hover:scale-110" />
            <HeartHandshake size={24} className="text-[#cfe3fb]" aria-hidden="true" />
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-[#2997ff]">For you</p>
            <h3 className="mt-2 font-display text-3xl font-medium tracking-[-.035em] sm:text-4xl">A clearer first step.</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">Talk through what you are noticing, review a report, or begin a private wellbeing check-in.</p>
            <button type="button" onClick={() => onSelectDoctor('dr_arjun')} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#1d1d1f] transition hover:bg-[#eaf2fd]">
              Start your conversation <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </article>

          <article className="group relative overflow-hidden rounded-[1.75rem] border border-[#d2d2d7] bg-white p-6 text-[#1d1d1f] shadow-[0_16px_40px_-25px_rgba(23,59,50,.35)] sm:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-[#d2d2d7] transition-transform duration-500 group-hover:scale-110" />
            <Briefcase size={24} className="text-[#0071e3]" aria-hidden="true" />
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-[#0071e3]">For professionals</p>
            <h3 className="mt-2 font-display text-3xl font-medium tracking-[-.035em] sm:text-4xl">A better care conversation.</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#6e6e73]">Give patients a structured way to share context before an appointment or follow-up.</p>
            <a href="#doctor-selection" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d2d2d7] px-4 text-sm font-semibold text-[#1d1d1f] transition hover:border-[#0071e3] hover:bg-[#f5f5f7]">
              Explore care support <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </article>
        </div>

        <div className="mt-10 grid gap-5 border-t border-[#d2d2d7] pt-6 sm:grid-cols-3">
          {capabilities.map(([title, description]) => (
            <div key={title} className="flex gap-3">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0071e3]" aria-hidden="true" />
              <div><p className="text-sm font-semibold text-[#1d1d1f]">{title}</p><p className="mt-1 text-xs leading-5 text-[#6e6e73]">{description}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
