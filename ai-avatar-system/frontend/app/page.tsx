'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { AvatarUpload } from '@/components/AvatarUpload'
import { AvatarList } from '@/components/AvatarList'
import { ConnectionStatus } from '@/components/ui/ConnectionStatus'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { useStore } from '@/store/useStore'
import type { DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
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
  ArrowUpRight,
} from 'lucide-react'

// Heavy components load on demand
const DoctorVideoCall = dynamic(
  () => import('@/components/doctor/DoctorVideoCall').then((m) => m.DoctorVideoCall),
  { ssr: false, loading: () => <PanelLoader label="Initializing 3D Telemedicine Consultation Suite…" /> }
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
    <div className="flex flex-col items-center justify-center py-28 text-slate-400 text-sm bg-slate-950">
      <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-4" />
      <span>{label}</span>
    </div>
  )
}

const MEDICARE_FEATURES = [
  {
    icon: Stethoscope,
    title: 'Photorealistic 3D Human Doctors',
    description: 'Interact with Dr. Smit or Dr. Ananya in a live WebGL 3D video-consultation room with natural gestures and expressions.',
    color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    glow: 'rgba(56,189,248,0.25)',
  },
  {
    icon: AudioWaveform,
    title: 'Real-Time Speech & Lip-Sync',
    description: 'Speech recognition paired with viseme mouth animation, voice activity detection, and instant interruption recovery.',
    color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    glow: 'rgba(99,102,241,0.25)',
  },
  {
    icon: Languages,
    title: 'Multilingual Consultations',
    description: 'Full voice and text support in English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी) for natural regional healthcare access.',
    color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    glow: 'rgba(16,185,129,0.25)',
  },
  {
    icon: ShieldAlert,
    title: '4-Tier Medical Safety Engine',
    description: 'Deterministic clinical triage screening from Level 1 General Education to Level 4 Emergency with 112 escalation.',
    color: 'bg-red-500/10 text-red-400 border border-red-500/20',
    glow: 'rgba(239,68,68,0.25)',
  },
  {
    icon: FileCheck,
    title: 'Medical Document Intelligence',
    description: 'Upload blood tests, CBC, lipid profiles, and thyroid panels with automated test extraction and physician explanation.',
    color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    glow: 'rgba(245,158,11,0.25)',
  },
  {
    icon: Brain,
    title: 'Mental Wellness & Guidance',
    description: 'Empathetic stress management, guided breathing exercises, and supportive wellness triage.',
    color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    glow: 'rgba(168,85,247,0.25)',
  },
]

const STATS = [
  { value: '2', label: 'Selectable 3D Doctors' },
  { value: '3+', label: 'Languages (EN, KN, HI)' },
  { value: '<250ms', label: 'Interactive Voice Latency' },
  { value: 'Level 1-4', label: 'Clinical Safety Engine' },
]

type View = 'home' | 'consultation' | 'avatars' | 'chat' | 'voice' | 'history' | 'settings' | 'admin'

