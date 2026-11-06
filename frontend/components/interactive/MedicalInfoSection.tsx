'use client'

import {
  Activity,
  HeartPulse,
  Microscope,
  Pill,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { MedicalInfoCard } from '@/components/ui/medical-info-card'
import { Reveal } from '@/components/ui/reveal'

const items = [
  {
    icon: HeartPulse,
    tag: 'Symptom check',
    title: 'General medicine',
    body: 'Describe how you feel by voice or text and receive preliminary triage guidance in your language.',
  },
  {
    icon: Stethoscope,
    tag: 'Consultation',
    title: 'AI doctor conversation',
    body: 'One-question-at-a-time conversations with Dr. Smit and Dr. Ananya that remember what you have already said.',
  },
  {
    icon: Microscope,
    tag: 'Diagnostics',
    title: 'Report review',
    body: 'Upload lab reports and scans for a plain-language reading of the findings and what to do next.',
  },
  {
    icon: ShieldCheck,
    tag: 'Safety',
    title: 'Urgent-care routing',
    body: 'Emergency warning signs are routed to urgent-care guidance — including 112 in India — without delay.',
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
    body: 'Lifestyle and follow-up suggestions to help you track symptoms and progress over time.',
  },
]

/** Medical information cards — services, guidance and triage facts in the light MediCare register. */
export function MedicalInfoSection() {
  return (
    <section id="medical-info" className="section-y mx-auto max-w-7xl px-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f7565]">What MediCare covers</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1c3c36] sm:text-3xl">
        Care information, clearly explained
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#687b74]">
        Preliminary health information and guidance — never a diagnosis or a prescription. Use it to understand
        your symptoms and prepare for a real consultation.
      </p>
      <Reveal className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon, tag, title, body }) => (
            <MedicalInfoCard key={title} icon={icon} tag={tag} title={title} body={body} />
          ))}
        </div>
      </Reveal>
    </section>
  )
}
