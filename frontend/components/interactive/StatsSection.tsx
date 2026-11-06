'use client'

import { AnimatedCounter } from '@/components/ui/animated-counter'
import { Marquee } from '@/components/ui/marquee'

const stats = [
  { to: 2, suffix: '', label: 'AI care assistants' },
  { to: 3, suffix: '', label: 'Languages' },
  { to: 24, suffix: '/7', label: 'Always available' },
  { to: 100, suffix: '%', label: 'Private sessions' },
]

const keywords = [
  'Preliminary triage',
  'Report review',
  'Symptom tracking',
  'Multilingual care',
  'Urgent-care routing',
  'Medicine guidance',
  'Wellness checks',
  'Clear about AI',
]

/** Social-proof band: count-up stats plus a scrolling keyword marquee. */
export function StatsSection() {
  return (
    <section className="border-b border-[#e1e9e4] bg-[#f2f7f4]">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-11">
        <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold tracking-tight text-[#0f6257] sm:text-4xl">
                <AnimatedCounter to={s.to} suffix={s.suffix} />
              </span>
              <span className="text-sm font-medium leading-tight text-[#5c716b]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#e1e9e4] py-3.5">
        <Marquee
          items={keywords}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-[#789089]"
        />
      </div>
    </section>
  )
}
