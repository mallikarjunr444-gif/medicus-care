'use client'

import Image from 'next/image'
import type { DoctorId } from '@/lib/doctorTypes'

/**
 * Apple-style hands hero.
 *
 * Uses the photorealistic "Duo in hands" device asset (transparent background)
 * with a live screen overlay. On load the screen content blurs + darkens and
 * then sharpens into the calm landscape — the iPhone Duo starting reveal.
 */
export function EditorialHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  return (
    <section className="relative overflow-hidden bg-white pb-12 pt-10 sm:pb-16 sm:pt-12">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">MediCare</p>
        <h1 className="mt-2 font-sans text-[2.7rem] font-bold leading-[0.98] tracking-[-0.045em] text-[#0F150A] sm:text-6xl lg:text-[4.6rem]">
          Say hello to
          <br />
          calmer care.
        </h1>

        <div className="relative mx-auto mt-5 w-full sm:mt-6">
          <Image
            src="/landing/duo-base.png"
            alt="Two hands holding the MediCare foldable"
            width={664}
            height={300}
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="h-auto w-full"
          />

          {/* Live screen overlay, aligned to the device display */}
          <div
            className="screen-reveal absolute overflow-hidden"
            style={{
              left: '22.59%',
              top: '0.67%',
              width: '56.48%',
              height: '93.67%',
              borderRadius: '6%',
            }}
          >
            <Image
              src="/landing/calm-lake.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 56vw, 520px"
              className="object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#07130c]/85 via-[#07130c]/15 to-transparent"
            />
            <div className="absolute inset-x-[6%] bottom-[8%] text-left">
              <h2 className="font-sans text-[clamp(9px,1.5vw,17px)] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.4)]">
                Tune out the noise,
                <br />
                tune into yourself.
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/70 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white">
                  Products
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#2f4a2a]">
                  Get started
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-2 flex w-fit items-center gap-4 rounded-full border border-[#E3E1D9] bg-white py-2 pl-5 pr-2 shadow-sm sm:mt-3">
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
      </div>
    </section>
  )
}
