'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Camera, Flashlight, Mic, RotateCcw, ShieldCheck, Wifi } from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

const W = 'min(300px, 40vw)'
const H = 'min(440px, 58vw)'

/**
 * iPhone Duo-style hero sequence:
 *   1. closed phone back (camera bar)
 *   2. cover swings open (seamless screen — no middle seam)
 *   3. lock screen (9:41 · desert)
 *   4. lock screen swipes up
 *   5. the MediCare consultation UI is revealed
 */
export function AppleFoldableHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  const [replay, setReplay] = useState(0)

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-8 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">MediCare Duo</p>
        <h1 className="mt-1 font-sans text-[3.2rem] font-bold leading-[1.02] tracking-[-0.04em] text-[#1d1d1f] sm:text-7xl lg:text-[5.4rem]">
          Hello, hello.
        </h1>

        <div className="mt-6 flex justify-center sm:mt-8" style={{ perspective: '1600px' }}>
          <div
            key={replay}
            className="duo-stage relative"
            style={{ width: `calc(2 * ${W})`, height: H, transformStyle: 'preserve-3d' }}
          >
            {/* Right half — rear panel */}
            <div
              className="absolute left-1/2 top-0 overflow-hidden rounded-r-[1.9rem] border-y-[6px] border-r-[6px] border-[#1b1b1d] bg-[#f7f5ef] shadow-[0_40px_80px_-30px_rgba(0,0,0,.35)]"
              style={{ width: W, height: H }}
            >
              <RightScreen onStart={() => onSelectDoctor('dr_ananya')} />
              <LockScreenHalf side="right" />
            </div>

            {/* Left half — cover: back (closed) → front (screen) */}
            <div className="duo-cover absolute right-1/2 top-0" style={{ width: W, height: H }}>
              {/* Front: screen (project UI + lock screen) */}
              <div
                className="absolute inset-0 overflow-hidden rounded-l-[1.9rem] border-y-[6px] border-l-[6px] border-[#1b1b1d] bg-white"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="duo-deblur h-full w-full">
                  <LeftScreen />
                </div>
                <LockScreenHalf side="left" />
              </div>

              {/* Back: phone cover with camera bar */}
              <div
                className="absolute inset-0 overflow-hidden rounded-[1.9rem] border-[6px] border-[#1b1b1d] shadow-[0_40px_80px_-30px_rgba(0,0,0,.35)]"
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
              >
                <PhoneBack />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center gap-2.5">
          <div className="flex w-fit items-center gap-5 rounded-full border border-[#d2d2d7]/80 bg-[#f5f5f7]/90 py-2 pl-5 pr-2 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="text-left">
              <p className="text-[12px] font-semibold tracking-tight text-[#1d1d1f]">Free to start · ₹0</p>
              <p className="text-[11px] text-[#86868b]">AI care in Kannada, Hindi &amp; English</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectDoctor('dr_ananya')}
              className="rounded-full bg-[#0071e3] px-5 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-[#0077ed] active:scale-95"
            >
              Start
            </button>
          </div>

          <button
            type="button"
            onClick={() => setReplay((r) => r + 1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Replay animation
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── lock screen (spans the full open device) ─────────────── */

function LockScreenHalf({ side }: { side: 'left' | 'right' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-0 h-full" style={{ width: '200%', left: side === 'left' ? 0 : '-100%' }}>
        <div className="lock-screen relative h-full w-full overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #cfe0ef 0%, #e9e2d2 46%, #ddc8a8 54%, #c9ae86 100%)' }}
          />
          <div
            className="absolute inset-x-0 top-[36%] h-[20%] opacity-50"
            style={{
              background: '#a98f68',
              clipPath: 'polygon(0 100%, 10% 60%, 24% 82%, 40% 44%, 55% 72%, 70% 48%, 84% 78%, 100% 58%, 100% 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-[52%] h-10 bg-white/30 blur-xl" />

          <div className="absolute inset-x-0 top-[8%] text-center text-white">
            <p className="text-[clamp(8px,1vw,13px)] font-semibold tracking-wide">Wed Apr 1</p>
            <p className="mt-0.5 font-sans text-[clamp(38px,6vw,84px)] font-semibold leading-none tracking-tight drop-shadow">9:41</p>
          </div>

          <Wifi className="absolute right-[6%] top-[6%] h-4 w-4 text-white/90" aria-hidden="true" />

          <div className="absolute bottom-[14%] right-[5%] flex flex-col gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur">
              <Flashlight size={13} aria-hidden="true" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur">
              <Camera size={13} aria-hidden="true" />
            </span>
          </div>

          <div className="absolute inset-x-[42%] bottom-[4%] h-1 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  )
}

/* ── phone back (closed state) ────────────────────────────── */

function PhoneBack() {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-[#F6F1E8] via-[#EFE7DB] to-[#E4DACB]">
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-2xl border border-white/60 bg-[#EAE3D6] p-2 shadow-inner">
        <span className="h-8 w-8 rounded-full bg-[#262626] ring-2 ring-[#cdc4b4]" />
        <span className="h-8 w-8 rounded-full bg-[#262626] ring-2 ring-[#cdc4b4]" />
        <span className="ml-0.5 h-2 w-2 rounded-full bg-[#f4e7b4]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-accent text-3xl italic text-[#b8a88f]">Medicus</span>
      </div>
    </div>
  )
}

/* ── left screen: Dr. Ananya chat ─────────────────────────── */

function LeftScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f7f5ef]">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#e6e3da]">
          <Image src="/doctor/dr_ananya.jpg" alt="" fill sizes="32px" className="object-cover object-[50%_25%]" />
        </span>
        <div className="text-left">
          <p className="text-[11px] font-semibold text-[#1d1d1f]">Dr. Ananya</p>
          <p className="flex items-center gap-1 text-[8px] text-[#6e6e73]">
            <span className="h-1 w-1 rounded-full bg-[#6B8F3E]" /> AI care assistant
          </p>
        </div>
        <span className="ml-auto rounded-full bg-[#e8f0e4] px-2 py-0.5 text-[8px] font-semibold text-[#3f5a2f]">Live</span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-2 px-3 pb-3">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1d1d1f] px-3 py-2 text-[10px] leading-4 text-white">
          I&apos;ve felt anxious all week.
        </div>
        <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm border border-[#e5e1d6] bg-white px-3 py-2 text-[10px] leading-4 text-[#3c473d]">
          Thanks for telling me. Let&apos;s take it one step at a time.
        </div>
        <div className="flex w-fit items-center gap-1 rounded-full border border-[#e5e1d6] bg-white px-2 py-0.5 text-[8px] text-[#8a8a8a]">
          <span className="h-1 w-1 rounded-full bg-[#9BC24A]" /> Dr. Ananya is listening…
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[#e5e1d6] bg-white px-3 py-2.5">
        <Mic size={12} className="text-[#6e6e73]" aria-hidden="true" />
        <span className="flex-1 text-left text-[9px] text-[#9a9a9a]">Speak or type…</span>
      </div>
    </div>
  )
}

/* ── right screen: session summary ────────────────────────── */

function RightScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[#f7f5ef] p-3.5">
      <div className="flex items-center justify-between text-[8px] text-[#6e6e73]">
        <span className="font-semibold uppercase tracking-wider">Session summary</span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={10} className="text-[#6B8F3E]" aria-hidden="true" /> Private
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {[
          ['Mood', 'Calm'],
          ['Energy', 'Steady'],
          ['Sleep', '6h 40m'],
          ['Stress', 'Low'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[#e5e1d6] bg-white p-2">
            <p className="text-[8px] text-[#6e6e73]">{k}</p>
            <p className="text-[11px] font-semibold text-[#1d1d1f]">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-[#e5e1d6] bg-white p-3">
        <p className="text-[8px] text-[#6e6e73]">Next step</p>
        <p className="mt-0.5 text-[11px] font-semibold text-[#1d1d1f]">A 10-minute check-in</p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F150A] py-2.5 text-[10px] font-semibold text-white"
      >
        Start consultation <ArrowRight size={12} aria-hidden="true" />
      </button>
    </div>
  )
}
