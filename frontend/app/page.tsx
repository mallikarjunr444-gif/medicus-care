'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AvatarUpload } from '@/components/AvatarUpload'
import { AvatarList } from '@/components/AvatarList'
import { ConnectionStatus } from '@/components/ui/ConnectionStatus'
import { CursorGlow } from '@/components/interactive/CursorGlow'
import { MagneticButton } from '@/components/interactive/MagneticButton'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { useStore } from '@/store/useStore'
import type { DoctorId } from '@/lib/doctorTypes'
import {
  HeartPulse,
  Video,
  Camera,
  MessageCircle,
  Mic2,
  Sparkles,
  Zap,
  Globe,
  Shield,
  Play,
  ChevronRight,
  Activity,
  Brain,
  AudioWaveform,
  History,
  Settings,
  Stethoscope,
  FileCheck,
  Languages,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Database,
  ExternalLink,
  Layers,
  Dna,
} from 'lucide-react'

// Dynamic imports for 3D and interactive components
const Hero3DScene = dynamic(
  () => import('@/components/3d/Hero3DScene').then((m) => m.Hero3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[580px] lg:h-[680px] rounded-3xl glass-panel flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-4" />
        <span className="text-sm font-mono text-sky-300">Initializing WebGL 3D Holographic Core…</span>
      </div>
    ),
  }
)

const AnatomyViewer3D = dynamic(
  () => import('@/components/3d/AnatomyViewer3D').then((m) => m.AnatomyViewer3D),
  {
    ssr: false,
    loading: () => <PanelLoader label="Loading 3D Anatomical Organ Systems…" />,
  }
)

const DoctorShowcaseSection = dynamic(
  () => import('@/components/interactive/DoctorShowcaseSection').then((m) => m.DoctorShowcaseSection),
  {
    ssr: false,
    loading: () => <PanelLoader label="Loading 3D Doctor Studio…" />,
  }
)

const TriageSimulator = dynamic(
  () => import('@/components/interactive/TriageSimulator').then((m) => m.TriageSimulator),
  {
    ssr: false,
    loading: () => <PanelLoader label="Loading Triage Simulator…" />,
  }
)

const LabReportScanner3D = dynamic(
  () => import('@/components/interactive/LabReportScanner3D').then((m) => m.LabReportScanner3D),
  {
    ssr: false,
    loading: () => <PanelLoader label="Loading Medical Document Intelligence Scanner…" />,
  }
)

const MedicalSafetyRadar = dynamic(
  () => import('@/components/interactive/MedicalSafetyRadar').then((m) => m.MedicalSafetyRadar),
  {
    ssr: false,
    loading: () => <PanelLoader label="Loading 4-Tier Safety Architecture…" />,
  }
)

const DoctorVideoCall = dynamic(
  () => import('@/components/doctor/DoctorVideoCall').then((m) => m.DoctorVideoCall),
  {
    ssr: false,
    loading: () => <PanelLoader label="Initializing 3D Telemedicine Consultation Suite…" />,
  }
)

const ChatInterface = dynamic(
  () => import('@/components/ChatInterface').then((m) => m.ChatInterface),
  { ssr: false, loading: () => <PanelLoader label="Connecting…" /> }
)

const VoicePanel = dynamic(
  () => import('@/components/VoicePanel').then((m) => m.VoicePanel),
  { ssr: false, loading: () => <PanelLoader label="Loading voice studio…" /> }
)

const HistoryPanel = dynamic(
  () => import('@/components/HistoryPanel').then((m) => m.HistoryPanel),
  { ssr: false, loading: () => <PanelLoader label="Loading history…" /> }
)

const SettingsPanel = dynamic(
  () => import('@/components/SettingsPanel').then((m) => m.SettingsPanel),
  { ssr: false, loading: () => <PanelLoader label="Loading settings…" /> }
)

const AdminKnowledgeDashboard = dynamic(
  () => import('@/components/admin/AdminKnowledgeDashboard').then((m) => m.AdminKnowledgeDashboard),
  { ssr: false, loading: () => <PanelLoader label="Loading Knowledge & Safety Console…" /> }
)

function PanelLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm bg-slate-950">
      <div className="w-9 h-9 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-3" />
      <span className="font-mono text-xs">{label}</span>
    </div>
  )
}

