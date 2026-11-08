'use client'

import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'

const OLIVE = '#6B8F3E'

const cards: { label: string; desc: string; image?: string; icon?: LucideIcon }[] = [
  {
    label: 'Research-based',
    desc: 'Grounded in established triage and safety guidance.',
    image: '/doctor/dr_arjun.jpg',
  },
  {
    label: 'Confidential & secure',
    desc: 'Your session stays private to you.',
    image: '/doctor/dr_ananya.jpg',
  },
  {
    label: 'Instant feedback',
    desc: 'Preliminary guidance as you talk.',
    icon: ShieldCheck,
  },
]

/** "Why people rely on MediCare" — three image cards in the Neuro Pulse style. */
export function WhyRelySection() {
  return (
    <section className="bg-[#eaf2fd] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-xl font-display text-2xl font-medium leading-tight tracking-tight text-[#1d1d1f] sm:text-4xl">
            Why people rely on MediCare for their well-being
          </h2>
          <p className="max-w-sm text-sm leading-6 text-[#6e6e73]">
            A calm, private place to understand how you feel — with clear next steps.
          </p>
        </div>

        <Reveal className="mt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <figure key={card.label} className="group relative overflow-hidden rounded-2xl">
                <div className="relative aspect-[4/5]">
                  {card.image ? (
                    <Image
                      src={card.image}
                      alt={card.label}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover object-[50%_28%] transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'linear-gradient(160deg, #6B8F3E 0%, #3C473D 100%)' }}
                    >
                      {card.icon ? <card.icon size={54} className="text-white/80" aria-hidden="true" /> : null}
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#1d1d1f]/80 via-[#1d1d1f]/10 to-transparent"
                  />
                  <figcaption className="absolute inset-x-4 bottom-4 text-white">
                    <p className="text-sm font-semibold">{card.label}</p>
                    <p className="mt-1 text-xs leading-5 text-white/75">{card.desc}</p>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#1d1d1f]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: OLIVE }} />
          Built to feel calm, simple and supportive
        </div>
      </div>
    </section>
  )
}
