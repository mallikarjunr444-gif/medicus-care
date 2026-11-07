import { Quote } from 'lucide-react'

/** Big-stat band + statement block, echoing the Neuro Pulse editorial rhythm. */
export function StatBand() {
  return (
    <section className="bg-[#F6F5EF] py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B8F3E]">By the numbers</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-6xl font-medium tracking-tight text-[#0F150A] sm:text-7xl">24</span>
            <span className="font-display text-6xl font-medium tracking-tight text-[#9BC24A] sm:text-7xl">/7</span>
          </div>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#5C6B62]">
            Always available. Two AI care assistants, three languages, and one conversation at a time.
          </p>
        </div>

        <blockquote className="rounded-3xl border border-[#DDE5D4] bg-white p-6 shadow-[0_10px_30px_rgba(15,21,10,.05)] sm:p-8">
          <Quote size={26} className="text-[#9BC24A]" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-medium leading-snug tracking-tight text-[#0F150A] sm:text-2xl">
            A calmer path to understanding your health — one conversation at a time.
          </p>
          <footer className="mt-4 text-xs font-medium text-[#68766E]">The Medicus Care design principle</footer>
        </blockquote>
      </div>
    </section>
  )
}