const MEDICARE_FEATURES = [
  {
    icon: Stethoscope,
    title: 'Photorealistic 3D Human Doctors',
    description:
      'Interact with Dr. Arjun or Dr. Ananya in a live WebGL 3D video-consultation room with natural gestures, micro-expressions, and viseme lip-sync.',
    color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  },
  {
    icon: AudioWaveform,
    title: 'Real-Time Speech & Lip-Sync',
    description:
      'Speech recognition paired with phoneme kinematics, voice activity detection, and instant interruption recovery within <250ms.',
    color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  },
  {
    icon: Languages,
    title: 'Multilingual Consultations',
    description:
      'Full voice and text support in English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी) for natural regional healthcare access across India.',
    color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  {
    icon: ShieldAlert,
    title: '4-Tier Medical Safety Engine',
    description:
      'Deterministic clinical triage screening from Level 1 General Education to Level 4 Emergency with immediate 112 escalation.',
    color: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
  {
    icon: FileCheck,
    title: 'Medical Document Intelligence',
    description:
      'Upload blood tests, CBC, lipid profiles, and thyroid panels with automated test extraction and physician explanation.',
    color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  {
    icon: Brain,
    title: 'Mental Wellness & Guidance',
    description:
      'Empathetic stress management, guided breathing exercises, and supportive wellness triage for whole-body physiological equilibrium.',
    color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  },
]

const STATS = [
  { value: '2', label: 'Selectable 3D Doctors' },
  { value: '3+', label: 'Languages (EN, KN, HI)' },
  { value: '<250ms', label: 'Interactive Voice Latency' },
  { value: 'Level 1-4', label: 'Clinical Safety Engine' },
  { value: '60 FPS', label: 'WebGL 3D Rendering' },
]

type View = 'home' | 'consultation' | 'avatars' | 'chat' | 'voice' | 'history' | 'settings' | 'admin'

export default function Home() {
  const { isAuthenticated, setAuth } = useStore()
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorId>('dr_arjun')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null)
  const [view, setView] = useState<View>('home')

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

  const handleStartDoctorConsultation = (docId: DoctorId) => {
    setSelectedDoctor(docId)
    setView('consultation')
  }

  const handleVoiceSelect = async (voiceId: string) => {
    if (!selectedAvatar) {
      toast('Select an avatar first to assign this voice', { icon: '💡' })
      return
    }
    try {
      await api.setAvatarVoice(selectedAvatar, voiceId)
      toast.success('Voice assigned to avatar', { icon: '🎙️' })
    } catch {
      toast.error('Failed to assign voice')
    }
  }

  const handleSelectAvatar = (id: string) => {
    setSelectedAvatar(id)
    setResumeSessionId(null)
  }

  const handleStartChat = () => {
    if (selectedAvatar) {
      setResumeSessionId(null)
      setView('chat')
    }
  }

  const handleResumeFromHistory = (avatarId: string, sessionId: string) => {
    setSelectedAvatar(avatarId)
    setResumeSessionId(sessionId)
    setView('chat')
  }

  const navItems: { id: View; icon: typeof HeartPulse; label: string; badge?: string }[] = [
    { id: 'home', icon: Sparkles, label: 'Home' },
    { id: 'consultation', icon: HeartPulse, label: '3D Consultation', badge: '3D' },
    { id: 'avatars', icon: Camera, label: 'Avatar Studio' },
    { id: 'voice', icon: Mic2, label: 'Voice' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'admin', icon: Database, label: 'Admin Console', badge: 'RAG' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-white">
      {/* Dynamic Ambient Cursor Glow */}
      <CursorGlow />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 shadow-md">
        <div className="h-full mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div
            onClick={() => setView('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 transition-transform group-hover:scale-105">
              <HeartPulse size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center">
                  Medi<span className="text-sky-400">Care</span>
                </span>
                <a
                  href="https://medicuslabs.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-semibold hover:border-sky-500 transition-colors flex items-center gap-1"
                  title="Visit Medicus Labs Main Platform"
                >
                  <span>Medicus Labs™</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <span className="text-[11px] text-slate-400 block leading-tight">
                Your AI Doctor • 3D Telemedicine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-x-auto">
            {navItems.map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                  view === id
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={14} className={view === id ? 'text-white' : 'text-sky-400'} />
                <span>{label}</span>
                {badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-sky-400/20 text-sky-300 font-mono">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 hidden sm:flex items-center gap-1.5 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                3D Live Ready
              </span>
              <a
                href="https://medicuslabs.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
                title="Go to Medicus Labs Main Platform"
              >
                <span>Medicus Labs</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16 flex-1 flex flex-col">
        {/* ── 3D CONSULTATION VIEW (Flagship Telemedicine Video-Call) ── */}
        {view === 'consultation' && (
          <div className="w-full h-full flex-1 animate-fade-in">
            <DoctorVideoCall
              initialDoctorId={selectedDoctor}
              onEndConsultation={() => setView('home')}
            />
          </div>
        )}

        {/* ── HOME VIEW ── */}
        {view === 'home' && (
          <div className="animate-fade-in flex flex-col">
            {/* ── HERO SECTION: Interactive 3D Holographic Core & Telemedicine Suite ── */}
            <section className="relative px-6 pt-12 pb-16 max-w-7xl mx-auto w-full">
              {/* Background Glow Accents */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

              <div className="flex flex-col items-center text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill mb-5 shadow-lg">
                  <Sparkles size={14} className="text-sky-400 animate-spin" />
                  <span className="text-xs text-sky-300 font-semibold uppercase tracking-wider font-mono">
                    Next-Gen 3D Interactive Telemedicine & Clinical Diagnostics
                  </span>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-5 tracking-tight max-w-5xl text-white">
                  Interactive Healthcare with{' '}
                  <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                    Realistic 3D Human Doctors
                  </span>
                </h1>

                <p className="max-w-2xl text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
                  Real-time face-to-face consultations with Dr. Arjun and Dr. Ananya. WebGL 3D
                  speech kinematics, multilingual diagnosis in English, Kannada, and Hindi, and
                  automated clinical lab report intelligence.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                  <MagneticButton
                    onClick={() => handleStartDoctorConsultation('dr_arjun')}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center gap-2 transition-transform"
                  >
                    <Video size={17} />
                    <span>Consult Dr. Arjun (General Physician)</span>
                    <ChevronRight size={16} />
                  </MagneticButton>

                  <MagneticButton
                    onClick={() => handleStartDoctorConsultation('dr_ananya')}
                    className="px-6 py-3.5 rounded-2xl glass-pill text-white font-bold text-sm shadow-xl hover:bg-slate-800/80 flex items-center gap-2 transition-transform"
                  >
                    <HeartPulse size={17} className="text-indigo-400" />
                    <span>Consult Dr. Ananya (Labs & Wellness)</span>
                  </MagneticButton>
                </div>
              </div>

              {/* ── 3D Interactive WebGL Scene Component Mount ── */}
              <div className="w-full mb-12">
                <Hero3DScene onSelectDoctor={handleStartDoctorConsultation} />
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {STATS.map(({ value, label }) => (
                  <div
                    key={label}
                    className="glass-card p-4 rounded-2xl border border-slate-800/80 text-center hover:border-sky-500/30 transition-colors"
                  >
                    <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400 font-mono">
                      {value}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECTION 2: GSAP Scroll Pinned 3D Doctor Studio Showcase ── */}
            <DoctorShowcaseSection onSelectDoctor={handleStartDoctorConsultation} />

            {/* ── SECTION 3: Interactive 3D Anatomy & Organ Explorer ── */}
            <section className="border-t border-slate-900 bg-slate-950/70">
              <AnatomyViewer3D />
            </section>

            {/* ── SECTION 4: Interactive 4-Tier Medical Safety Simulator ── */}
            <section className="border-t border-slate-900 bg-slate-950">
              <TriageSimulator onStartConsultation={handleStartDoctorConsultation} />
            </section>

            {/* ── SECTION 5: Holographic Lab Document Scanner ── */}
            <section className="border-t border-slate-900 bg-slate-950/70">
              <LabReportScanner3D />
            </section>

            {/* ── SECTION 6: Medical Safety Radar & Architecture ── */}
            <section className="border-t border-slate-900 bg-slate-950">
              <MedicalSafetyRadar />
            </section>

            {/* ── SECTION 7: Comprehensive Architecture & Features Grid ── */}
            <section className="px-6 py-20 max-w-7xl mx-auto w-full border-t border-slate-900">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-3">
                  <Layers size={13} className="text-sky-400" />
                  <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
                    Full Platform Capabilities
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                  Integrated Digital Healthcare Suite
                </h2>
                <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
                  Built to the MediCare specification, combining 3D WebGL avatars, clinical safety
                  triage, OCR lab extraction, and multilingual speech.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {MEDICARE_FEATURES.map(({ icon: Icon, title, description, color }) => (
                  <div
                    key={title}
                    className="p-6 rounded-2xl glass-card border border-slate-800/80 hover:border-sky-500/40 transition-all duration-300 group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 transition-transform group-hover:scale-105`}
                    >
                      <Icon size={22} />
                    </div>
                    <h3 className="font-bold text-base text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Mandatory Regulatory Disclaimer & Platform Footer ── */}
            <footer className="mt-auto border-t border-slate-900 bg-slate-950 p-8 text-center text-xs text-slate-500 space-y-3">
              <p className="max-w-3xl mx-auto leading-relaxed">
                <span className="font-semibold text-slate-400">MediCare Notice:</span> MediCare is
                a specialized healthcare sub-platform of{' '}
                <a
                  href="https://medicuslabs.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline font-semibold"
                >
                  Medicus Labs™
                </a>{' '}
                designed for preliminary triage and health education. It is not an autonomous
                licensed physician. Clinical diagnosis, prescriptions, and regulated services must
                remain under qualified medical professionals. In medical emergencies, dial 112
                immediately.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-xs pt-1">
                <a
                  href="https://medicuslabs.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors flex items-center gap-1 font-semibold"
                >
                  <span>Medicus Labs Main Platform (medicuslabs.app)</span>
                  <ExternalLink size={12} />
                </a>
                <span>•</span>
                <span>Direct Access Active (No Barrier)</span>
                <span>•</span>
                <span>Three.js WebGL & GSAP Engine</span>
              </div>
            </footer>
          </div>
        )}

        {/* ── AVATARS STUDIO VIEW ── */}
        {view === 'avatars' && (
          <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2">Avatar Studio</h1>
              <p className="text-slate-400 text-sm">
                Custom avatar models and GLB configurations for MediCare.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AvatarUpload />
              <AvatarList selectedAvatar={selectedAvatar} onSelectAvatar={handleSelectAvatar} />
            </div>
            {selectedAvatar && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleStartChat}
                  className="px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                >
                  <MessageCircle size={18} />
                  <span>Start Conversation with Selected Avatar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── VOICE STUDIO VIEW ── */}
        {view === 'voice' && (
          <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2">Voice Studio</h1>
              <p className="text-slate-400 text-sm">
                Configure doctor voices and regional language models.
              </p>
            </div>
            <VoicePanel onVoiceSelect={handleVoiceSelect} />
          </div>
        )}

        {/* ── CHAT VIEW ── */}
        {view === 'chat' && selectedAvatar && (
          <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in w-full">
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-white mb-2">Live Conversation</h1>
              <p className="text-slate-400 text-sm">Text & voice session with custom avatar.</p>
            </div>
            <ChatInterface
              key={`${selectedAvatar}:${resumeSessionId ?? 'new'}`}
              avatarId={selectedAvatar}
              resumeSessionId={resumeSessionId ?? undefined}
              onSessionCreated={setActiveSessionId}
            />
          </div>
        )}

        {/* ── HISTORY VIEW ── */}
        {view === 'history' && (
          <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in w-full">
            <HistoryPanel onResume={handleResumeFromHistory} />
          </div>
        )}

        {/* ── SETTINGS VIEW ── */}
        {view === 'settings' && (
          <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in w-full">
            <SettingsPanel />
          </div>
        )}

        {/* ── ADMIN KNOWLEDGE & SAFETY CONSOLE VIEW ── */}
        {view === 'admin' && (
          <div className="w-full flex-1 animate-fade-in">
            <AdminKnowledgeDashboard />
          </div>
        )}
      </main>
    </div>
  )
}
