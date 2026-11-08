'use client'

interface SiteNavProps {
  /** Current view id; the matching link is marked as the current page. */
  view: string
  /** Links shown on the home page (anchors on the same page). */
  homeLinks: { href: string; label: string }[]
  /** Links shown inside the app (switch views). */
  appLinks: { id: string; label: string }[]
  onNavigate: (id: string) => void
  onStart: () => void
}

/** A thin, translucent bar that stays out of the way: brand left, links centred, one action right. */
export function SiteNav({ view, homeLinks, appLinks, onNavigate, onStart }: SiteNavProps) {
  const isHome = view === 'home'
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
          aria-label="MediCare home"
        >
          <span className="block text-[21px] font-semibold leading-none tracking-[-0.045em] text-[#1d1d1f]">MediCare</span>
        </button>

        <nav aria-label={isHome ? 'On this page' : 'Sections'} className="hidden items-center gap-1 lg:flex">
          {isHome
            ? [...homeLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1.5 text-[13px] text-[#1d1d1f]/80 transition-colors hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
                >
                  {link.label}
                </a>
              )),
              <button
                key="my-care"
                type="button"
                onClick={() => onNavigate('patient')}
                className="rounded-full px-3 py-1.5 text-[13px] text-[#1d1d1f]/80 transition-colors hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
              >
                My care
              </button>]
            : appLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onNavigate(link.id)}
                  aria-current={view === link.id ? 'page' : undefined}
                  className={`rounded-full px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30 ${
                    view === link.id ? 'font-semibold text-[#1d1d1f]' : 'text-[#1d1d1f]/70 hover:text-[#1d1d1f]'
                  }`}
                >
                  {link.label}
                </button>
              ))}
        </nav>

        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#0071e3] px-4 text-[13px] font-normal text-white transition-colors hover:bg-[#0077ed] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
        >
          Talk to a doctor
        </button>
      </div>
    </header>
  )
}
