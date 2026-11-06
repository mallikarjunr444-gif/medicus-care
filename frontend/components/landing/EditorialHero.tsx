'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { ArrowRight, Mic } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

const HALF = 'min(280px, 40vw)'
const HEIGHT = 'min(430px, 60vw)'

/**
 * Scroll-driven foldable hero.
 *
 * At scroll progress 0 the device is closed: a portrait phone showing the
 * MediCare chat. As the section scrolls, `--p` goes 0 → 1, the left half
 * unfolds on its hinge and the screen reveals the calm landscape from the
 * reference — sky, sun, field and the "tune out the noise" message.
 */
export function EditorialHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const inner = innerRef.current
    if (!section || !inner) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      inner.style.setProperty('--p', '1')
      return
    }

    let raf = 0
    const update = () => {
      const rect = section.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
      inner.style.setProperty('--p', p.toFixed(4))
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative h-[170vh] bg-[#F5F5F7]">
      <div
        ref={innerRef}
        className="sticky top-[4.25rem] flex h-[calc(100dvh-4.25rem)] items-center justify-center overflow-hidden"
        style={{ '--p': 0 } as CSSProperties}
      >
        <div className="w-full max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold text-[#0F150A]">Medicus Care</p>
          <h1 className="mt-2 font-sans text-[2.6rem] font-bold leading-[0.98] tracking-[-0.045em] text-[#0F150A] sm:text-6xl lg:text-[4.6rem]">
            Say hello to
            <br />
            calmer care.
          </h1>

          {/* Foldable stage */}
          <div className="mt-8 flex justify-center sm:mt-10">
            <div
              className="relative"
              style={
                {
                  width: 'calc(2 * min(280px, 40vw))',
                  height: HEIGHT,
                  transform:
                    'translateX(calc((var(--p) - 1) * min(140px, 20vw))) scale(calc(0.94 + var(--p) * 0.16))',
                  perspective: '1600px',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                } as CSSProperties
              }
            >
              {/* Right half — fixed rear panel */}
              <div
                className="absolute left-1/2 top-0 overflow-hidden rounded-r-[2rem] border-y-[6px] border-r-[6px] border-[#1b1b1d] bg-[#faf9f5] shadow-[0_40px_80px_-30px_rgba(0,0,0,.45)]"
                style={{ width: HALF, height: HEIGHT, transformOrigin: 'left center' }}
              >
                <SceneHalf side="right" />
                <div className="absolute inset-0" style={{ opacity: 'calc(1 - var(--p) * 1.15)' }}>
                  <ChatScreen onStart={() => onSelectDoctor('dr_ananya')} />
                </div>
              </div>

              {/* Left half — unfolds on the centre hinge */}
              <div
                className="absolute right-1/2 top-0 overflow-hidden rounded-l-[2rem] border-y-[6px] border-l-[6px] border-[#1b1b1d]"
                style={{
                  width: HALF,
                  height: HEIGHT,
                  transformOrigin: 'right center',
                  transform: 'rotateY(calc((var(--p) - 1) * 180deg))',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <SceneHalf side="left" />
              </div>

              {/* Hinge line */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-gradient-to-b from-black/5 via-black/35 to-black/5"
                style={{ opacity: 'calc(1 - var(--p))' }}
              />
            </div>
          </div>

          {/* Price + CTA pill */}
          <div className="mx-auto mt-8 flex w-fit items-center gap-4 rounded-full border border-[#E3E1D9] bg-white py-2 pl-5 pr-2 shadow-sm sm:mt-10">
            <div className="text-left">
              <p className="text-xs font-semibold text-[#0F150A]">Free to start · No sign-up</p>
              <p className="text-[11px] text-[#6b6b6b]">Private AI care in 3 languages</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectDoctor('dr_ananya')}
              className="rounded-full bg-[#0F150A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#26301f]"
            >
              Start
            </button>
          </div>

          <p
            className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#9a9a9a]"
            style={{ opacity: 'calc(1 - var(--p) * 2)' }}
          >
            Scroll to open
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── the revealed landscape scene ─────────────────────────── */

function SceneHalf({ side }: { side: 'left' | 'right' }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#3d5a2f]">
      {/* Photo: Unsplash (photo-1508672019048-805c876b67e2) — calm lake meditation. */}
      {/* The full photo is drawn at 2× the half-width; each half reveals its own side. */}
      <div
        className="absolute top-0 h-full"
        style={{ width: '200%', left: side === 'left' ? '0%' : '-100%' }}
      >
        <Image
          src="/landing/calm-lake.jpg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover object-center"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#07130c]/80 via-[#07130c]/15 to-transparent"
      />

      {side === 'left' ? (
        <div className="absolute inset-x-4 bottom-6 sm:inset-x-5">
          <h2 className="font-sans text-sm font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.35)] sm:text-lg">
            Tune out the noise,
            <br />
            tune into yourself.
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/70 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-white">
              Products
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#2f4a2a]">
              Get started <ArrowRight size={10} aria-hidden="true" />
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ── the closed-state chat screen ─────────────────────────── */

function ChatScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[#faf9f5]">
      <div className="flex items-center justify-between px-4 pb-1 pt-3 text-[9px] font-semibold text-[#0F150A]">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="h-1 w-2.5 rounded-sm bg-[#0F150A]/80" />
          <span className="h-1.5 w-3 rounded-sm border border-[#0F150A]/40" />
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 pb-2 pt-1">
        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#e6e3da]">
          <Image src="/doctor/dr_ananya.jpg" alt="" fill sizes="28px" className="object-cover object-[50%_25%]" />
        </span>
        <div className="text-left">
          <p className="text-[11px] font-semibold text-[#0F150A]">Dr. Ananya</p>
          <p className="flex items-center gap-1 text-[8px] text-[#5C6B62]">
            <span className="h-1 w-1 rounded-full bg-[#6B8F3E]" /> AI care assistant
          </p>
        </div>
        <span className="ml-auto rounded-full bg-[#EDF2E3] px-1.5 py-0.5 text-[8px] font-semibold text-[#4E6338]">
          Live
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-1.5 px-2.5 pb-2">
        <div className="ml-auto w-fit max-w-[82%] rounded-xl rounded-tr-sm bg-[#0F150A] px-2.5 py-1.5 text-[9px] leading-4 text-white">
          I&apos;ve felt anxious all week.
        </div>
        <div className="w-fit max-w-[82%] rounded-xl rounded-tl-sm border border-[#E5E1D6] bg-white px-2.5 py-1.5 text-[9px] leading-4 text-[#3C473D]">
          Thanks for telling me. Let&apos;s take it one step at a time.
        </div>
        <div className="flex w-fit items-center gap-1 rounded-full border border-[#E5E1D6] bg-white px-2 py-0.5 text-[8px] text-[#8a8a8a]">
          <span className="h-1 w-1 rounded-full bg-[#9BC24A]" /> Dr. Ananya is listening…
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[#E5E1D6] bg-white px-2.5 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F1F0EA] text-[#5C6B62]">
          <Mic size={11} aria-hidden="true" />
        </span>
        <span className="flex-1 truncate text-left text-[9px] text-[#9a9a9a]">Speak or type…</span>
        <button
          type="button"
          onClick={onStart}
          aria-label="Start with Dr. Ananya"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F150A] text-white"
        >
          <ArrowRight size={11} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
