import type { ReactNode } from 'react'

export interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

interface LegalPageProps {
  title: string
  summary: string
  updated: string
  sections: LegalSection[]
}

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL

/** Shared shell for long-form policy pages: quiet header, readable column, contents list. */
export function LegalPage({ title, summary, updated, sections }: LegalPageProps) {
  return (
    <div className="min-h-[100dvh] bg-white text-[#1d1d1f]">
      <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
          <a href="/" className="rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30" aria-label="MediCare home">
            <span className="block text-[21px] font-semibold leading-none tracking-[-0.045em]">MediCare</span>
          </a>
          <nav aria-label="Legal" className="flex items-center gap-1 text-[13px]">
            <a href="/terms" className="rounded-full px-3 py-1.5 text-[#1d1d1f]/80 hover:text-[#1d1d1f]">Terms</a>
            <a href="/privacy" className="rounded-full px-3 py-1.5 text-[#1d1d1f]/80 hover:text-[#1d1d1f]">Privacy</a>
            <a href="/" className="ml-1 inline-flex h-8 items-center rounded-full bg-[#0071e3] px-4 text-white hover:bg-[#0077ed]">Home</a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="bg-[#f5f5f7] px-5 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <div className="mx-auto max-w-[760px]">
            <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[56px]">{title}</h1>
            <p className="mt-5 max-w-[620px] text-[19px] leading-[1.45] text-[#6e6e73] sm:text-[21px]">{summary}</p>
            <p className="mt-6 text-[13px] text-[#6e6e73]">Last updated {updated}</p>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1080px] gap-12 px-5 py-14 sm:py-20 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-20 space-y-2.5 text-[13px]">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-[#6e6e73] hover:text-[#1d1d1f]">{s.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="max-w-[720px] space-y-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-20">
                <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">{s.title}</h2>
                <div className="mt-4 space-y-4 text-[17px] leading-[1.6] text-[#1d1d1f]/90 [&_a]:text-[#0071e3] [&_a:hover]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                  {s.body}
                </div>
              </section>
            ))}
            <section id="contact" className="scroll-mt-20 rounded-[28px] bg-[#f5f5f7] p-7 sm:p-9">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em]">Questions</h2>
              <p className="mt-3 text-[17px] leading-[1.6] text-[#6e6e73]">
                {CONTACT ? (
                  <>Write to <a className="text-[#0071e3] hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will reply as soon as we can.</>
                ) : (
                  <>Reach Medicus Labs through the contact details published on this site and we will reply as soon as we can.</>
                )}
              </p>
            </section>
          </article>
        </div>
      </main>

      <footer className="bg-[#f5f5f7] text-[#6e6e73]">
        <div className="mx-auto max-w-[1080px] px-5 py-8 text-[12px] leading-[1.6]">
          <p>MediCare is an AI health assistant. It is not a licensed physician and is not for emergencies. In an emergency, call 112.</p>
          <p className="mt-4 border-t border-[#d2d2d7] pt-4">Copyright © {new Date().getFullYear()} Medicus Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
