'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  CalendarDays,
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
import { SiteNav } from '@/components/site/SiteNav'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { ClosingCta, DoctorTiles, Faq, FeatureTiles, Hero, HowItWorks, Safety, SiteFooter } from '@/components/site/HomeSections'
import { CompareDoctors, HighlightChips, HighlightsGallery, LanguageViewer, LocalNav } from '@/components/site/ProductSections'
import { PatientDashboard } from '@/components/patient/PatientDashboard'
import { PatientNotesPanel } from '@/components/patient/PatientNotesPanel'
import { AppointmentWorkspace } from '@/components/patient/AppointmentWorkspace'
import { SpecialistBookingModal, type AppointmentRequestResult } from '@/components/doctor/SpecialistBookingModal'
import type { DoctorId } from '@/lib/doctorTypes'
import { useStore } from '@/store/useStore'

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

function PanelLoader({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-[#d2d2d7] bg-white/80 text-sm text-[#6e6e73] shadow-[0_8px_30px_-18px_rgba(15,76,61,.38)]">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#d2d2d7] border-t-[#0f6257]" />
      <span className="font-medium">{label}…</span>
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
    <div className={`min-h-screen overflow-x-clip bg-white text-[#1d1d1f] ${showMobileNavigation ? 'pb-20 lg:pb-0' : ''}`}>
      {view !== 'consultation' && (
        <SiteNav
          view={view}
          homeLinks={[
            { href: '#doctor-selection', label: 'Doctors' },
            { href: '#how-it-works', label: 'How it works' },
            { href: '#trust', label: 'Safety' },
            { href: '#faq', label: 'FAQ' },
          ]}
          appLinks={navItems.map(({ id, label }) => ({ id, label }))}
          onNavigate={(id) => navigate(id as View)}
          onStart={() => navigate('consultation')}
        />
      )}

      <main id="main-content" className={view === 'consultation' ? 'min-h-[100dvh]' : view === 'home' ? 'min-h-[calc(100dvh-3rem)]' : 'min-h-[calc(100dvh-3rem)] bg-[#f5f5f7]'}>
        {view === 'consultation' && (
          <div className="animate-fade-in">
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
          <>
            <LocalNav onStart={() => navigate('consultation')} />
            <ScrollProgress />
            <Hero onStart={() => navigate('consultation')} />
            <HighlightChips />
            <HighlightsGallery />
            <DoctorTiles onSelectDoctor={handleStartDoctorConsultation} />
            <LanguageViewer onStart={() => navigate('consultation')} />
            <FeatureTiles />
            <HowItWorks />
            <CompareDoctors onSelectDoctor={handleStartDoctorConsultation} />
            <Safety />
            <Faq />
            <ClosingCta onStart={() => navigate('consultation')} />
            <SiteFooter />
          </>
        )}

        {view === 'chat' && selectedAvatar && <PageFrame eyebrow="Conversation" title="Live conversation" description="Continue your text and voice session."><ChatInterface key={`${selectedAvatar}:${resumeSessionId ?? 'new'}`} avatarId={selectedAvatar} resumeSessionId={resumeSessionId ?? undefined} onSessionCreated={() => undefined} /></PageFrame>}
        {view === 'history' && <HistoryPanel onResume={handleResumeFromHistory} />}
        {view === 'settings' && <SettingsPanel />}
        {view === 'admin' && <div className="min-h-[calc(100dvh-3rem)] bg-[#f5f5f7]"><AdminKnowledgeDashboard /></div>}
      </main>

      {showMobileNavigation && (
        <>
          {mobileMenuOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 bg-[#1d1d1f]/15 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
          {mobileMenuOpen && (
            <nav aria-label="More navigation" className="fixed bottom-[calc(4.7rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-2xl border border-[#d2d2d7] bg-white p-2 shadow-[0_16px_50px_rgba(26,55,45,.18)] lg:hidden">
              <div className="grid grid-cols-2 gap-1">
                {mobileMoreItems.map(({ id, icon: Icon, label }) => (
                  <button key={id} type="button" onClick={() => navigate(id)} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium ${view === id ? 'bg-[#f5f5f7] text-[#0058b0]' : 'text-[#6e6e73] hover:bg-[#f5f5f7]'}`}>
                    <Icon size={17} aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>
            </nav>
          )}
          <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d2d2d7] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(33,64,52,.06)] backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-xl grid-cols-4 px-2 pt-1.5">
              {[
                { id: 'patient' as View, icon: UserRound, label: 'Patient' },
                { id: 'consultation' as View, icon: Stethoscope, label: 'Doctor' },
                { id: 'history' as View, icon: History, label: 'History' },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} type="button" onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined} className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${view === id ? 'text-[#0071e3]' : 'text-[#6e6e73]'}`}>
                  <Icon size={19} strokeWidth={view === id ? 2.4 : 1.8} aria-hidden="true" />{label}
                </button>
              ))}
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close more options' : 'Open more options'} className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${mobileMenuOpen ? 'text-[#0071e3]' : 'text-[#6e6e73]'}`}>
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

function PageFrame({ children, title, description }: Readonly<{ children: React.ReactNode; eyebrow?: string; title: string; description: string }>) {
  return (
    <section className="mx-auto min-h-[calc(100dvh-3rem)] max-w-[1080px] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-8 max-w-2xl sm:mb-12">
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1d1d1f] sm:text-[48px]">{title}</h1>
        <p className="mt-3 text-[19px] leading-[1.4] text-[#6e6e73]">{description}</p>
      </div>
      {children}
    </section>
  )
}
