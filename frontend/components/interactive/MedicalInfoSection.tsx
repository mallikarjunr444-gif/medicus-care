'use client'

import {
  Activity,
  Languages,
  Microscope,
  Pill,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { MedicalInfoCard } from '@/components/ui/medical-info-card'
import { Reveal } from '@/components/ui/reveal'

const items = [
  {
    icon: Languages,
    tag: 'Multilingual',
    title: 'Kannada, English, Hindi',
    body: 'Continue the same conversation in the language you think in — switch any time.',
  },
  {
    icon: Microscope,
    tag: 'Diagnostics',
    title: 'Report review',
    body: 'Upload lab reports and scans for a plain-language reading of the findings.',
  },
  {
    icon: ShieldCheck,
    tag: 'Safety',
    title: 'Urgent-care routing',
    body: 'Emergency warning signs route straight to urgent care — including 112 in India.',
  },
  {
    icon: Pill,
    tag: 'Medication',
    title: 'Medicine guidance',
    body: 'Preliminary information about common medicines and the questions to ask your pharmacist.',
  },
  {
    icon: Activity,
    tag: 'Prevention',
    title: 'Symptom tracking',
    body: 'Lifestyle and follow-up suggestions to track symptoms and progress over time.',
  },
]

/** Bento "capabilities" band with a featured conversation tile. Light MediCare register. */
export function MedicalInfoSection() {
  return (
    <section id="medical-info" className="section-y mx-auto max-w-7xl px-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B8F3E]">Why MediCare</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1c3c36] sm:text-3xl">
        Care that feels like a conversation
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#687b74]">
        Preliminary health information and gentle guidance — never a diagnosis or a prescription.
      </p>

      <Reveal className="mt-8">
        <BentoGrid>
          {/* Featured tile — spans 2×2 on desktop */}
          <BentoCard featured className="p-5 sm:col-span-2 sm:p-6 lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#cfe3da] bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B8F3E]">
                <Sparkles size={12} aria-hidden="true" /> Conversation-first
              </span>

              <h3 className="mt-4 text-xl font-semibold tracking-tight text-[#1c3c36] sm:text-2xl">
                A conversation, not a form
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#687b74]">
                Speak or type naturally. Dr. Smit and Dr. Ananya ask one question at a time and remember what you
                have already said.
              </p>

              {/* Mini conversation preview */}
              <div className="mt-auto pt-6" aria-hidden="true">
                <div className="space-y-2">
                  <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm border border-[#e1e9e4] bg-white px-3 py-2 text-xs leading-5 text-[#36564d] shadow-sm">
                    I&apos;ve had this headache for three days and feel a bit dizzy.
                  </div>
                  <div className="ml-auto w-fit max-w-[82%] rounded-2xl rounded-tr-sm bg-[#6B8F3E] px-3 py-2 text-xs leading-5 text-white shadow-sm">
                    Thanks for telling me. Where does it hurt the most?
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e9e4] bg-white px-2.5 py-1 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6B8F3E]" />
                    <span className="text-[10px] font-medium text-[#7d9089]">Dr. Smit is listening…</span>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          {items.map(({ icon, tag, title, body }) => (
            <MedicalInfoCard key={title} icon={icon} tag={tag} title={title} body={body} />
          ))}
        </BentoGrid>
      </Reveal>
    </section>
  )
}
