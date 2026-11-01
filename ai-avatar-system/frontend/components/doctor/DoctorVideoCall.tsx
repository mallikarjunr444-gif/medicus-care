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
  Brain,
  Stethoscope,
  Calendar,
  Building,
  MapPin,
  Wind,
  CheckCircle2,
  Share2,
  Download,
} from 'lucide-react'
import { DoctorPhotorealisticViewport } from './DoctorPhotorealisticViewport'
import { PatientWebcamPiP } from '../video/PatientWebcamPiP'
import { useDoctorSpeech } from './useDoctorSpeech'
import { ConsultationSummaryModal } from './ConsultationSummaryModal'
import { ReportUploadDrawer } from './ReportUploadDrawer'
import { SpecialistBookingModal, VERIFIED_SPECIALISTS_LOCAL, type Specialist } from './SpecialistBookingModal'
import type {
  DoctorId,
  DoctorState,
  ConsultationLanguage,
  ConsultationSummaryData,
  MedicalReportItem,
  TriageLevel,
} from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { toast } from 'react-hot-toast'

interface ActionCardData {
  type: 'specialist_recommendation' | 'appointment_confirmation' | 'breathing_exercise' | 'report_analysis'
  payload: any
}

interface ChatEntry {
  id: string
  role: 'patient' | 'doctor'
  text: string
  time: string
  triage?: TriageLevel
  warningSign?: string
  actionCard?: ActionCardData
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
  const [isMicOn, setIsMicOn] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [consultationSeconds, setConsultationSeconds] = useState(0)
  const [inputText, setInputText] = useState('')
  const [activeTriage, setActiveTriage] = useState<TriageLevel>(1)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false)
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false)
  const [summaryData, setSummaryData] = useState<ConsultationSummaryData | null>(null)
  const [reports, setReports] = useState<MedicalReportItem[]>([])

  // Speech Recognition state
  const [isListeningSpeech, setIsListeningSpeech] = useState(false)
  const recognitionRef = useRef<any>(null)

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
          ? `ನಮಸ್ಕಾರ! ನಾನು ${doctor.name}, ನಿಮ್ಮ ಮೆಡಿಕೇರ್ (MediCare) AI ವೈದ್ಯ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.`
          : language === 'hi'
          ? `नमस्ते! मैं ${doctor.name}, आपका मेडिकेयर (MediCare) AI डॉक्टर हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?`
          : `Hello! I'm ${doctor.name}, your MediCare AI Doctor. How are you feeling today? You can speak naturally or type your symptoms freely.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatHistory])

  // Speech Recognition Initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'

      recognition.onstart = () => {
        setIsListeningSpeech(true)
        setDoctorState('listening')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setIsListeningSpeech(false)
        if (transcript) {
          handleSendMessage(transcript)
        }
      }

      recognition.onerror = () => {
        setIsListeningSpeech(false)
        setDoctorState('idle')
      }

      recognition.onend = () => {
        setIsListeningSpeech(false)
      }

      recognitionRef.current = recognition
    }
  }, [language])

  const toggleMicListening = () => {
    if (isListeningSpeech) {
      recognitionRef.current?.stop()
      setIsListeningSpeech(false)
      setDoctorState('idle')
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
        recognitionRef.current.start()
      } else {
        toast('Speech recognition not supported in this browser. Please type your message.', { icon: '🎙️' })
      }
    }
  }

  // Automatic Language Detection (Unicode script heuristics)
  const detectInputLanguage = (text: string): ConsultationLanguage | null => {
    const kannadaCount = (text.match(/[\u0C80-\u0CFF]/g) || []).length
    const hindiCount = (text.match(/[\u0900-\u097F]/g) || []).length
    if (kannadaCount > 3) return 'kn'
    if (hindiCount > 3) return 'hi'
    return null
  }

  // Handle patient asking symptoms or typing message
  const handleSendMessage = useCallback(
    async (customText?: string) => {
      const msg = (customText || inputText).trim()
      if (!msg) return

      // Check auto language detection
      const detectedLang = detectInputLanguage(msg)
      let activeLang = language
      if (detectedLang && detectedLang !== language) {
        activeLang = detectedLang
        setLanguage(detectedLang)
        toast.success(`Language auto-detected: ${detectedLang === 'kn' ? 'ಕನ್ನಡ (Kannada)' : 'हिन्दी (Hindi)'}`, { icon: '🌐' })
      }

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

      const lower = msg.toLowerCase()
      let doctorResponse = ''
      let triage: TriageLevel = 1
      let warning = ''
      let actionCard: ActionCardData | undefined = undefined

      // 1. Emergency Detection (PRD Section 17 & Localized to Chikkamagaluru, Karnataka, India)
      if (
        lower.includes('chest pain') ||
        lower.includes('heart attack') ||
        lower.includes('cannot breathe') ||
        lower.includes('stroke') ||
        lower.includes('unconscious') ||
        lower.includes('severe bleeding') ||
        lower.includes('suicid') ||
        lower.includes('kill myself')
      ) {
        triage = 4
        warning = 'Potential Emergency Signs Detected: Immediate medical evaluation needed.'
        doctorResponse =
          activeLang === 'kn'
            ? 'ತುರ್ತು ಎಚ್ಚರಿಕೆ: ಇದು ಗಂಭೀರವಾದ ತುರ್ತು ಲಕ್ಷಣವಾಗಿರಬಹುದು. ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ 112 ಅಥವಾ 108 (ಆರೋಗ್ಯ ಕವಚ) ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಚಿಕ್ಕಮಗಳೂರು ಜಿಲ್ಲಾಸ್ಪತ್ರೆಗೆ ತಕ್ಷಣ ಭೇಟಿ ನೀಡಿ.'
            : activeLang === 'hi'
            ? 'आपातकालीन चेतावनी: यह एक गंभीर लक्षण हो सकता है। कृपया तुरंत 112 या 108 पर कॉल करें या नजदीकी आपातकालीन केंद्र जाएं।'
            : 'EMERGENCY ALERT: These symptoms require immediate medical intervention. Please call emergency services (112 in India, 108 Ambulance) or visit District Hospital Chikkamagaluru immediately. Do not drive yourself.';
      }

      // 2. Controlled Agent Tool Action: Specialist Search & Doctor Referral (Chikkamagaluru / Karnataka)
      else if (
        lower.includes('find doctor') ||
        lower.includes('specialist') ||
        lower.includes('referral') ||
        lower.includes('cardiologist') ||
        lower.includes('hospital in chikkamagaluru') ||
        lower.includes('pulmonologist') ||
        lower.includes('psychiatrist')
      ) {
        triage = 2
        doctorResponse =
          activeLang === 'kn'
            ? 'ಖಂಡಿತ, ಚಿಕ್ಕಮಗಳೂರು ಮತ್ತು ಕರ್ನಾಟಕದ ಪರಿಶೀಲಿಸಿದ ತಜ್ಞ ವೈದ್ಯರ ಪಟ್ಟಿ ಇಲ್ಲಿದೆ. ನೀವು ನೇರವಾಗಿ ಭೇಟಿ ಅಥವಾ ಟೆಲಿಮೆಡಿಸಿನ್ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿಸಬಹುದು.'
            : 'I have retrieved verified specialist doctors in Chikkamagaluru and the regional Karnataka healthcare network for your evaluation. You can review their hospital and request an appointment below.'
        actionCard = {
          type: 'specialist_recommendation',
          payload: { specialists: VERIFIED_SPECIALISTS_LOCAL.slice(0, 3) },
        }
      }

      // 3. Controlled Agent Tool Action: Appointment Booking Intent
      else if (
        lower.includes('book appointment') ||
        lower.includes('schedule visit') ||
        lower.includes('book visit') ||
        lower.includes('appointment')
      ) {
        triage = 1
        doctorResponse =
          activeLang === 'kn'
            ? 'ಖಂಡಿತ! ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲು ನಾನು ವಿಂಡೋ ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ದಿನಾಂಕ ಮತ್ತು ಸಮಯವನ್ನು ದೃಢೀಕರಿಸಿ.'
            : 'Certainly! I am opening the appointment scheduling window. Please choose your preferred specialist and confirm the consultation slot.'
        setIsSpecialistModalOpen(true)
      }

      // 4. Controlled Agent Tool Action: Medical Report Analysis
      else if (
        lower.includes('report') ||
        lower.includes('blood test') ||
        lower.includes('cbc') ||
        lower.includes('hba1c') ||
        lower.includes('sugar') ||
        lower.includes('thyroid')
      ) {
        triage = 2
        doctorResponse =
          activeLang === 'kn'
            ? 'ಖಂಡಿತ! ನಿಮ್ಮ ರಕ್ತ ತಪಾಸಣೆ ಅಥವಾ ಪ್ರಯೋಗಾಲಯದ ವರದಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಾನು ಸಾಮಾನ್ಯ ಶ್ರೇಣಿಗಳನ್ನು ವಿವರಿಸುತ್ತೇನೆ.'
            : 'I can assist in interpreting your laboratory values. Please upload your test PDF or image in the report drawer to inspect reference intervals.'
        setIsReportDrawerOpen(true)
      }

      // 5. Mental Wellness & Breathing Guidance Mode (Dr. Ananya / Anxiety)
      else if (
        lower.includes('stress') ||
        lower.includes('anxiety') ||
        lower.includes('sleep') ||
        lower.includes('breathe') ||
        lower.includes('panic') ||
        lower.includes('overwhelmed')
      ) {
        triage = 1
        doctorResponse =
          activeLang === 'kn'
            ? 'ನಿಮ್ಮ ಆತಂಕವನ್ನು ನಾನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬಲ್ಲೆ. ಬನ್ನಿ, ಒಟ್ಟಿಗೆ 4-4-4 ಬಾಕ್ಸ್ ಉಸಿರಾಟದ ವ್ಯಾಯಾಮ ಮಾಡೋಣ. 4 ಸೆಕೆಂಡುಗಳ ಕಾಲ ದೀರ್ಘವಾಗಿ ಉಸಿರನ್ನು ಒಳಗೆ ತೆಗೆದುಕೊಳ್ಳಿ, 4 ಸೆಕೆಂಡ್ ನಿಲ್ಲಿಸಿ, ನಂತರ ನಿಧಾನವಾಗಿ ಹೊರಬಿಡಿ.'
            : "I hear you, and it is completely understandable to feel overwhelmed. Let's do a gentle 4-4-4 Box Breathing exercise together to reset your nervous system. Follow the visual breathing pacing card below."
        actionCard = {
          type: 'breathing_exercise',
          payload: { cycles: 4, inhale: 4, hold: 4, exhale: 4 },
        }
      }

      // 6. Common Symptoms: Fever, Cough, Headache
      else if (lower.includes('fever') || lower.includes('temperature') || lower.includes('shivering')) {
        triage = 2
        doctorResponse =
          activeLang === 'kn'
            ? 'ಜ್ವರವು ಸಾಮಾನ್ಯವಾಗಿ ಸೋಂಕಿನ ವಿರುದ್ಧ ದೇಹದ ನೈಸರ್ಗಿಕ ರಕ್ಷಣಾತ್ಮಕ ಪ್ರತಿಕ್ರಿಯೆಯಾಗಿದೆ. ಇದು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ? ದಯವಿಟ್ಟು ಸಾಕಷ್ಟು ನೀರು ಮತ್ತು ಎಳನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.'
            : 'Fever is commonly an immune response to a viral or bacterial infection. How many days have you noticed this temperature? Stay well hydrated with fluids, get plenty of rest, and monitor for warning signs like chest heaviness or persistent vomiting.';
      } else if (lower.includes('headache') || lower.includes('migraine')) {
        triage = 2
        doctorResponse =
          'Headaches often stem from tension, dehydration, eye strain, or sleep deprivation. Are you experiencing any visual disturbances, nausea, or neck stiffness? Please drink 500ml of water and rest in a dim, quiet room.';
      } else {
        // General clinical intake interview follow-up
        doctorResponse =
          activeLang === 'kn'
            ? `ನಾನು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿದ್ದೇನೆ. ಈ ಸಮಸ್ಯೆ ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ ಮತ್ತು ನೀವು ಪ್ರಸ್ತುತ ಯಾವುದೇ ನಿಯಮಿತ ಔಷಧಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?`
            : `I understand. Could you let me know how long you've noticed these symptoms, and whether they worsen at specific times of the day? This helps me provide more relevant general health education.`;
      }

      setActiveTriage(triage)

      // Simulate doctor answering after clinical processing
      setTimeout(() => {
        const doctorEntry: ChatEntry = {
          id: `doc-${Date.now()}`,
          role: 'doctor',
          text: doctorResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          triage,
          warningSign: warning || undefined,
          actionCard,
        }
        setChatHistory((prev) => [...prev, doctorEntry])
        speak(doctorResponse)
      }, 700)
    },
    [inputText, language, speak]
  )

  // Switch doctor identity (General Physician vs Mental Wellness Companion)
  const handleToggleDoctor = () => {
    const nextDoc: DoctorId = doctorId === 'dr_arjun' ? 'dr_ananya' : 'dr_arjun'
    setDoctorId(nextDoc)
    const nextDocObj = DOCTORS[nextDoc]
    const welcomeMsg =
      nextDoc === 'dr_ananya'
        ? `Switched to ${nextDocObj.name}, your AI Mental Wellness & Counseling Companion. I am here to listen empathetically, assist with everyday stress, and guide calming breathing exercises. How are you feeling emotionally today?`
        : `Switched to ${nextDocObj.name}, your AI General Physician. How can I assist with your physical health, symptoms, or medical report interpretation today?`
    
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
    toast.success(`Mode Switched: ${nextDoc === 'dr_ananya' ? 'Mental Wellness Companion' : 'AI General Physician'}`)
  }

  // End consultation and generate structured clinical notes
  const handleEndCall = () => {
    const patientSymptoms = chatHistory
      .filter((m) => m.role === 'patient')
      .map((m) => m.text.slice(0, 80))

    const summary: ConsultationSummaryData = {
      id: `CONS-CKM-${Date.now()}`,
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
      symptomDuration: 'Patient reported symptoms evaluated within session',
      relevantHistory: 'Regional Chikkamagaluru & Karnataka intake profile',
      informationDiscussed: [
        'Preliminary symptom differentiation and common etiologies',
        'Home care hydration and rest guidance',
        'Warning symptoms requiring in-person assessment',
        'Verified medical specialist recommendations in Chikkamagaluru district',
      ],
      triageLevel: activeTriage,
      triageTitle:
        activeTriage === 4
          ? 'Emergency Attention Required (Dial 112)'
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
        'Schedule an evaluation with a certified registered physician at District Hospital Chikkamagaluru or local clinic.',
        'Monitor temperature twice daily and maintain adequate fluid intake.',
        'If emergency warning signs occur, call 112 / 108 immediately.',
      ],
      referralRecommendation:
        'Consultation with an attending General Physician or Specialist is strongly recommended to obtain a formal physical examination and prescription.',
      disclaimer:
        'MediCare is an AI healthcare digital assistant and is not an autonomous licensed doctor. No clinical diagnosis, prescription, or psychotherapy is provided. Regulated healthcare services must remain under qualified human medical practitioners.',
    }

    setSummaryData(summary)
    setIsSummaryModalOpen(true)
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ── Specialist Booking Modal ── */}
      <SpecialistBookingModal
        isOpen={isSpecialistModalOpen}
        onClose={() => setIsSpecialistModalOpen(false)}
        onAppointmentBooked={(details) => {
          setChatHistory((prev) => [
            ...prev,
            {
              id: `apt-${Date.now()}`,
              role: 'doctor',
              text: `Appointment request confirmed with ${details.doctor_name} at ${details.hospital} on ${details.date} (${details.time_slot}). Booking ID: ${details.booking_id}.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
          speak(`Your appointment request with ${details.doctor_name} has been prepared. Please arrive 15 minutes prior to your consultation slot.`)
        }}
      />

      {/* ── Report Upload Drawer ── */}
      <ReportUploadDrawer
        isOpen={isReportDrawerOpen}
        onClose={() => setIsReportDrawerOpen(false)}
        onReportAnalyzed={(rep: MedicalReportItem) => {
          setReports((prev) => [...prev, rep])
          setChatHistory((prev) => [
            ...prev,
            {
              id: `rep-${Date.now()}`,
              role: 'doctor',
              text: `I've analyzed your report (${rep.fileName}). Parameter breakdown: ${rep.tests.map((t) => `${t.name}: ${t.value} ${t.unit} (${t.status})`).join(', ')}. Clinical Note: ${rep.aiInterpretation}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
          speak(`I have examined your diagnostic report for ${rep.fileName}. I noticed the parameters provided and summarized the normal reference ranges. Please discuss these with your attending doctor.`)
        }}
      />

      {/* ── Consultation Summary Modal ── */}
      {summaryData && (
        <ConsultationSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          summary={summaryData}
        />
      )}

      {/* ── Top Consultation Header ── */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            {doctorId === 'dr_ananya' ? <Brain size={18} className="text-purple-400 animate-pulse" /> : <HeartPulse size={18} className="text-sky-400 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Medi<span className="text-sky-400">Care</span></span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-semibold">
                Your AI Doctor
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${doctorId === 'dr_ananya' ? 'bg-purple-950/80 text-purple-300 border-purple-800' : 'bg-sky-950/80 text-sky-300 border-sky-800'}`}>
                {doctorId === 'dr_ananya' ? 'Mental Wellness' : 'General Physician'}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Consulting with <span className="text-sky-300 font-semibold">{doctor.name}</span> • <span className="text-slate-400">Chikkamagaluru, KA</span>
            </span>
          </div>
        </div>

        {/* Status Center */}
        <div className="flex items-center gap-3">
          {/* Live Call Duration */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock size={13} className="text-sky-400" />
            <span>{formatTimer(consultationSeconds)}</span>
          </div>

          {/* Mode Switcher Button */}
          <button
            onClick={handleToggleDoctor}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors shadow-sm"
          >
            <RotateCcw size={12} className="text-sky-400" />
            <span>Switch to {doctorId === 'dr_arjun' ? 'Dr. Ananya (Wellness)' : 'Dr. Arjun (Physician)'}</span>
          </button>
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
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </header>

      {/* ── Main Area: 70% Video Area / 30% Chat Panel ── */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── 70% Photorealistic Doctor Video Viewport ── */}
        <div
          className={`relative h-full transition-all duration-300 ${
            isChatVisible ? 'w-full md:w-[70%]' : 'w-full'
          }`}
        >
          {/* Photorealistic Human AI Doctor Video Viewport */}
          <DoctorPhotorealisticViewport
            doctorId={doctorId}
            doctorState={doctorState}
            audioLevel={audioLevel}
            isMuted={isMuted}
            subtitles={subtitles}
            activeTriage={activeTriage}
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

          {/* Real-time Subtitles / Live Transcript Bar (Bottom of Video Area) */}
          {subtitles && (
            <div className="absolute bottom-16 left-6 right-6 z-20 flex justify-center pointer-events-none">
              <div className="max-w-2xl px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white text-center text-xs md:text-sm font-medium leading-relaxed shadow-2xl animate-fade-in">
                <span className="text-sky-400 font-semibold mr-1.5">{doctor.name}:</span>
                <span>{subtitles}</span>
              </div>
            </div>
          )}

          {/* Emergency Hotline Trigger (if Triage Level 4) */}
          {activeTriage === 4 && (
            <div className="absolute top-20 left-4 right-4 z-30 max-w-lg mx-auto p-4 rounded-2xl bg-red-600/95 border border-red-400 text-white shadow-2xl backdrop-blur-md animate-bounce">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={24} className="text-white flex-shrink-0" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">
                      Emergency Warning Signs Detected
                    </span>
                    <span className="text-xs text-red-100">
                      Call 112 (National Emergency) or 108 (Arogya Kavacha Karnataka) immediately.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="tel:112"
                    className="px-3.5 py-1.5 rounded-xl bg-white text-red-700 font-extrabold text-xs flex items-center gap-1 shadow-md hover:bg-red-50"
                  >
                    <PhoneCall size={14} />
                    <span>Dial 112</span>
                  </a>
                </div>
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

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSpecialistModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="Search Specialists"
                >
                  <Stethoscope size={12} />
                  <span>Specialists</span>
                </button>
                <button
                  onClick={() => setIsReportDrawerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="Upload Laboratory Report"
                >
                  <Upload size={12} />
                  <span>Report</span>
                </button>
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
                    className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      item.role === 'patient'
                        ? 'bg-sky-600 text-white rounded-br-xs shadow-md'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs shadow-md'
                    }`}
                  >
                    {item.text}

                    {/* Interactive Specialist Cards */}
                    {item.actionCard?.type === 'specialist_recommendation' && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-slate-700">
                        <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">
                          Verified Karnataka Healthcare Specialists:
                        </span>
                        {item.actionCard.payload.specialists.map((doc: Specialist) => (
                          <div
                            key={doc.id}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-col gap-1 text-[11px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{doc.name}</span>
                              <button
                                onClick={() => setIsSpecialistModalOpen(true)}
                                className="px-2 py-0.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[10px]"
                              >
                                Book Visit
                              </button>
                            </div>
                            <span className="text-slate-400">{doc.specialty} • {doc.hospital}</span>
                            <span className="text-slate-500 font-mono text-[10px]">{doc.location}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive 4-4-4 Box Breathing Card */}
                    {item.actionCard?.type === 'breathing_exercise' && (
                      <div className="mt-3 p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-300 mb-2">
                          <Wind size={15} />
                          <span>4-4-4 Box Breathing Guide</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-purple-300">
                          <span className="px-2 py-1 rounded-md bg-purple-900/80">Inhale (4s)</span>
                          <span>→</span>
                          <span className="px-2 py-1 rounded-md bg-purple-900/80">Hold (4s)</span>
                          <span>→</span>
                          <span className="px-2 py-1 rounded-md bg-purple-900/80">Exhale (4s)</span>
                        </div>
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
                    {doctor.name} is evaluating clinical knowledge...
                  </span>
                </div>
              )}
            </div>

            {/* Quick Symptom Chips */}
            <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/40">
              <span className="block text-[10px] text-slate-500 uppercase font-mono mb-1.5">
                Quick Clinical Inquiries:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { label: '🌡️ Fever & Chills', query: 'I have had a mild fever and body aches for two days.' },
                  { label: '🩺 Find Doctor', query: 'Can you recommend a specialist doctor in Chikkamagaluru?' },
                  { label: '📑 Check Report', query: 'Can you help interpret my Complete Blood Count report?' },
                  { label: '🧘 Anxiety & Stress', query: 'I feel stressed and having trouble sleeping.' },
                ].map((topic, i) => (
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

            {/* Chat Input & Mic Speech Trigger */}
            <div className="p-3 border-t border-slate-800 bg-slate-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2"
              >
                {/* Microphone Speech Recognition Button */}
                <button
                  type="button"
                  onClick={toggleMicListening}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListeningSpeech
                      ? 'bg-red-600 text-white animate-pulse shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700'
                  }`}
                  title={isListeningSpeech ? 'Listening... Click to stop' : 'Click to speak naturally'}
                >
                  <Mic size={16} />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isListeningSpeech ? 'Listening to speech...' : `Speak or message ${doctor.name}...`}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
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
          {/* Microphone Speech Toggle */}
          <button
            onClick={toggleMicListening}
            className={`p-3 rounded-2xl transition-all shadow-md ${
              isListeningSpeech
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isListeningSpeech ? 'Stop speech listening' : 'Start speaking to doctor'}
          >
            {isListeningSpeech ? <MicOff size={18} /> : <Mic size={18} />}
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

          {/* Patient Interrupt Button */}
          <button
            onClick={interrupt}
            className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-amber-600/80 text-amber-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-md"
            title="Interrupt doctor speech and return to listening"
          >
            <Hand size={16} />
            <span className="hidden md:inline">Interrupt</span>
          </button>

          {/* Schedule Specialist Doctor */}
          <button
            onClick={() => setIsSpecialistModalOpen(true)}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-all shadow-md"
            title="Search Specialist Doctors in Karnataka"
          >
            <Stethoscope size={18} />
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
      </footer>
    </div>
  )
}