export default function Home() {
  const { isAuthenticated, user, setAuth, clearAuth } = useStore()
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorId>('dr_arjun')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null)
  const [view, setView] = useState<View>('home')

  // Auto-initialize direct patient session (no login barrier)
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
    { id: 'consultation', icon: HeartPulse, label: '3D Consultation', badge: 'Phase 2' },
    { id: 'avatars', icon: Camera, label: 'Avatar Studio' },
    { id: 'voice', icon: Mic2, label: 'Voice' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'admin', icon: Database, label: 'Admin Console', badge: 'RAG' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800">
        <div className="h-full mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div
            onClick={() => setView('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
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
              <span className="text-[11px] text-slate-400 block leading-tight">Your AI Doctor • Sub-Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
            {navItems.map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                  view === id
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                Direct Access Active
              </span>
              <a
                href="https://medicuslabs.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
                title="Go to Medicus Labs Main Platform"
              >
                <span>Medicus Labs Main</span>
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
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center min-h-[calc(90vh-4rem)] px-6 text-center overflow-hidden py-16">
              {/* Background Glow Orbs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl animate-float" />
                <div
                  className="absolute -top-16 -right-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-float"
                  style={{ animationDelay: '2s' }}
                />
                <div
                  className="absolute bottom-10 left-1/3 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl animate-float"
                  style={{ animationDelay: '4s' }}
                />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/60 mb-6 animate-slide-up shadow-lg">
                <Sparkles size={14} className="text-sky-400" />
                <span className="text-xs text-sky-300 font-semibold uppercase tracking-wider font-mono">
                  MediCare 1.0 • AI Digital Healthcare Platform
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-5 tracking-tight max-w-4xl text-white">
                Interactive Consultations with{' '}
                <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  Realistic 3D Human Doctors
                </span>
              </h1>

              <p className="max-w-2xl text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
                Connect face-to-face through real-time voice, webcam preview, and medical document
                analysis. Multilingual healthcare assistance in English, Kannada, and Hindi.
              </p>

              {/* 3D Doctor Selection Cards */}
              <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 text-left">
                {/* Doctor 1: Dr. Smit */}
                <div className="relative group p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 transition-all duration-300 shadow-xl backdrop-blur-md">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white text-lg font-bold shadow-md">
                        A
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Dr. Smit, M.D.</h3>
                        <p className="text-xs text-sky-400">AI General Physician</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                      3D Doctor
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Specialized in primary healthcare triage, symptom assessment, fever, respiratory
                    health, and preventative lifestyle guidance.
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Languages: EN • KN • HI
                    </span>
                    <button
                      onClick={() => handleStartDoctorConsultation('dr_arjun')}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md group-hover:translate-x-0.5"
                    >
                      <Video size={14} />
                      <span>Consult Dr. Smit</span>
                    </button>
                  </div>
                </div>

                {/* Doctor 2: Dr. Ananya */}
                <div className="relative group p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 shadow-xl backdrop-blur-md">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-700 flex items-center justify-center text-white text-lg font-bold shadow-md">
                        A
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Dr. Ananya, M.D.</h3>
                        <p className="text-xs text-indigo-400">General Physician & Wellness</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                      3D Doctor
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Specialized in diagnostic lab interpretation, metabolic health, emotional
                    wellbeing, guided breathing exercises, and lifestyle counselling.
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Languages: EN • KN • HI
                    </span>
                    <button
                      onClick={() => handleStartDoctorConsultation('dr_ananya')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md group-hover:translate-x-0.5"
                    >
                      <Video size={14} />
                      <span>Consult Dr. Ananya</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">{value}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Features Grid */}
            <section className="px-6 py-16 max-w-7xl mx-auto w-full">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                  Comprehensive Digital Healthcare Architecture
                </h2>
                <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
                  Built to the MediCare Product Requirements Specification, combining 3D WebGL
                  avatars, medical safety triage, and clinical intelligence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {MEDICARE_FEATURES.map(({ icon: Icon, title, description, color, glow }) => (
                  <div
                    key={title}
                    className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-300"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-base text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Mandatory Regulatory Disclaimer & Main Site Connection */}
            <footer className="mt-auto border-t border-slate-900 bg-slate-950 p-6 text-center text-xs text-slate-500 space-y-2">
              <p className="max-w-3xl mx-auto leading-relaxed">
                <span className="font-semibold text-slate-400">MediCare Notice:</span> MediCare
                is a specialized healthcare sub-platform of{' '}
                <a
                  href="https://medicuslabs.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline font-semibold"
                >
                  Medicus Labs™
                </a>{' '}
                designed for preliminary triage and health education. It is not an autonomous licensed doctor. Clinical diagnosis, prescriptions, and
                regulated services must remain under qualified medical professionals. In medical emergencies, dial 112 immediately.
              </p>
              <div className="flex items-center justify-center gap-4 text-slate-400 text-xs pt-1">
                <a
                  href="https://medicuslabs.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors flex items-center gap-1"
                >
                  <span>Medicus Labs Main Platform (medicuslabs.app)</span>
                  <ExternalLink size={12} />
                </a>
                <span>•</span>
                <span>Sub-Application Direct Access (No Login Required)</span>
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
                  className="px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-2 shadow-lg"
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
