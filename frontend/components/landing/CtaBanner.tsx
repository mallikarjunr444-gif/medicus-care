import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

/** Image-led closing invitation, using the supplied reference artwork. */
export function CtaBanner({ onStart }: Readonly<{ onStart: () => void }>) {
  return (
    <section className="relative isolate aspect-[4/3] overflow-hidden bg-[#0f150a] text-white">
      <picture className="absolute inset-0 -z-10 block">
        <source type="image/avif" srcSet="/landing/care-cta.avif" />
        <Image
          src="/landing/care-cta-full.webp"
          alt="A close-up portrait lit by a warm beam of light"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </picture>
      <div className="absolute inset-0 -z-[5] bg-[linear-gradient(90deg,rgba(8,12,9,.62)_0%,rgba(8,12,9,.28)_36%,rgba(8,12,9,.04)_72%,rgba(8,12,9,.12)_100%)]" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8d39a]">A starting point, not a diagnosis</p>
          <h2 className="mt-4 max-w-lg font-display text-4xl font-medium leading-[.96] tracking-[-.045em] text-white sm:text-6xl">
            Ready when you are.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/75 sm:text-base">
            Start a private consultation in your language. It begins only when you choose.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#dcebbf] pl-6 pr-2 text-sm font-semibold text-[#0f150a] transition hover:bg-white"
            >
              <span>Start a consultation</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f150a] text-[#dcebbf] transition group-hover:translate-x-0.5">
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
            <a href="#medical-info" className="inline-flex min-h-12 items-center rounded-full border border-white/35 px-5 text-sm font-medium text-white transition hover:bg-white/10">
              Learn more
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
