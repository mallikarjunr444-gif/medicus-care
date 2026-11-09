'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DOCTORS } from '@/lib/doctorTypes'
import type { DoctorId } from '@/lib/doctorTypes'
import { Reveal } from '@/components/ui/reveal'

const H2 = 'text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1d1d1f] sm:text-[48px] lg:text-[56px]'

/* ───────────────── sticky local navigation ───────────────── */

const LOCAL_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#highlights', label: 'Highlights' },
  { href: '#languages', label: 'Languages' },
  { href: '#compare', label: 'Compare' },
  { href: '#faq', label: 'FAQ' },
]

/** A second, quieter bar that holds the page's own sections and the main action. */
export function LocalNav({ onStart }: { onStart: () => void }) {
  return (
    <div className="sticky top-12 z-40 border-b border-black/[0.08] bg-[#f5f5f7]/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-11 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">Doctors</span>
        <nav aria-label="Sections of this page" className="hidden items-center gap-6 md:flex">
          {LOCAL_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="rounded text-[12px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30">
              {link.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-7 items-center rounded-full bg-[#0071e3] px-3.5 text-[12px] text-white transition-colors hover:bg-[#0077ed] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
        >
          Start
        </button>
      </div>
    </div>
  )
}

/* ───────────────── highlights row (under the hero) ───────────────── */

const CHIPS = [
  { href: '#highlights', label: 'Kannada, Hindi, English' },
  { href: '#highlights', label: 'Talk or type' },
  { href: '#highlights', label: 'Reports explained' },
  { href: '#highlights', label: 'Urgent signs first' },
]

export function HighlightChips() {
  return (
    <div className="bg-white pb-6 pt-10 text-center sm:pt-14">
      <p className="text-[14px] font-semibold text-[#1d1d1f]">Highlights</p>
      <ul className="mx-auto mt-4 flex max-w-[860px] flex-wrap justify-center gap-2.5 px-5">
        {CHIPS.map((chip) => (
          <li key={chip.label}>
            <a href={chip.href} className="inline-flex h-9 items-center rounded-full bg-[#f5f5f7] px-4 text-[14px] text-[#1d1d1f] transition-colors hover:bg-[#e8e8ed] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30">
              {chip.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ───────────────── highlights gallery (swipeable) ───────────────── */

type Tone = 'dark' | 'light' | 'blue' | 'grey'

const SLIDES: { tone: Tone; kicker: string; title: string; body: string; big?: string }[] = [
  { tone: 'dark', kicker: 'Languages', title: 'Your language. Start to finish.', body: 'Speak, read and listen in Kannada, Hindi or English, and switch whenever you like.', big: 'ಕ  हि  En' },
  { tone: 'light', kicker: 'Voice', title: 'Hears you. Answers aloud.', body: 'Talk naturally. The doctor replies out loud, with large subtitles you can read along with.' },
  { tone: 'blue', kicker: 'Reports', title: 'Your report, in plain words.', body: 'Paste a lab report and see what each value means and what to ask next.' },
  { tone: 'grey', kicker: 'Safety', title: 'Urgent signs come first.', body: 'Chest pain, trouble breathing and other warning signs are sent straight to urgent care.' },
  { tone: 'dark', kicker: 'Summary', title: 'Leave with a next step.', body: 'Every conversation ends with a short summary to save and take to your own clinician.' },
]

const TONES: Record<Tone, { card: string; kicker: string; title: string; body: string }> = {
  dark: { card: 'bg-black', kicker: 'text-[#a1a1a6]', title: 'text-[#f5f5f7]', body: 'text-[#a1a1a6]' },
  light: { card: 'bg-[#f5f5f7]', kicker: 'text-[#6e6e73]', title: 'text-[#1d1d1f]', body: 'text-[#6e6e73]' },
  blue: { card: 'bg-[#0071e3]', kicker: 'text-white/75', title: 'text-white', body: 'text-white/85' },
  grey: { card: 'bg-[#e8e8ed]', kicker: 'text-[#6e6e73]', title: 'text-[#1d1d1f]', body: 'text-[#424245]' },
}

export function HighlightsGallery() {
  const track = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)

  const go = useCallback((index: number) => {
    const node = track.current
    if (!node) return
    const target = Math.max(0, Math.min(SLIDES.length - 1, index))
    const child = node.children[target] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  useEffect(() => {
    const node = track.current
    if (!node) return
    const onScroll = () => {
      const centre = node.scrollLeft + node.clientWidth / 2
      let best = 0
      let bestDistance = Infinity
      Array.from(node.children).forEach((child, i) => {
        const el = child as HTMLElement
        const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centre)
        if (distance < bestDistance) { best = i; bestDistance = distance }
      })
      setActive(best)
    }
    node.addEventListener('scroll', onScroll, { passive: true })
    return () => node.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section id="highlights" className="scroll-mt-24 bg-white py-20 sm:py-28" aria-roledescription="carousel" aria-label="Highlights">
      <Reveal>
        <h2 className={`${H2} mx-auto max-w-[1240px] px-5 sm:px-8`}>Get the highlights.</h2>
      </Reveal>
      <ul ref={track} className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mt-14 sm:gap-5 sm:px-[max(2rem,calc((100vw-1240px)/2+2rem))]" tabIndex={0} aria-label="Swipe or use arrow keys to browse highlights">
        {SLIDES.map((slide, i) => {
          const t = TONES[slide.tone]
          return (
            <li key={slide.title} aria-label={`${i + 1} of ${SLIDES.length}`} className={`flex min-h-[460px] w-[82vw] max-w-[560px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-[28px] p-8 sm:min-h-[560px] sm:w-[560px] sm:p-12 ${t.card}`}>
              <div>
                <p className={`text-[14px] font-semibold ${t.kicker}`}>{slide.kicker}</p>
                <h3 className={`mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[40px] ${t.title}`}>{slide.title}</h3>
              </div>
              <div>
                {slide.big && <p aria-hidden="true" className="mb-6 text-[56px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#f5f5f7] sm:text-[72px]">{slide.big}</p>}
                <p className={`max-w-[400px] text-[17px] leading-[1.5] sm:text-[19px] ${t.body}`}>{slide.body}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-8 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-[#e8e8ed] px-3 py-2.5" role="tablist" aria-label="Choose highlight">
          {SLIDES.map((slide, i) => (
            <button key={slide.title} type="button" role="tab" aria-selected={active === i} aria-label={`Highlight ${i + 1}: ${slide.kicker}`} onClick={() => go(i)} className={`h-2 rounded-full transition-all ${active === i ? 'w-5 bg-[#1d1d1f]' : 'w-2 bg-[#86868b]'}`} />
          ))}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous highlight" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e8ed] text-[#1d1d1f] transition-colors hover:bg-[#d2d2d7] disabled:opacity-40"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => go(active + 1)} disabled={active === SLIDES.length - 1} aria-label="Next highlight" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e8ed] text-[#1d1d1f] transition-colors hover:bg-[#d2d2d7] disabled:opacity-40"><ChevronRight size={18} /></button>
        </div>
      </div>
    </section>
  )
}

/* ───────────────── language viewer (tabs) ───────────────── */

const EXAMPLES = [
  { id: 'kn', tab: 'ಕನ್ನಡ', name: 'Kannada', you: 'ನನಗೆ ಮೂರು ದಿನಗಳಿಂದ ತಲೆನೋವು ಇದೆ.', doctor: 'ನಿಮಗೆ ನೋವಾಗುತ್ತಿರುವುದು ಕೇಳಿ ಬೇಸರವಾಯಿತು. ನೋವು ತಲೆಯ ಒಂದು ಬದಿಯಲ್ಲಿದೆಯೇ, ವಾಕರಿಕೆ ಕೂಡ ಇದೆಯೇ?' },
  { id: 'hi', tab: 'हिन्दी', name: 'Hindi', you: 'मुझे तीन दिन से सिरदर्द है।', doctor: 'आपको तकलीफ़ हो रही है, यह जानकर दुख हुआ। क्या दर्द सिर के एक तरफ़ है, और क्या मितली भी आ रही है?' },
  { id: 'en', tab: 'English', name: 'English', you: 'I have had a headache for three days.', doctor: 'I am sorry you are in pain. Is it on one side of your head, and do you feel any nausea?' },
]

export function LanguageViewer({ onStart }: { onStart: () => void }) {
  const [current, setCurrent] = useState(0)
  const example = EXAMPLES[current]

  return (
    <section id="languages" className="scroll-mt-24 bg-black px-5 py-24 sm:py-32">
      <Reveal className="mx-auto max-w-[900px] text-center">
        <h2 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#f5f5f7] sm:text-[48px] lg:text-[56px]">Speaks the way you do.</h2>
        <p className="mx-auto mt-4 max-w-[560px] text-[19px] leading-[1.4] text-[#a1a1a6] sm:text-[21px]">Ask in one language, switch to another halfway through. The doctor keeps up, and so do the subtitles.</p>
      </Reveal>

      <div className="mx-auto mt-12 flex max-w-[360px] justify-center gap-1 rounded-full bg-[#1d1d1f] p-1" role="tablist" aria-label="Example language">
        {EXAMPLES.map((e, i) => (
          <button key={e.id} type="button" role="tab" aria-selected={current === i} onClick={() => setCurrent(i)} className={`h-10 flex-1 rounded-full px-4 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2997ff]/40 ${current === i ? 'bg-[#f5f5f7] font-semibold text-[#1d1d1f]' : 'text-[#a1a1a6] hover:text-white'}`}>
            {e.tab}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={`${example.name} example`} className="mx-auto mt-10 max-w-[720px] space-y-4">
        <p className="ml-auto w-fit max-w-[88%] rounded-[22px] rounded-br-md bg-[#0071e3] px-5 py-3.5 text-[19px] leading-[1.6] text-white sm:text-[22px]">{example.you}</p>
        <p className="w-fit max-w-[92%] rounded-[22px] rounded-bl-md bg-[#1d1d1f] px-5 py-3.5 text-[19px] leading-[1.6] text-[#f5f5f7] sm:text-[22px]">{example.doctor}</p>
        <p className="pt-2 text-center text-[13px] text-[#86868b]">An example conversation, shown in {example.name}.</p>
      </div>

      <div className="mt-10 text-center">
        <button type="button" onClick={onStart} className="text-[19px] text-[#2997ff] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2997ff]/40">
          Try it in your language <span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  )
}

/* ───────────────── compare the doctors ───────────────── */

const COMPARE_ORDER: DoctorId[] = ['dr_ananya', 'dr_arjun']
const COMPARE_IMAGE: Record<DoctorId, string> = { dr_ananya: '/doctor/dr_ananya.jpg', dr_arjun: '/doctor/dr_arjun.jpg' }
const COMPARE_FOCUS: Record<DoctorId, string> = {
  dr_ananya: 'Lab reports, wellness and lifestyle questions',
  dr_arjun: 'Symptom check, triage and prevention',
}
const COMPARE_VOICE: Record<DoctorId, string> = { dr_ananya: 'Female voice', dr_arjun: 'Male voice' }

export function CompareDoctors({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  const [mobile, setMobile] = useState<DoctorId>('dr_ananya')

  const rows: { label: string; value: (id: DoctorId) => string }[] = [
    { label: 'Role', value: (id) => DOCTORS[id].specialty },
    { label: 'Best for', value: (id) => COMPARE_FOCUS[id] },
    { label: 'Voice', value: (id) => COMPARE_VOICE[id] },
    { label: 'Languages', value: (id) => DOCTORS[id].languages.map((l) => l.label).join(', ') },
    { label: 'Subtitles', value: () => 'Always on screen' },
    { label: 'Report help', value: () => 'Yes' },
  ]

  return (
    <section id="compare" className="scroll-mt-24 bg-[#f5f5f7] py-20 sm:py-28">
      <div className="mx-auto max-w-[1080px] px-5">
        <Reveal>
          <h2 className={`${H2} text-center`}>Which doctor is right for you?</h2>
        </Reveal>

        <div className="mx-auto mt-8 flex w-fit gap-1 rounded-full bg-[#e8e8ed] p-1 md:hidden" role="tablist" aria-label="Choose a doctor to view">
          {COMPARE_ORDER.map((id) => (
            <button key={id} type="button" role="tab" aria-selected={mobile === id} onClick={() => setMobile(id)} className={`h-9 rounded-full px-5 text-[15px] transition-colors ${mobile === id ? 'bg-white font-semibold text-[#1d1d1f] shadow-sm' : 'text-[#6e6e73]'}`}>
              {DOCTORS[id].name}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-8">
          {COMPARE_ORDER.map((id) => (
            <article key={id} className={`${mobile === id ? 'block' : 'hidden'} rounded-[28px] bg-white p-7 sm:p-10 md:block`}>
              <div className="flex items-center gap-4">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#f5f5f7]">
                  <Image src={COMPARE_IMAGE[id]} alt="" fill sizes="80px" className="object-cover object-[50%_15%]" />
                </span>
                <div>
                  <h3 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#1d1d1f]">{DOCTORS[id].name}</h3>
                  <p className="mt-1 text-[15px] text-[#6e6e73]">AI physician</p>
                </div>
              </div>
              <dl className="mt-8 divide-y divide-[#d2d2d7] border-y border-[#d2d2d7]">
                {rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[110px_1fr] gap-4 py-4 text-[15px] leading-[1.45] sm:grid-cols-[130px_1fr] sm:text-[17px]">
                    <dt className="text-[#6e6e73]">{row.label}</dt>
                    <dd className="text-[#1d1d1f]">{row.value(id)}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" onClick={() => onSelectDoctor(id)} className="mt-8 inline-flex h-11 items-center rounded-full bg-[#0071e3] px-6 text-[17px] text-white transition-colors hover:bg-[#0077ed] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30">
                Talk to {DOCTORS[id].name}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
