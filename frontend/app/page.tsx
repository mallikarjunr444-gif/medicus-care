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
import { CareHero } from '@/components/landing/CareHero'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { SpecialistBookingModal, type AppointmentRequestResult } from '@/components/doctor/SpecialistBookingModal'
import type { DoctorId } from '@/lib/doctorTypes'
import { useStore } from '@/store/useStore'
import MeadowRiseFooter from '@/components/ui/meadow-rise-footer'
import { MedicalInfoSection } from '@/components/interactive/MedicalInfoSection'
import { StatBand } from '@/components/landing/StatBand'
import { WhyRelySection } from '@/components/landing/WhyRelySection'
import { StepsSection } from '@/components/landing/StepsSection'
import { CtaBanner } from '@/components/landing/CtaBanner'
import { LiquidNavbar } from '@/components/ui/liquid-glass-navbar'

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
  { id: 'home', icon: HeartPulse, label: 'Home' },
  { id: 'consultation', icon: Stethoscope, label: 'Consultation' },
  { id: 'notes', icon: NotebookPen, label: 'Notes' },
  { id: 'appointments', icon: CalendarDays, label: 'Appointments' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'patient', icon: UserRound, label: 'Patient' },
  { id: 'admin', icon: ShieldCheck, label: 'Knowledge' },
  { id: 'settings', icon: Settings, label: 'Settings' },
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
    <div className={`min-h-screen overflow-x-clip bg-[#F6F5EF] text-[#0F150A] ${showMobileNavigation ? 'pb-20 lg:pb-0' : ''}`}>
      <header className={`${view === 'home' ? 'absolute inset-x-0 top-0 border-white/20 bg-transparent text-white' : 'sticky border-b border-[#e1e9e4] bg-white/90 text-[#183331] backdrop-blur-xl'} z-50 pt-[env(safe-area-inset-top)] ${view === 'consultation' ? 'hidden' : ''}`}>
        <div className="mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand Logo & Tag */}
          <button
            type="button"
            onClick={() => navigate('home')}
            className="group flex shrink-0 items-center gap-2.5 text-left focus:outline-none"
            aria-label="Medicus Labs Home"
          >
            {view === 'home' ? (
              <span className="font-display text-[1.65rem] font-medium leading-none tracking-[-0.06em] text-white sm:text-[1.8rem]">Medicus Care</span>
            ) : (
              <BrandLogo className="h-9 w-[128px] sm:w-[140px]" priority />
            )}
            <div className={`hidden border-l pl-2.5 xl:block ${view === 'home' ? 'border-white/35' : 'border-slate-200'}`}>
              <span className={`block text-xs font-semibold leading-tight tracking-tight ${view === 'home' ? 'text-white' : 'text-[#183331]'}`}>Medicus Labs</span>
              <span className={`mt-0.5 block text-[10px] leading-tight ${view === 'home' ? 'text-white/70' : 'text-[#657773]'}`}>Care &amp; AI Telemedicine</span>
            </div>
          </button>

          {/* Home uses the editorial landing navigation; app views keep the full workspace nav. */}
          {view === 'home' ? (
            <nav className="hidden items-center gap-7 text-xs font-medium text-white/80 lg:flex" aria-label="Landing page">
              <a className="transition-colors hover:text-white" href="#how-it-works">What&apos;s included</a>
              <a className="transition-colors hover:text-white" href="#doctor-selection">Health support</a>
              <a className="transition-colors hover:text-white" href="#trust">Safety &amp; privacy</a>
              <a className="transition-colors hover:text-white" href="#faq">FAQ</a>
            </nav>
          ) : (
            <div className="hidden lg:flex shrink-0">
              <LiquidNavbar
                items={navItems.map(({ id, icon: Icon, label }) => ({
                  label,
                  icon: (active: boolean) => <Icon size={14} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />,
                  fx: 'glow',
                  onClick: () => navigate(id),
                }))}
                active={Math.max(0, navItems.findIndex((item) => item.id === view))}
                onChange={(idx) => navigate(navItems[idx].id)}
                tone="light"
              />
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex shrink-0 items-center gap-2.5">
            {view === 'home' && <span className="hidden items-center gap-1.5 text-xs font-medium text-white/75 2xl:flex">Private, secure conversations</span>}
            {view !== 'consultation' && (
              <button
                type="button"
                onClick={() => navigate('consultation')}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold shadow-sm transition-all sm:text-sm ${view === 'home' ? 'bg-white text-[#11140d] hover:bg-[#dcebbf]' : 'bg-[#6B8F3E] text-white hover:bg-[#5f7d38]'}`}
              >
                <span>Talk to a doctor</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
            {view !== 'home' && <span className="flex items-center gap-1.5 rounded-full border border-[#dce8e2] bg-[#f5f9f6] px-2.5 py-1 text-[11px] font-medium text-[#45645d] sm:hidden"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Online</span>}
          </div>
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
            <CareHero onSelectDoctor={handleStartDoctorConsultation} />

            <WhyRelySection />

            <StatBand />

            <div id="doctor-selection"><DoctorShowcaseSection onSelectDoctor={handleStartDoctorConsultation} /></div>

            <MedicalInfoSection />

            <section className="border-y border-[#e1e9e4] bg-white">
              <div className="mx-auto grid max-w-7xl gap-6 px-4 py-9 sm:grid-cols-3 sm:px-6 sm:py-11">
                {[
                  { icon: ShieldCheck, title: 'Clear about AI', body: 'The doctor personas are AI assistants. They do not claim to be human clinicians.' },
                  { icon: Activity, title: 'Safety comes first', body: 'Emergency warning signs are routed to urgent care guidance.' },
                  { icon: Globe2, title: 'Made for conversation', body: 'Voice and text interactions support regional language choices.' },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6f1] text-[#6B8F3E]"><Icon size={18} aria-hidden="true" /></span>
                    <div><h3 className="text-sm font-semibold text-[#1b3a5c]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#4f6580]">{body}</p></div>
                  </div>
                ))}
              </div>
            </section>

            <StepsSection />

            <section id="trust" className="border-y border-[#e1e9e4] bg-white">
              <div className="section-y mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B8F3E]">Safety and privacy</p>
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
                      <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#6B8F3E]" aria-hidden="true" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="faq" className="section-y mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B8F3E]">FAQ</p>
                  <h2 className="mt-2 max-w-sm font-display text-3xl font-medium leading-tight tracking-tight text-[#11140d] sm:text-4xl">A few clear answers before you begin.</h2>
                </div>
                <div className="divide-y divide-[#dfe5dc] border-y border-[#dfe5dc]">
                  {[
                    ['Is this a consultation with a human doctor?', 'Medicus Care uses clearly identified AI care assistants for preliminary health information and guidance. It does not replace a qualified clinician.'],
                    ['What can I talk about?', 'You can share symptoms, reports, questions about wellbeing, or anything you want to understand before deciding on a next step.'],
                    ['Is my conversation private?', 'Guest consultations are kept separate from other users and your summary is saved only to your own session.'],
                    ['What should I do in an emergency?', 'Do not use Medicus Care for emergencies. Contact local emergency services immediately. In India, call 112.'],
                  ].map(([question, answer]) => (
                    <details key={question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-semibold text-[#11140d] marker:hidden">
                        {question}
                        <span className="text-xl font-normal text-[#6B8F3E] transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="max-w-2xl pt-3 pr-10 text-sm leading-6 text-[#68756c]">{answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <CtaBanner onStart={() => navigate('consultation')} />

            <MeadowRiseFooter
              name="Medicus Labs"
              brandHref="/"
              heading={"Care begins when you feel\n*heard with Medicus.*"}
              subheading="Speak naturally with our photorealistic AI doctors in Kannada, English, or Hindi."
              cta={{ label: "Start Free Consultation", href: "#doctor-selection" }}
              tagline="Empowering patients with real-time AI clinical intelligence and compassionate healthcare guidance."
              preset="meadow"
              columns={[
                {
                  title: "Consultation",
                  links: [
                    { label: "Dr. Smit (General Physician)", href: "#doctor-selection" },
                    { label: "Dr. Ananya (Wellness & Diagnostics)", href: "#doctor-selection" },
                    { label: "Triage & Symptoms", href: "#doctor-selection" },
                  ],
                },
                {
                  title: "Patient Care",
                  links: [
                    { label: "Consultation History", href: "#" },
                    { label: "Clinical Notes", href: "#" },
                    { label: "Specialist Referrals", href: "#" },
                  ],
                },
                {
                  title: "Trust & Safety",
                  links: [
                    { label: "Clinical Safety Protocol", href: "#" },
                    { label: "Emergency Guidance (112)", href: "tel:112" },
                    { label: "Privacy Policy", href: "#" },
                  ],
                },
              ]}
              legal={[
                { label: "Medical Disclaimer", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Consultation", href: "#" },
              ]}
            />
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
                <button key={id} type="button" onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined} className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${view === id ? 'text-[#6B8F3E]' : 'text-[#71817b]'}`}>
                  <Icon size={19} strokeWidth={view === id ? 2.4 : 1.8} aria-hidden="true" />{label}
                </button>
              ))}
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close more options' : 'Open more options'} className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${mobileMenuOpen ? 'text-[#6B8F3E]' : 'text-[#71817b]'}`}>
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B8F3E]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1c3c36] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#687b74]">{description}</p>
      </div>
      {children}
    </section>
  )
}
