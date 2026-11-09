'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Activity, FileText, Pill, ShieldAlert } from 'lucide-react'
import { MotionButton } from '@/components/ui/motion-button'
import { TextWordCarousel } from '@/components/ui/text-word-carousel'
import { TiltSpotlightCard } from '@/components/ui/tilt-spotlight-card'
import { Reveal } from '@/components/ui/reveal'
import { WordReveal } from '@/components/ui/word-reveal'
import { DOCTORS } from '@/lib/doctorTypes'
import type { DoctorId } from '@/lib/doctorTypes'

/* ───────────────────────── shared pieces ───────────────────────── */

const H2 = 'text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1d1d1f] sm:text-[48px] lg:text-[56px]'
const LEAD = 'text-[19px] leading-[1.4] text-[#6e6e73] sm:text-[21px]'

function PillButton({ children, onClick, large = false }: { children: React.ReactNode; onClick: () => void; large?: boolean }) {
  return (
    <MotionButton onClick={onClick} large={large}>
      {children}
    </MotionButton>
  )
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded text-[19px] text-[#0071e3] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
    >
      {children} <span aria-hidden="true">›</span>
    </a>
  )
}

/* ───────────────────────── hero ───────────────────────── */

// The same greeting, as the doctor would say it in each language.
const GREETINGS = [
  { lang: 'ಕನ್ನಡ', text: 'ನಮಸ್ಕಾರ, ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' },
  { lang: 'हिन्दी', text: 'नमस्ते, आज मैं आपकी कैसे मदद कर सकती हूँ?' },
  { lang: 'English', text: 'Hello, how can I help you today?' },
]

