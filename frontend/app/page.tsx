'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Globe2,
  HeartPulse,
  History,
  MoreHorizontal,
  NotebookPen,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react'
import { PatientDashboard } from '@/components/patient/PatientDashboard'
import { PatientNotesPanel } from '@/components/patient/PatientNotesPanel'
import { AppointmentWorkspace } from '@/components/patient/AppointmentWorkspace'
import { PatientLandingHero } from '@/components/interactive/PatientLandingHero'
import { SpecialistBookingModal, type AppointmentRequestResult } from '@/components/doctor/SpecialistBookingModal'
import type { DoctorId } from '@/lib/doctorTypes'
import { useStore } from '@/store/useStore'
import { Reveal } from '@/components/ui/reveal'

const DoctorShowcaseSection = dynamic(
  () => import('@/components/interactive/DoctorShowcaseSection').then((m) => m.DoctorShowcaseSection),
  { ssr: false, loading: () => <PanelLoader label="Preparing doctor profiles" /> },
)
const DoctorVideoCall = dynamic(
  () => import('@/components/doctor/DoctorVideoCall').then((m) => m.DoctorVideoCall),
  { ssr: false, loading: () => <PanelLoader label="Preparing your consultation" /> },
)
const ChatInterface = dynamic(
  () => import('@/components/ChatInterface').then((m) => m.ChatInterface),
  { ssr: false, loading: () => <PanelLoader label="Connecting" /> },
)
const HistoryPanel = dynamic(
  () => import('@/components/HistoryPanel').then((m) => m.HistoryPanel),
  { ssr: false, loading: () => <PanelLoader label="Loading your history" /> },
)
const SettingsPanel = dynamic(
  () => import('@/components/SettingsPanel').then((m) => m.SettingsPanel),
  { ssr: false, loading: () => <PanelLoader label="Loading settings" /> },
)
const AdminKnowledgeDashboard = dynamic(
  () => import('@/components/admin/AdminKnowledgeDashboard').then((m) => m.AdminKnowledgeDashboard),
  { ssr: false, loading: () => <PanelLoader label="Loading knowledge console" /> },
)

function PanelLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-700" />
      <span>{label}…</span>
    </div>
  )
}

type View = 'home' | 'patient' | 'consultation' | 'chat' | 'notes' | 'appointments' | 'history' | 'settings' | 'admin'

const navItems: { id: View; icon: typeof HeartPulse; label: string }[] = [
  { id: 'patient', icon: UserRound, label: 'Patient' },
  { id: 'home', icon: HeartPulse, label: 'Home' },
  { id: 'consultation', icon: Stethoscope, label: 'Consultation' },
  { id: 'notes', icon: NotebookPen, label: 'Notes' },
  { id: 'appointments', icon: CalendarDays, label: 'Appointments' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'admin', icon: ShieldCheck, label: 'Knowledge' },
]

const mobileMoreItems = navItems.filter(({ id }) => ['home', 'notes', 'appointments', 'settings', 'admin'].includes(id))

