import { ArrowRight } from 'lucide-react'

/** Full-bleed dark-olive closing banner with pill CTAs. */
export function CtaBanner({ onStart }: { onStart: () => void }) {
  return (
    <section className="bg-[#0F150A]">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight text-white sm:text-4xl">
            Ready when you are
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/70">
            Start a consultation in your language. It begins only when you choose.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#9BC24A] pl-6 pr-2 text-sm font-semibold text-[#0F150A] transition hover:brightness-105"
          >
            Start a consultation
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F150A] text-[#9BC24A] transition group-hover:translate-x-0.5">
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </button>
          <a
            href="#medical-info"
            className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Learn more
          </a>
        </div>
      </div>
    </section>
  )
}
