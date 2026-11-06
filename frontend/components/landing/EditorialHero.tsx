'use client'

import Image from 'next/image'
import type { DoctorId } from '@/lib/doctorTypes'

/**
 * Product hero: two hands opening the MediCare foldable, revealing a calm
 * landscape with the "tune out the noise" message. The image is a composited
 * photo (free iPhone-Duo in-hands mockup) and unfolds into view on load.
 */
export function EditorialHero({ onSelectDoctor }: { onSelectDoctor: (id: DoctorId) => void }) {
  return (
    <section className="relative overflow-hidden bg-[#F6CEC4] pb-12 pt-10 sm:pb-16 sm:pt-12">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="text-sm font-semibold text-[#4a352b]">Medicus Care</p>
        <h1 className="mt-2 font-sans text-[2.7rem] font-bold leading-[0.98] tracking-[-0.045em] text-[#0F150A] sm:text-6xl lg:text-[4.8rem]">
          Say hello to
          <br />
          calmer care.
        </h1>

        <div className="animate-unfold mt-6 sm:mt-8">
          <Image
            src="/landing/hands-duo.jpg"
            alt="Two hands opening the MediCare foldable, revealing a calm landscape"
            width={1336}
            height={1088}
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="mx-auto h-auto w-full"
          />
        </div>

        <div className="mx-auto mt-2 flex w-fit items-center gap-4 rounded-full border border-[#E3C7B8] bg-white py-2 pl-5 pr-2 shadow-sm sm:mt-3">
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