export default function Home() {
  const { isAuthenticated, setAuth, user } = useStore()
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorId>('dr_arjun')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null)
  const [view, setView] = useState<View>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
  const [latestAppointmentRequest, setLatestAppointmentRequest] = useState<AppointmentRequestResult | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      setAuth('patient-direct-token', {
        id: 'patient-direct',
        email: 'patient@medicare.app',
        username: 'Patient User',
        full_name: 'Patient User',
        is_guest: true,
      })
    }
  }, [isAuthenticated, setAuth])

  const navigate = (next: View) => {
    setView(next)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStartDoctorConsultation = (doctorId: DoctorId) => {
    setSelectedDoctor(doctorId)
    navigate('consultation')
  }

  const handleResumeFromHistory = (avatarId: string, sessionId: string) => {
    setSelectedAvatar(avatarId)
    setResumeSessionId(sessionId)
    navigate('chat')
  }

  const showMobileNavigation = view !== 'consultation'

  return (
    <div className={`min-h-screen overflow-x-clip bg-[#f5f8f6] text-[#183331] ${showMobileNavigation ? 'pb-20 lg:pb-0' : ''}`}>
      <header className={`sticky top-0 z-50 border-b border-[#e1e9e4] bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl ${view === 'consultation' ? 'hidden' : ''}`}>
        <div className="mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => navigate('home')} className="group flex min-w-0 items-center gap-2.5 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0f6257] text-white shadow-sm transition-transform group-hover:-rotate-3">
              <HeartPulse size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-5 tracking-[-0.04em] text-[#183331]">Medicus Labs</span>
              <span className="hidden text-[11px] leading-4 text-[#657773] sm:block">MediCare · Care, clarity, conversation</span>
            </span>
          </button>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
                {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-[13px] font-medium transition-colors ${view === id ? 'bg-[#e8f3ef] text-[#0e6257]' : 'text-[#60736e] hover:bg-[#f1f6f3] hover:text-[#183331]'}`}
              >
                <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span className="hidden items-center gap-1.5 text-xs text-[#5f726e] xl:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Private, secure conversations
            </span>
            {view !== 'consultation' && (
              <button type="button" onClick={() => navigate('consultation')} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f6257] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b5149]">
                Talk to a doctor <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          <span className="flex items-center gap-1.5 rounded-full border border-[#dce8e2] bg-[#f5f9f6] px-2.5 py-1.5 text-[11px] font-medium text-[#45645d] sm:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online care
          </span>
        </div>
      </header>

      <main id="main-content" className={view === 'consultation' ? 'min-h-[100dvh]' : 'min-h-[calc(100dvh-4.25rem)]'}>
        {view === 'consultation' && (
          <div className="min-h-[calc(100dvh-4.25rem)] animate-fade-in">
            <DoctorVideoCall
              initialDoctorId={selectedDoctor}
              onEndConsultation={() => navigate('home')}
              onOpenPatient={() => navigate('patient')}
            />
          </div>
        )}

        {view === 'patient' && (
          <PatientDashboard
            displayName={user?.full_name || user?.username || 'Patient'}
            isGuest={Boolean(user?.is_guest)}
            onNavigate={navigate}
          />
        )}

        {view === 'notes' && <PatientNotesPanel />}

        {view === 'appointments' && (
          <AppointmentWorkspace
            onRequestAppointment={() => setAppointmentDialogOpen(true)}
            latestRequest={latestAppointmentRequest}
          />
        )}

        {view === 'home' && (
          <div className="animate-fade-in">
            <PatientLandingHero onSelectDoctor={handleStartDoctorConsultation} />

            <DoctorShowcaseSection onSelectDoctor={handleStartDoctorConsultation} />

            <section className="border-y border-[#e1e9e4] bg-white">
              <div className="mx-auto grid max-w-7xl gap-6 px-4 py-9 sm:grid-cols-3 sm:px-6 sm:py-11">
                {[
                  { icon: ShieldCheck, title: 'Clear about AI', body: 'The doctor personas are AI assistants. They do not claim to be human clinicians.' },
                  { icon: Activity, title: 'Safety comes first', body: 'Emergency warning signs are routed to urgent care guidance.' },
                  { icon: Globe2, title: 'Made for conversation', body: 'Voice and text interactions support regional language choices.' },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6f1] text-[#0f7565]"><Icon size={18} aria-hidden="true" /></span>
                    <div><h3 className="text-sm font-semibold text-[#1b3a5c]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#4f6580]">{body}</p></div>
                  </div>
                ))}
              </div>
            </section>

            <section id="how-it-works" className="section-y mx-auto max-w-7xl px-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f7565]">How it works</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1c3c36] sm:text-3xl">Three steps to a consultation</h2>
              <Reveal className="mt-8"><ol className="grid gap-4 md:grid-cols-3">
                {[
                  { n: '1', title: 'Pick a doctor and language', body: 'Choose Dr. Smit or Dr. Ananya, then Kannada, English or Hindi. Other languages appear in the language list when available.' },
                  { n: '2', title: 'Describe how you feel', body: 'Speak with your microphone or type. The doctor listens, asks one question at a time and remembers what you already said.' },
                  { n: '3', title: 'Review your summary', body: 'When you end the call you get a consultation summary with triage guidance, saved to your session.' },
                ].map((step) => (
                  <li key={step.n} className="rounded-2xl border border-[#e1e9e4] bg-white p-6 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f6257] text-sm font-semibold text-white" aria-hidden="true">{step.n}</span>
                    <h3 className="mt-4 text-base font-semibold text-[#25423b]">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#687b74]">{step.body}</p>
                  </li>
                ))}
              </ol></Reveal>
            </section>

            <section id="trust" className="border-y border-[#e1e9e4] bg-white">
              <div className="section-y mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f7565]">Safety and privacy</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1c3c36] sm:text-3xl">Honest about what this is</h2>
                  <p className="mt-3 text-sm leading-6 text-[#687b74]">MediCare gives health information and preliminary guidance. It does not diagnose, prescribe, or replace a qualified clinician.</p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {[
                    'The doctors are AI assistants and say so.',
                    'Emergency warning signs point you to urgent care. In India, call 112.',
                    'Guest consultations are kept separate from other users.',
                    'Your consultation summary is saved only to your own session.',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 rounded-xl border border-[#e1e9e4] bg-[#f7faf8] p-4 text-sm leading-5 text-[#36564d]">
                      <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0f7565]" aria-hidden="true" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
              <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-[#123f3a] p-7 text-white sm:flex-row sm:items-center sm:p-10">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready when you are</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#d1e6df]">Start a consultation in your language. It begins only when you choose.</p>
                </div>
                <button type="button" onClick={() => navigate('consultation')} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#124b43] transition hover:bg-[#eaf4ef]">
                  Talk to a doctor <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </section>

            <footer className="border-t border-[#e1e9e4] bg-white px-4 py-10 sm:px-6">
              <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                  <p className="flex items-center gap-2 text-base font-bold text-[#183331]"><HeartPulse size={18} className="text-[#0f7565]" aria-hidden="true" /> MediCare</p>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-[#71817b]">AI health information and preliminary triage guidance, not medical diagnosis or prescriptions. For urgent or life-threatening symptoms, call your local emergency number. In India, call 112.</p>
                </div>
                <nav aria-label="Footer product links">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#71817b]">Product</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#36564d]">
                    <li><button type="button" onClick={() => navigate('consultation')} className="hover:text-[#0f7565]">Talk to a doctor</button></li>
                    <li><button type="button" onClick={() => navigate('appointments')} className="hover:text-[#0f7565]">Appointments</button></li>
                    <li><button type="button" onClick={() => navigate('history')} className="hover:text-[#0f7565]">History</button></li>
                  </ul>
                </nav>
                <nav aria-label="Footer account links">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#71817b]">Account</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#36564d]">
                    <li><button type="button" onClick={() => navigate('settings')} className="hover:text-[#0f7565]">Settings</button></li>
                    <li><a href="#trust" className="hover:text-[#0f7565]">Safety and privacy</a></li>
                  </ul>
                </nav>
              </div>
              <p className="mx-auto mt-8 max-w-7xl border-t border-[#e1e9e4] pt-5 text-[11px] font-medium text-[#71817b]">© {new Date().getFullYear()} Medicus Care</p>
            </footer>
          </div>
        )}

        {view === 'chat' && selectedAvatar && <PageFrame eyebrow="Conversation" title="Live conversation" description="Continue your text and voice session."><ChatInterface key={`${selectedAvatar}:${resumeSessionId ?? 'new'}`} avatarId={selectedAvatar} resumeSessionId={resumeSessionId ?? undefined} onSessionCreated={() => undefined} /></PageFrame>}
        {view === 'history' && <PageFrame eyebrow="Your care" title="Conversation history" description="Return to a previous conversation."><HistoryPanel onResume={handleResumeFromHistory} /></PageFrame>}
        {view === 'settings' && <PageFrame eyebrow="Preferences" title="Settings" description="Manage your account and app preferences."><SettingsPanel /></PageFrame>}
        {view === 'admin' && <div className="min-h-[calc(100dvh-4.25rem)] bg-[#f5f8f6]"><AdminKnowledgeDashboard /></div>}
      </main>

      {showMobileNavigation && (
        <>
          {mobileMenuOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 bg-[#183331]/15 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
          {mobileMenuOpen && (
            <nav aria-label="More navigation" className="fixed bottom-[calc(4.7rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-2xl border border-[#dfe8e2] bg-white p-2 shadow-[0_16px_50px_rgba(26,55,45,.18)] lg:hidden">
              <div className="grid grid-cols-2 gap-1">
                {mobileMoreItems.map(({ id, icon: Icon, label }) => (
                  <button key={id} type="button" onClick={() => navigate(id)} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium ${view === id ? 'bg-[#e8f3ef] text-[#0e6257]' : 'text-[#60736e] hover:bg-[#f5f8f6]'}`}>
                    <Icon size={17} aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>
            </nav>
          )}
          <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe8e2] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(33,64,52,.06)] backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-xl grid-cols-4 px-2 pt-1.5">
              {[
                { id: 'patient' as View, icon: UserRound, label: 'Patient' },
                { id: 'consultation' as View, icon: Stethoscope, label: 'Doctor' },
                { id: 'history' as View, icon: History, label: 'History' },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} type="button" onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined} className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${view === id ? 'text-[#0f7565]' : 'text-[#71817b]'}`}>
                  <Icon size={19} strokeWidth={view === id ? 2.4 : 1.8} aria-hidden="true" />{label}
                </button>
              ))}
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close more options' : 'Open more options'} className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${mobileMenuOpen ? 'text-[#0f7565]' : 'text-[#71817b]'}`}>
                {mobileMenuOpen ? <X size={19} aria-hidden="true" /> : <MoreHorizontal size={19} aria-hidden="true" />}More
              </button>
            </div>
          </nav>
        </>
      )}

      <SpecialistBookingModal
        isOpen={appointmentDialogOpen}
        onClose={() => setAppointmentDialogOpen(false)}
        onAppointmentBooked={(request) => setLatestAppointmentRequest(request)}
      />
    </div>
  )
}

function PageFrame({ children, eyebrow, title, description }: { children: React.ReactNode; eyebrow: string; title: string; description: string }) {
  return (
    <section className="mx-auto min-h-[calc(100dvh-4.25rem)] max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-7 max-w-2xl sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f7565]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1c3c36] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#687b74]">{description}</p>
      </div>
      {children}
    </section>
  )
}
