'use client'

import { Reveal } from '@/components/ui/reveal'

const OLIVE = '#6B8F3E'

const steps = [
  {
    n: '1',
    title: 'Take the assessment',
    body: 'Answer a short, evidence-based set of questions about how you have been feeling.',
  },
  {
    n: '2',
    title: 'Get instant insights',
    body: 'Receive a preliminary summary of your symptoms, mood and energy levels.',
  },
  {
    n: '3',
    title: 'Explore next steps',
    body: 'Access guidance, reports and referral options at your own pace.',
  },
]

/** "Discover how we empower you" — STEP 1/2/3 cards with dotted connectors. */
export function StepsSection() {
  return (
    <section id="how-it-works" className="section-y mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: OLIVE }}>
          How it works
        </p>
        <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-[#0F150A] sm:text-4xl">
          Discover how we empower you to feel understood
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#5C6B62]">
          Your mental and physical health matter. A short, private check-in helps you reflect and decide what
          comes next.
        </p>
      </div>

      <Reveal className="mt-9">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.n}
              className="relative rounded-2xl border border-[#DDE5D4] bg-white p-6 shadow-[0_4px_18px_rgba(15,21,10,.04)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: OLIVE }}
                  aria-hidden="true"
                >
                  {step.n}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: OLIVE }}>
                  Step {step.n}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="ml-2 hidden h-px flex-1 border-t border-dashed border-[#C9D2BD] sm:block"
                  />
                ) : null}
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#0F150A]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[#5C6B62]">{step.body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
