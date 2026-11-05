'use client'

import {
  ArrowRight,
  History,
  CalendarDays,
  FileText,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react'

type PatientDestination = 'consultation' | 'history' | 'notes' | 'appointments'

interface PatientDashboardProps {
  displayName: string
  isGuest: boolean
  onNavigate: (destination: PatientDestination) => void
}

const careActions: {
  destination: PatientDestination
  icon: typeof Stethoscope
  title: string
  description: string
  action: string
}[] = [
  {
    destination: 'consultation',
    icon: Stethoscope,
    title: 'Talk with a doctor',
    description: 'Choose Dr. Smit or Dr. Ananya and start a private health conversation.',
    action: 'Start a consultation',
  },
  {
    destination: 'history',
    icon: History,
    title: 'Conversation history',
    description: 'Return to a previous care conversation or review its summary.',
    action: 'View history',
  },
  {
    destination: 'notes',
    icon: FileText,
    title: 'Personal health notes',
    description: 'Keep questions and reminders in this browser for your next clinician conversation.',
    action: 'Open notes',
  },
  {
    destination: 'appointments',
    icon: CalendarDays,
    title: 'Specialist appointments',
    description: 'Review the request process and contact a specialist from the available directory.',
    action: 'Explore appointments',
  },
]

export function PatientDashboard({ displayName, isGuest, onNavigate }: PatientDashboardProps) {
  const firstName = displayName.trim().split(/\s+/)[0] || 'Patient'
  const initials = firstName.slice(0, 1).toUpperCase()

  return (
    <section className="mx-auto min-h-[calc(100dvh-4.25rem)] max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="grid gap-4 lg:grid-cols-[1.45fr_.75fr]">
        <div className="rounded-[1.75rem] bg-[#1b3a5c] p-6 text-white sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dce6f2]">Medicus Labs · Patient portal</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
            Your care, in one place.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#dce6f2] sm:text-base">
            Start a conversation or pick up where you left off.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('consultation')}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#4f6580] transition hover:bg-[#e6f0fd] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            Talk to a doctor <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-[1.75rem] border border-[#dce6f2] bg-white p-6 shadow-[0_4px_20px_rgba(34,71,56,.04)] sm:p-7">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f6580]">Your profile</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#1b3a5c]">Welcome, {firstName}</h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f0fd] text-[#0b63ce]">
                <UserRound size={21} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f6f9f7] p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4fc] text-sm font-semibold text-[#4f6580]">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#4f6580]">{displayName}</p>
                <p className="mt-0.5 text-xs text-[#4f6580]">{isGuest ? 'Guest patient' : 'Patient account'}</p>
              </div>
              <span className="ml-auto h-2 w-2 rounded-full bg-[#4f6580]" aria-label="Profile active" />
            </div>
          </div>
          <p className="mt-5 text-xs leading-5 text-[#4f6580]">
            Your conversations are associated with this profile. You can manage your preferences in Settings.
          </p>
        </div>
      </div>

      <div className="mt-9 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b63ce]">Your care</p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#12304f]">What would you like to do?</h2>
        </div>
        <p className="mt-1 text-sm text-[#4f6580]">Choose a next step whenever you’re ready.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {careActions.map(({ destination, icon: Icon, title, description, action }) => (
          <button
            key={destination}
            type="button"
            onClick={() => onNavigate(destination)}
            className="group flex min-h-56 flex-col rounded-2xl border border-[#dce6f2] bg-white p-5 text-left shadow-[0_2px_8px_rgba(34,71,56,.03)] transition hover:-translate-y-0.5 hover:border-[#a9c6ee] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a9c9f2]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f1fd] text-[#0b63ce] transition group-hover:bg-[#0a56b8] group-hover:text-white">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="mt-4 text-base font-semibold text-[#1b3a5c]">{title}</span>
            <span className="mt-1.5 text-sm leading-6 text-[#4f6580]">{description}</span>
            <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-[#0b63ce]">
              {action}<ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#eef4fc] bg-[#eef4fc] p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b63ce]">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#1b3a5c]">A thoughtful place to start</h3>
          <p className="mt-1 text-sm leading-6 text-[#4f6580]">
            MediCare offers AI health information and preliminary guidance. It does not replace a qualified clinician or emergency care.
          </p>
        </div>
      </div>
    </section>
  )
}
