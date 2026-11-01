'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  MessageSquare,
  Globe,
  Upload,
  Hand,
  Clock,
  ShieldAlert,
  FileText,
  Send,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Maximize2,
  Minimize2,
  PhoneCall,
  Activity,
  HeartPulse,
} from 'lucide-react'
import { DoctorCanvas3D } from './DoctorCanvas3D'
import { PatientWebcamPiP } from '../video/PatientWebcamPiP'
import { useDoctorSpeech } from './useDoctorSpeech'
import { ConsultationSummaryModal } from './ConsultationSummaryModal'
import { ReportUploadDrawer } from './ReportUploadDrawer'
import type {
  DoctorId,
  DoctorState,
  ConsultationLanguage,
  ConsultationSummaryData,
  MedicalReportItem,
  TriageLevel,
} from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'

interface ChatEntry {
  id: string
  role: 'patient' | 'doctor'
  text: string
  time: string
  triage?: TriageLevel
  warningSign?: string
}

interface DoctorVideoCallProps {
  initialDoctorId?: DoctorId
  onEndConsultation?: () => void
}

export function DoctorVideoCall({
  initialDoctorId = 'dr_arjun',
  onEndConsultation,
}: DoctorVideoCallProps) {
  // State
  const [doctorId, setDoctorId] = useState<DoctorId>(initialDoctorId)
  const [doctorState, setDoctorState] = useState<DoctorState>('idle')
  const [language, setLanguage] = useState<ConsultationLanguage>('en')
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [consultationSeconds, setConsultationSeconds] = useState(0)
  const [inputText, setInputText] = useState('')
  const [activeTriage, setActiveTriage] = useState<TriageLevel>(1)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false)
  const [summaryData, setSummaryData] = useState<ConsultationSummaryData | null>(null)
  const [reports, setReports] = useState<MedicalReportItem[]>([])

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const doctor = DOCTORS[doctorId]

  // Consultation Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setConsultationSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Doctor Speech Hook
  const {
    isSpeaking,
    audioLevel,
    isMuted,
    subtitles,
    speak,
    interrupt,
    toggleMute,
    setSubtitles,
  } = useDoctorSpeech({
    doctorId,
    language,
    onStateChange: (state) => setDoctorState(state),
  })

  // Chat conversation
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([
    {
      id: 'msg-init',
      role: 'doctor',
      text:
        language === 'kn'
          ? `ನಮಸ್ಕಾರ! ನಾನು ${doctor.name}, ನಿಮ್ಮ ಮೆಡಿಕಸ್ ಕೇರ್ AI ವೈದ್ಯ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.`
          : language === 'hi'
          ? `नमस्ते! मैं ${doctor.name}, आपका मेडिकस केयर AI डॉक्टर हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?`
          : `Hello, I'm ${doctor.name}, your Medicus Care AI Doctor. How are you feeling today? You can speak or type your symptoms freely.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatHistory])

  // Handle patient asking symptoms or typing message
  const handleSendMessage = useCallback(
    (customText?: string) => {
      const msg = (customText || inputText).trim()
      if (!msg) return

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const newPatientEntry: ChatEntry = {
        id: `patient-${Date.now()}`,
        role: 'patient',
        text: msg,
        time: timeStr,
      }

      setChatHistory((prev) => [...prev, newPatientEntry])
      setInputText('')
      setDoctorState('thinking')

      // Medical safety & symptom evaluation logic
      const lower = msg.toLowerCase()
      let doctorResponse = ''
      let triage: TriageLevel = 1
      let warning = ''

      // Emergency Detection (PRD Section 17)
      if (
        lower.includes('chest pain') ||
        lower.includes('heart attack') ||
        lower.includes('cannot breathe') ||
        lower.includes('stroke') ||
        lower.includes('unconscious') ||
        lower.includes('severe bleeding')
      ) {
        triage = 4
        warning = 'Potential Emergency Signs Detected: Immediate medical evaluation needed.'
        doctorResponse =
          language === 'kn'
            ? 'ಎಚ್ಚರಿಕೆ: ಇದು ಗಂಭೀರ ಲಕ್ಷಣವಾಗಿರಬಹುದು. ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ತುರ್ತು ಸೇವೆಗೆ 112 ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.'
            : language === 'hi'
            ? 'आपातकालीन चेतावनी: यह एक गंभीर लक्षण हो सकता है। कृपया तुरंत 112 पर कॉल करें या नजदीकी आपातकालीन केंद्र जाएं।'
            : 'EMERGENCY ALERT: These symptoms require immediate medical attention. Please call emergency services (112 in India) or go to the nearest emergency room immediately. Do not drive yourself.';
      } else if (
        lower.includes('fever') ||
        lower.includes('temperature') ||
        lower.includes('shivering')
      ) {
        triage = 2
        doctorResponse =
          language === 'kn'
            ? 'ಜ್ವರವು ಸೋಂಕು ಅಥವಾ ದೇಹದ ರಕ್ಷಣಾತ್ಮಕ ಕ್ರಿಯೆಯಾಗಿರಬಹುದು. ಇದು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ? ದಯವಿಟ್ಟು ತಾಪಮಾನವನ್ನು ಪರಿಶೀಲಿಸಿ, ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.'
            : language === 'hi'
            ? 'बुखार आमतौर पर किसी संक्रमण के कारण होता है। यह कितने दिनों से है? भरपूर पानी पिएं, आराम करें और यदि तापमान 102°F से अधिक है तो डॉक्टर से परामर्श लें।'
            : 'Fever is commonly an immune response to a viral or bacterial infection. How many days have you had this temperature? Stay well hydrated with fluids, get plenty of rest, and monitor for warning signs like difficulty breathing or persistent vomiting.';
      } else if (lower.includes('headache') || lower.includes('migraine')) {
        triage = 2
        doctorResponse =
          'Headaches can stem from tension, dehydration, eye strain, or sinus pressure. Are you experiencing any visual disturbances, neck stiffness, or nausea? Ensure you drink enough water and rest in a dim, quiet space.';
      } else if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('sleep')) {
        triage = 1
        doctorResponse =
          "I hear you, and it's completely valid to feel this way. Let's take a calm breath together. Inhale gently for 4 seconds, hold for 4 seconds, and exhale slowly for 4 seconds. What has been weighing most heavily on your mind?";
      } else {
        doctorResponse =
          language === 'kn'
            ? `ನಾನು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿದ್ದೇನೆ. ನೀವು ಯಾವಾಗ ಪ್ರಾರಂಭವಾದವು ಮತ್ತು ಯಾವುದೇ ಇತರ ತೊಂದರೆಗಳಿವೆಯೇ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.`
            : language === 'hi'
            ? `मैंने आपकी बात समझी। क्या आप बता सकते हैं कि यह लक्षण कब से हैं और क्या आपको कोई अन्य परेशानी भी हो रही है?`
            : `I understand your concern. Could you let me know how long you've noticed these symptoms, and whether you are taking any regular medications? This helps me provide more relevant general health information.`;
      }

      setActiveTriage(triage)

      // Simulate doctor answering after brief clinical processing
      setTimeout(() => {
        const doctorEntry: ChatEntry = {
          id: `doc-${Date.now()}`,
          role: 'doctor',
          text: doctorResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          triage,
          warningSign: warning || undefined,
        }
        setChatHistory((prev) => [...prev, doctorEntry])
        speak(doctorResponse)
      }, 700)
    },
    [inputText, language, speak]
  )

  // Quick Symptom Chips
  const quickTopics = [
    { label: '🌡️ Fever & Chills', query: 'I have had a mild fever and body aches for two days.' },
    { label: '🤕 Persistent Headache', query: 'I have a throbbing headache since morning.' },
    { label: '🫁 Sore Throat & Cough', query: 'I have a dry cough and painful swallowing.' },
    { label: '🧘 Anxiety & Stress', query: 'I am feeling overwhelmed and having trouble sleeping.' },
  ]

  // End consultation and generate structured summary
  const handleEndCall = () => {
    // Compile consultation summary per PRD Section 20
    const patientSymptoms = chatHistory
      .filter((m) => m.role === 'patient')
      .map((m) => m.text.slice(0, 80))

    const summary: ConsultationSummaryData = {
      id: `CONS-${Date.now()}`,
      consultationDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      doctorId,
      doctorName: doctor.formalTitle,
      language,
      languageLabel: doctor.languages.find((l) => l.code === language)?.label || 'English',
      durationFormatted: formatTimer(consultationSeconds),
      patientReportedSymptoms:
        patientSymptoms.length > 0 ? patientSymptoms : ['General preventive health inquiry'],
      symptomDuration: 'Patient reported symptoms within the last 48-72 hours',
      relevantHistory: 'No chronic cardiovascular or renal disease reported in current session',
      informationDiscussed: [
        'Preliminary symptom differentiation and common etiologies',
        'Home care hydration and rest guidance',
        'Warning symptoms requiring in-person assessment',
      ],
      triageLevel: activeTriage,
      triageTitle:
        activeTriage === 4
          ? 'Emergency Attention Required'
          : activeTriage === 3
          ? 'Urgent Professional Review Recommended'
          : activeTriage === 2
          ? 'Medical Assessment Recommended'
          : 'General Healthcare Guidance',
      warningSignsIdentified:
        activeTriage >= 2
          ? [
              'High or spiking fever unresponsive to rest',
              'Difficulty breathing, chest heaviness, or severe dehydration',
            ]
          : [],
      recommendedNextSteps: [
        'Schedule an evaluation with a certified registered physician for physical examination.',
        'Monitor temperature twice daily and maintain adequate fluid intake.',
        'If warning signs or worsening symptoms occur, seek urgent emergency healthcare immediately.',
      ],
      referralRecommendation:
        'Consultation with a general physician or clinical specialist is strongly recommended to obtain a formal diagnosis and prescription.',
      disclaimer:
        'Medicus Care is an AI healthcare digital assistant and is not an autonomous licensed doctor. No clinical diagnosis, prescription, or psychotherapy is provided. Regulated healthcare services must remain under qualified human medical practitioners.',
    }

    setSummaryData(summary)
    setIsSummaryModalOpen(true)
  }

  // Switch doctor identity
  const handleToggleDoctor = () => {
    const nextDoc: DoctorId = doctorId === 'dr_arjun' ? 'dr_ananya' : 'dr_arjun'
    setDoctorId(nextDoc)
    const nextDocObj = DOCTORS[nextDoc]
    const welcomeMsg = `Switched to ${nextDocObj.name}. How can I assist you today?`
    setChatHistory((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'doctor',
        text: welcomeMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    speak(welcomeMsg)
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ── Top Consultation Header ── */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <HeartPulse size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Medicus Care</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                Your AI Doctor
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Consulting with <span className="text-sky-300 font-semibold">{doctor.name}</span>
            </span>
          </div>
        </div>

        {/* Status Center */}
        <div className="flex items-center gap-4">
          {/* Live Call Duration */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock size={13} className="text-sky-400" />
            <span>{formatTimer(consultationSeconds)}</span>
          </div>

          {/* Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LiveKit WebRTC • HD</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <Globe size={13} className="text-slate-400 ml-1.5 mr-0.5" />
            {doctor.languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  language === l.code
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l.nativeName}
              </button>
            ))}
          </div>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-md ml-2"
          >
            <PhoneOff size={14} />
            <span>End Call</span>
          </button>
        </div>
      </header>

      {/* ── Main Area: 70% Video Area / 30% Chat Panel ── */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── 70% 3D Doctor Video Area ── */}
        <div
          className={`relative h-full transition-all duration-300 ${
            isChatVisible ? 'w-full md:w-[70%]' : 'w-full'
          }`}
        >
          {/* Three.js 3D Doctor Canvas */}
          <DoctorCanvas3D
            doctorId={doctorId}
            doctorState={doctorState}
            audioLevel={audioLevel}
            isMuted={isMuted}
            onStateChange={(st) => setDoctorState(st)}
            className="w-full h-full"
          />

          {/* Top-Right Floating Patient Webcam (PiP) */}
          <div className="absolute top-4 right-4 z-20">
            <PatientWebcamPiP
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              onToggleCamera={() => setIsCameraOn((prev) => !prev)}
              onToggleMic={() => setIsMicOn((prev) => !prev)}
            />
          </div>

          {/* Quick Doctor Identity Switcher Badge */}
          <div className="absolute top-16 left-4 z-20 flex items-center gap-2">
            <button
              onClick={handleToggleDoctor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md text-xs font-medium transition-all shadow-md group"
            >
              <RotateCcw size={12} className="text-sky-400 group-hover:rotate-180 transition-transform" />
              <span>Switch to {doctorId === 'dr_arjun' ? 'Dr. Ananya' : 'Dr. Arjun'}</span>
            </button>
          </div>

          {/* Real-time Subtitles / Live Transcript Bar (Bottom of Video Area) */}
          {subtitles && (
            <div className="absolute bottom-16 left-6 right-6 z-20 flex justify-center pointer-events-none">
              <div className="max-w-2xl px-4 py-2.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-center text-xs md:text-sm font-medium leading-relaxed shadow-2xl animate-fade-in">
                <span className="text-sky-400 font-semibold mr-1.5">{doctor.name}:</span>
                <span>{subtitles}</span>
              </div>
            </div>
          )}

          {/* Emergency Hotline Trigger (if Triage Level 4) */}
          {activeTriage === 4 && (
            <div className="absolute top-28 left-4 right-4 z-30 max-w-md mx-auto p-3.5 rounded-xl bg-red-600/90 border border-red-400 text-white shadow-2xl backdrop-blur-md animate-bounce">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={20} className="text-white" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      Emergency Signs Detected
                    </span>
                    <span className="text-xs">Call 112 Immediate Emergency Medical Services</span>
                  </div>
                </div>
                <a
                  href="tel:112"
                  className="px-3 py-1 rounded-lg bg-white text-red-700 font-bold text-xs flex items-center gap-1 shadow"
                >
                  <PhoneCall size={13} />
                  <span>Call 112</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── 30% Right-Side Telemedicine Chat & Clinical Panel ── */}
        {isChatVisible && (
          <aside className="w-full md:w-[30%] h-full border-l border-slate-800 bg-slate-900/95 flex flex-col z-20 flex-shrink-0 shadow-2xl backdrop-blur-md">
            {/* Sidebar Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-sky-400" />
                <span className="font-semibold text-xs text-white">Consultation Transcript</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReportDrawerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Upload size={12} />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Emergency / Safety Status Ribbon */}
            <div
              className={`p-2.5 px-4 text-[11px] font-medium border-b flex items-center justify-between ${
                activeTriage === 4
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : activeTriage === 3
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Activity size={13} className={activeTriage >= 3 ? 'text-amber-400' : 'text-sky-400'} />
                <span>
                  Safety Level {activeTriage}:{' '}
                  {activeTriage === 4
                    ? 'Emergency'
                    : activeTriage === 3
                    ? 'Urgent Review'
                    : activeTriage === 2
                    ? 'Assessment Advised'
                    : 'General Guidance'}
                </span>
              </div>
            </div>

            {/* Conversation Messages */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {chatHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col ${
                    item.role === 'patient' ? 'items-end' : 'items-start'
                  } animate-slide-up`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                    <span className="font-medium text-slate-400">
                      {item.role === 'patient' ? 'You' : doctor.name}
                    </span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>

                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                      item.role === 'patient'
                        ? 'bg-sky-600 text-white rounded-br-xs shadow-md'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs shadow-md'
                    }`}
                  >
                    {item.text}

                    {item.warningSign && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{item.warningSign}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {doctorState === 'thinking' && (
                <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                  <span className="text-[11px] font-mono text-slate-500 ml-1">
                    {doctor.name} is evaluating clinical guidance...
                  </span>
                </div>
              )}
            </div>

            {/* Quick Symptom Chips */}
            <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/40">
              <span className="block text-[10px] text-slate-500 uppercase font-mono mb-1.5">
                Quick Health Inquiries:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {quickTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(topic.query)}
                    className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-sky-900/60 text-slate-300 hover:text-sky-200 text-[10px] font-medium border border-slate-700 whitespace-nowrap transition-colors"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Speak or message ${doctor.name}...`}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom Call Control Bar ── */}
      <footer className="h-16 border-t border-slate-800 bg-slate-950 px-6 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Doctor Profile Pill */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-sky-400">
            {doctor.name.replace('Dr. ', '')[0]}
          </div>
          <div>
            <span className="block text-xs font-semibold text-white">{doctor.formalTitle}</span>
            <span className="text-[10px] text-slate-400">{doctor.specialty}</span>
          </div>
        </div>

        {/* Center: Main Call Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto">
          {/* Microphone */}
          <button
            onClick={() => setIsMicOn((prev) => !prev)}
            className={`p-3 rounded-2xl transition-all shadow-md ${
              isMicOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Camera */}
          <button
            onClick={() => setIsCameraOn((prev) => !prev)}
            className={`p-3 rounded-2xl transition-all shadow-md ${
              isCameraOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Doctor Speaker Volume */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-2xl transition-all shadow-md ${
              !isMuted
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
            title={isMuted ? 'Unmute Doctor Audio' : 'Mute Doctor Audio'}
          >
            {!isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Patient Interrupt Button (PRD Section 8) */}
          <button
            onClick={interrupt}
            className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-amber-600/80 text-amber-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-md"
            title="Interrupt doctor speech and return to listening"
          >
            <Hand size={16} />
            <span className="hidden md:inline">Interrupt</span>
          </button>

          {/* Upload Medical Report */}
          <button
            onClick={() => setIsReportDrawerOpen(true)}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-all shadow-md"
            title="Upload Medical Report"
          >
            <Upload size={18} />
          </button>

          {/* End Call / Summary */}
          <button
            onClick={handleEndCall}
            className="px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors ml-2"
          >
            <PhoneOff size={16} />
            <span>End & Summary</span>
          </button>
        </div>

        {/* Right: Toggle Chat Panel Visibility */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChatVisible((prev) => !prev)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isChatVisible
                ? 'bg-sky-600/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isChatVisible ? 'Hide Chat Sidebar' : 'Show Chat Sidebar'}
          >
            <MessageSquare size={16} />
          </button>
        </div>
      </footer>

      {/* ── Consultation Summary Modal ── */}
      <ConsultationSummaryModal
        summary={summaryData}
        isOpen={isSummaryModalOpen}
        onClose={() => {
          setIsSummaryModalOpen(false)
          if (onEndConsultation) onEndConsultation()
        }}
      />

      {/* ── Medical Report Upload Drawer ── */}
      <ReportUploadDrawer
        isOpen={isReportDrawerOpen}
        onClose={() => setIsReportDrawerOpen(false)}
        onReportAnalyzed={(rep) => {
          setReports((prev) => [...prev, rep])
          const repMsg = `I have uploaded my ${rep.fileName}. What does it show?`
          handleSendMessage(repMsg)
        }}
      />
    </div>
  )
}