export function Hero({ onStart }: { onStart: () => void }) {
  const [index, setIndex] = useState(0)

  // The one moving thing on the page: the example reply changes language every few seconds.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % GREETINGS.length), 4500)
    return () => window.clearInterval(timer)
  }, [])

  const greeting = GREETINGS[index]
  const reduce = useReducedMotion()
  const figureRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: figureRef, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-6%', '6%'])
  const figureScale = useTransform(scrollYProgress, [0, 0.35], reduce ? [1, 1] : [0.94, 1])

  return (
    <section id="overview" className="relative scroll-mt-24 overflow-hidden bg-white pt-14 text-center sm:pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[560px]">
        <motion.div className="absolute -left-24 top-0 h-[380px] w-[380px] rounded-full bg-[#0071e3]/20 blur-[100px]" animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute right-0 top-10 h-[340px] w-[340px] rounded-full bg-[#bf5af2]/20 blur-[100px]" animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 40, 0] }} transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute left-1/3 top-24 h-[300px] w-[300px] rounded-full bg-[#30d5c8]/20 blur-[100px]" animate={reduce ? undefined : { x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
      <div className="relative mx-auto max-w-[980px] px-5">
        <h1 className="text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] text-[#1d1d1f] sm:text-[72px] lg:text-[88px]">
          Talk to a doctor.
          <br />
          <span className="sr-only">In your language.</span>
          <span aria-hidden="true">
            In{' '}
            <TextWordCarousel
              words={['your language.', 'ಕನ್ನಡ.', 'हिन्दी.', 'English.']}
              interval={2600}
              className="bg-gradient-to-r from-[#0071e3] via-[#7a5cff] to-[#30b8d5] bg-clip-text pb-[0.12em] text-transparent"
            />
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-[640px] text-[19px] leading-[1.3] text-[#6e6e73] sm:text-[24px]">
          Share a symptom or a report and get clear, preliminary guidance in Kannada, Hindi or English.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <PillButton onClick={onStart} large>
            Start a conversation
          </PillButton>
          <TextLink href="#how-it-works">See how it works</TextLink>
        </div>
        <p className="mt-4 text-[14px] text-[#6e6e73]">No sign-up needed. Not for emergencies: call 112.<sup className="ml-0.5">1</sup></p>
      </div>

      <div className="mx-auto mt-12 max-w-[1240px] px-3 sm:mt-16 sm:px-5">
        <motion.figure ref={figureRef} style={{ scale: figureScale }} className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#f5f5f7] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)] sm:aspect-[16/9] lg:aspect-[2/1]">
          <motion.div style={{ y: imageY, scale: 1.14 }} className="absolute inset-0">
            <Image
              src="/doctor/dr_ananya.jpg"
              alt="Dr. Ananya, an AI physician, on a video consultation"
              fill
              priority
              sizes="(max-width: 1240px) 100vw, 1240px"
              className="object-cover object-[48%_20%]"
            />
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" aria-hidden="true" />
          <figcaption className="absolute inset-x-4 bottom-5 flex justify-center sm:bottom-8">
            <p
              key={greeting.lang}
              aria-hidden="true"
              className="max-w-[640px] animate-fade-in rounded-2xl bg-black/70 px-5 py-3 text-center text-[17px] font-semibold leading-[1.6] text-white backdrop-blur-md sm:text-[22px]"
            >
              {greeting.text}
            </p>
            <span className="sr-only">An example reply from Dr. Ananya, shown in Kannada, Hindi and English.</span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

/* ───────────────────────── doctors ───────────────────────── */

const DOCTOR_ORDER: DoctorId[] = ['dr_ananya', 'dr_arjun']
const DOCTOR_IMAGE: Record<DoctorId, { src: string; position: string }> = {
  dr_ananya: { src: '/doctor/dr_ananya.jpg', position: '50% 18%' },
  dr_arjun: { src: '/doctor/dr_arjun.jpg', position: '50% 12%' },
}

export function DoctorTiles({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  return (
    <section id="doctor-selection" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1240px] px-3 sm:px-5">
        <div className="mx-auto max-w-[760px] px-2 text-center">
          <WordReveal className={H2}>Meet your doctors.</WordReveal>
          <p className={`${LEAD} mt-4`}>Two AI physicians who listen, ask the right follow-up questions, and always say what they are.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2">
          {DOCTOR_ORDER.map((id) => {
            const doctor = DOCTORS[id]
            const image = DOCTOR_IMAGE[id]
            return (
              <article key={id} className="group flex flex-col overflow-hidden rounded-[28px] bg-[#f5f5f7] text-center transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]">
                <div className="px-6 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">
                  <h3 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#1d1d1f] sm:text-[40px]">{doctor.name}</h3>
                  <p className="mt-2 text-[19px] leading-[1.35] text-[#1d1d1f]">{doctor.specialty}</p>
                  <p className="mx-auto mt-3 max-w-[420px] text-[17px] leading-[1.45] text-[#6e6e73]">{doctor.bio}</p>
                  <div className="mt-6">
                    <PillButton onClick={() => onSelectDoctor(id)}>Talk to {doctor.name}</PillButton>
                  </div>
                </div>
                <div className="relative mt-auto aspect-[4/3] w-full">
                  <Image
                    src={image.src}
                    alt={`${doctor.name}, an AI physician`}
                    fill
                    sizes="(max-width: 768px) 100vw, 620px"
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                    style={{ objectPosition: image.position }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── languages (dark band) ───────────────────────── */

const LANGUAGES = [
  { script: 'ಕನ್ನಡ', name: 'Kannada' },
  { script: 'हिन्दी', name: 'Hindi' },
  { script: 'English', name: 'English' },
]

export function LanguagesBand() {
  return (
    <section className="bg-black px-5 py-24 text-center sm:py-32">
      <h2 className="mx-auto max-w-[760px] text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#f5f5f7] sm:text-[48px] lg:text-[56px]">
        Speaks the way you do.
      </h2>
      <p className="mx-auto mt-4 max-w-[560px] text-[19px] leading-[1.4] text-[#a1a1a6] sm:text-[21px]">
        Ask in one language, switch to another halfway through. The doctor keeps up, and so do the subtitles.
      </p>
      <ul className="mt-14 flex flex-col items-center justify-center gap-10 sm:mt-20 sm:flex-row sm:items-end sm:gap-20">
        {LANGUAGES.map((language) => (
          <li key={language.name}>
            <span className="block text-[64px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#f5f5f7] sm:text-[88px]">{language.script}</span>
            <span className="mt-1 block text-[17px] text-[#a1a1a6]">{language.name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ───────────────────────── features ───────────────────────── */

const FEATURES = [
  {
    icon: FileText,
    title: 'Understand your reports.',
    body: 'Paste a lab report and get a plain-language reading of what each value means and what to ask next.',
  },
  {
    icon: ShieldAlert,
    title: 'Knows when to say go now.',
    body: 'Warning signs such as chest pain or trouble breathing are routed straight to urgent care, including 112 in India.',
  },
  {
    icon: Pill,
    title: 'Medicine, explained.',
    body: 'General information about common medicines, and the questions worth asking your pharmacist.',
  },
  {
    icon: Activity,
    title: 'Keep track over time.',
    body: 'Every conversation ends with a summary you can save and take to your own clinician.',
  },
]

export function FeatureTiles() {
  return (
    <section id="how-it-works-features" className="bg-[#f5f5f7] py-20 sm:py-28">
      <div className="mx-auto max-w-[1240px] px-3 sm:px-5">
        <div className="mx-auto max-w-[760px] px-2 text-center">
          <WordReveal className={H2}>Everything before you see a clinician.</WordReveal>
        </div>
        <div className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Reveal key={title} className="h-full">
              <TiltSpotlightCard className="min-h-[300px] rounded-[28px] bg-white p-8 sm:min-h-[340px] sm:p-12">
                <Icon size={40} strokeWidth={1.5} className="text-[#0071e3]" aria-hidden="true" />
                <article>
                  <h3 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#1d1d1f] sm:text-[32px]">{title}</h3>
                  <p className="mt-3 max-w-[420px] text-[17px] leading-[1.5] text-[#6e6e73]">{body}</p>
                </article>
              </TiltSpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── how it works ───────────────────────── */

const STEPS = [
  { title: 'Choose a language.', body: 'Pick Kannada, Hindi or English, and the doctor you would like to talk to.' },
  { title: 'Say what is wrong.', body: 'Speak or type. The doctor replies out loud, with subtitles, and asks what it needs to know.' },
  { title: 'Leave with a next step.', body: 'Get a short summary and clear guidance on whether to rest, see a clinician, or go to hospital.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1080px] px-5">
        <WordReveal className={`${H2} mx-auto max-w-[760px] text-center`}>Three steps. About five minutes.</WordReveal>
        <ol className="mt-12 grid gap-10 sm:mt-16 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-[#d2d2d7] pt-6">
              <span className="block text-[56px] font-semibold leading-none tracking-[-0.03em] text-[#d2d2d7]" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-5 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#1d1d1f]">{step.title}</h3>
              <p className="mt-2 text-[17px] leading-[1.5] text-[#6e6e73]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────────────────────── safety ───────────────────────── */

const SAFETY = [
  { lead: 'They are AI.', body: 'The doctors say so, and never claim to be human clinicians.' },
  { lead: 'Not for emergencies.', body: 'If you think it is serious, call 112 first. Warning signs in a conversation point you to urgent care.' },
  { lead: 'No diagnosis.', body: 'You get information and preliminary guidance. A qualified clinician makes the diagnosis and prescribes.' },
  { lead: 'Kept to you.', body: 'Guest consultations are separate from other users, and your summary is saved only to your own session.' },
]

export function Safety() {
  return (
    <section id="trust" className="scroll-mt-24 bg-[#f5f5f7] py-20 sm:py-28">
      <div className="mx-auto grid max-w-[1080px] gap-12 px-5 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div>
          <WordReveal className={H2}>Honest about what this is.</WordReveal>
        </div>
        <dl className="space-y-7">
          {SAFETY.map((item) => (
            <div key={item.lead}>
              <dt className="text-[21px] font-semibold leading-[1.25] tracking-[-0.015em] text-[#1d1d1f]">{item.lead}</dt>
              <dd className="mt-1 text-[17px] leading-[1.5] text-[#6e6e73]">{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ───────────────────────── faq ───────────────────────── */

const FAQ = [
  ['Is this a consultation with a human doctor?', 'No. MediCare uses clearly identified AI care assistants for preliminary health information and guidance. They do not replace a qualified clinician.'],
  ['What can I talk about?', 'Symptoms, reports, questions about your wellbeing, or anything you want to understand before deciding on a next step.'],
  ['Is my conversation private?', 'Guest consultations are kept separate from other users, and your summary is saved only to your own session.'],
  ['What should I do in an emergency?', 'Do not use MediCare. Contact local emergency services immediately. In India, call 112.'],
  ['Which languages are supported?', 'Kannada, Hindi and English, for both doctors. You can switch language during the conversation.'],
  ['Do I need an account?', 'No. You can start as a guest. Guest sessions are temporary and cleared automatically.'],
  ['Can it read my lab report?', 'Yes. Share the values and it explains them in plain language and suggests questions for your clinician. It does not diagnose.'],
]

export function Faq() {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const allOpen = open.size === FAQ.length
  const toggle = (i: number) => setOpen((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[820px] px-5">
        <h2 className={`${H2} text-center`}>Questions, answered.</h2>
        <div className="mt-8 flex justify-end">
          <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(FAQ.map((_, i) => i)))} className="rounded text-[14px] text-[#0071e3] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30">
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <div className="mt-3 border-b border-[#d2d2d7]">
          {FAQ.map(([question, answer], i) => (
            <div key={question} className="border-t border-[#d2d2d7]">
              <h3>
                <button type="button" aria-expanded={open.has(i)} aria-controls={`faq-${i}`} onClick={() => toggle(i)} className="flex min-h-[72px] w-full items-center justify-between gap-6 py-4 text-left text-[19px] font-semibold leading-[1.3] text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#0071e3]/30 sm:text-[21px]">
                  {question}
                  <span className={`text-[28px] font-light leading-none text-[#6e6e73] transition-transform ${open.has(i) ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
                </button>
              </h3>
              <div id={`faq-${i}`} role="region" hidden={!open.has(i)}>
                <p className="max-w-[640px] pb-6 pr-10 text-[17px] leading-[1.55] text-[#6e6e73]">{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── closing call to action ───────────────────────── */

export function ClosingCta({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden bg-black px-5 py-28 text-center text-white sm:py-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-[100%] bg-[#0071e3]/25 blur-[110px]" />
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
        <div className="absolute left-1/2 top-1/2 h-[860px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
      </div>
      <Reveal className="relative">
        <h2 className="mx-auto max-w-[820px] bg-gradient-to-b from-white to-[#8e8e93] bg-clip-text text-[44px] font-semibold leading-[1.03] tracking-[-0.04em] text-transparent sm:text-[84px]">
          Start with what is on your mind.
        </h2>
        <p className="mx-auto mt-6 max-w-[520px] text-[19px] leading-[1.4] text-[#a1a1a6] sm:text-[21px]">Free, private, and in the language you think in.</p>
        <div className="mt-10">
          <PillButton onClick={onStart} large>
            Start a conversation
          </PillButton>
        </div>
      </Reveal>
    </section>
  )
}

/* ───────────────────────── footer ───────────────────────── */

const FOOTER_COLUMNS = [
  { title: 'Consult', links: [{ label: 'Dr. Ananya', href: '#doctor-selection' }, { label: 'Dr. Smit', href: '#doctor-selection' }, { label: 'How it works', href: '#how-it-works' }] },
  { title: 'Safety', links: [{ label: 'Honest about what this is', href: '#trust' }, { label: 'Emergency: call 112', href: 'tel:112' }, { label: 'FAQ', href: '#faq' }] },
  { title: 'Languages', links: [{ label: 'ಕನ್ನಡ', href: '#doctor-selection' }, { label: 'हिन्दी', href: '#doctor-selection' }, { label: 'English', href: '#doctor-selection' }] },
  { title: 'Legal', links: [{ label: 'Terms of Use', href: '/terms' }, { label: 'Privacy Policy', href: '/privacy' }] },
]

export function SiteFooter() {
  return (
    <footer className="bg-[#f5f5f7] text-[#6e6e73]">
      <div className="mx-auto max-w-[1080px] px-5 pb-10">
        <ol className="list-decimal space-y-2 border-t border-[#d2d2d7] pt-6 pl-4 text-[12px] leading-[1.6]">
          <li>MediCare is an AI health assistant from Medicus Labs. It gives general health information and preliminary guidance. It is not a licensed physician, does not diagnose or prescribe, and is not for emergencies. In an emergency, call 112.</li>
          <li>The doctors are AI characters, not real people. Replies can be incomplete or wrong; confirm anything important with a qualified clinician.</li>
          <li>Kannada, Hindi and English are supported. Voice and subtitle quality depends on your device, browser and connection.</li>
          <li>Guest sessions are temporary and are deleted automatically. See the <a href="/privacy" className="underline">Privacy Policy</a>.</li>
        </ol>
        <div className="mt-8 grid grid-cols-2 gap-8 border-t border-[#d2d2d7] pt-8 sm:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[12px] font-semibold text-[#1d1d1f]">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="rounded text-[12px] hover:text-[#1d1d1f] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#d2d2d7] pt-5 text-[12px]">
          <p>Copyright © {new Date().getFullYear()} Medicus Labs. All rights reserved.</p>
          <p className="flex gap-4"><a href="/privacy" className="hover:text-[#1d1d1f] hover:underline">Privacy Policy</a><a href="/terms" className="hover:text-[#1d1d1f] hover:underline">Terms of Use</a></p>
        </div>
      </div>
    </footer>
  )
}
