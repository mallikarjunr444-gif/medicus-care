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
  AlertOctagon,
} from 'lucide-react'
import { DoctorPhotorealisticViewport } from './DoctorPhotorealisticViewport'
import { PatientWebcamPiP } from '../video/PatientWebcamPiP'
import { useDoctorSpeech } from './useDoctorSpeech'
import { ConsultationSummaryModal } from './ConsultationSummaryModal'
import { ReportUploadDrawer } from './ReportUploadDrawer'
import { SpecialistBookingModal, VERIFIED_SPECIALISTS_LOCAL, type Specialist } from './SpecialistBookingModal'
import { useConnectionManager } from '@/lib/useConnectionManager'
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
  speakerName: string
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
  // Doctor & Session State
  const [doctorId, setDoctorId] = useState<DoctorId>(initialDoctorId)
  const [doctorState, setDoctorState] = useState<DoctorState>('idle')
  const [language, setLanguage] = useState<ConsultationLanguage>('en')
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(false)
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

  const doctor = DOCTORS[doctorId] || DOCTORS.dr_arjun

  // Centralized Connection Management Hook
  const { statusLabel, overallStatus } = useConnectionManager({
    isCameraOn,
    isMicListening: isListeningSpeech,
    isDigitalHumanReady: true,
  })

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

  // Doctor Speech Hook (Natural voice synthesis & lip-sync amplitude tracking)
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

  // Chat conversation history (Only ONE message added per interaction turn)
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([
    {
      id: 'msg-init',
      role: 'doctor',
      speakerName: doctor.name,
      text:
        language === 'kn'
          ? `ನಮಸ್ಕಾರ! ನಾನು ${doctor.name}, ನಿಮ್ಮ ಮೆಡಿಕೇರ್ (MediCare) AI ವೈದ್ಯ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.`
          : language === 'hi'
          ? `नमस्ते! मैं ${doctor.name}, आपका मेडिकेयर (MediCare) AI डॉक्टर हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?`
          : `Hello! I'm ${doctor.name}, your MediCare AI Physician. How are you feeling today? You can speak naturally or type your symptoms.`,
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
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
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
        recognitionRef.current.lang =
          language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
        recognitionRef.current.start()
      } else {
        toast('Speech recognition not supported in this browser. Please type your message.', {
          icon: '🎙️',
        })
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

      // Interrupt ongoing speech if patient speaks
      if (isSpeaking) {
        interrupt()
      }

      // Check auto language detection
      const detectedLang = detectInputLanguage(msg)
      let activeLang = language
      if (detectedLang && detectedLang !== language) {
        activeLang = detectedLang
        setLanguage(detectedLang)
        toast.success(
          `Language auto-detected: ${detectedLang === 'kn' ? 'ಕನ್ನಡ (Kannada)' : 'हिन्दी (Hindi)'}`,
          { icon: '🌐' }
        )
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const newPatientEntry: ChatEntry = {
        id: `patient-${Date.now()}`,
        role: 'patient',
        speakerName: 'You (Patient)',
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

      // 1. Emergency Detection (Localized to Chikkamagaluru, Karnataka, India)
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
            : 'EMERGENCY ALERT: These symptoms require immediate medical intervention. Please call emergency services (112 in India, 108 Ambulance) or visit District Hospital Chikkamagaluru immediately. Do not drive yourself.'
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
      else if (
        lower.includes('fever') ||
        lower.includes('temperature') ||
        lower.includes('shivering')
      ) {
        triage = 2
        doctorResponse =
          activeLang === 'kn'
            ? 'ಜ್ವರವು ಸಾಮಾನ್ಯವಾಗಿ ಸೋಂಕಿನ ವಿರುದ್ಧ ದೇಹದ ನೈಸರ್ಗಿಕ ರಕ್ಷಣಾತ್ಮಕ ಪ್ರತಿಕ್ರಿಯೆಯಾಗಿದೆ. ಇದು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ? ದಯವಿಟ್ಟು ಸಾಕಷ್ಟು ನೀರು ಮತ್ತು ಎಳನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.'
            : 'Fever is commonly an immune response to a viral or bacterial infection. How many days have you noticed this temperature? Stay well hydrated with fluids, get plenty of rest, and monitor for warning signs like chest heaviness or persistent vomiting.'
      } else if (lower.includes('headache') || lower.includes('migraine')) {
        triage = 2
        doctorResponse =
          'Headaches often stem from tension, dehydration, eye strain, or sleep deprivation. Are you experiencing any visual disturbances, nausea, or neck stiffness? Please drink 500ml of water and rest in a dim, quiet room.'
      } else {
        // General clinical intake interview follow-up
        doctorResponse =
          activeLang === 'kn'
            ? `ನಾನು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿದ್ದೇನೆ. ಈ ಸಮಸ್ಯೆ ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ ಮತ್ತು ನೀವು ಪ್ರಸ್ತುತ ಯಾವುದೇ ನಿಯಮಿತ ಔಷಧಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?`
            : `I understand. Could you let me know how long you've noticed these symptoms, and whether they worsen at specific times of the day? This helps me provide more relevant general health education.`
      }

      setActiveTriage(triage)

      // Add doctor response to transcript and speak with real-time lip-sync
      setTimeout(() => {
        const doctorEntry: ChatEntry = {
          id: `doc-${Date.now()}`,
          role: 'doctor',
          speakerName: doctor.name,
          text: doctorResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          triage,
          warningSign: warning || undefined,
          actionCard,
        }
        setChatHistory((prev) => [...prev, doctorEntry])
        speak(doctorResponse)
      }, 600)
    },
    [inputText, language, speak, isSpeaking, interrupt, doctor.name]
  )

  // Switch doctor identity (Dr. Arjun vs Dr. Ananya)
  const handleToggleDoctor = (targetDoctorId?: DoctorId) => {
    const nextDoc: DoctorId = targetDoctorId || (doctorId === 'dr_arjun' ? 'dr_ananya' : 'dr_arjun')
    if (nextDoc === doctorId) return

    // Stop current speech before switching
    interrupt()

    setDoctorId(nextDoc)
    const nextDocObj = DOCTORS[nextDoc]
    const welcomeMsg =
      nextDoc === 'dr_ananya'
        ? `Switched to ${nextDocObj.name}, your AI Mental Wellness & Lab Diagnostics Consultant. I am here to listen empathetically, assist with lab results, and guide calming breathing exercises. How are you feeling today?`
        : `Switched to ${nextDocObj.name}, your AI General Physician. How can I assist with your physical symptoms, health review, or clinical triage today?`

    setChatHistory((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'doctor',
        speakerName: nextDocObj.name,
        text: welcomeMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    speak(welcomeMsg)
    toast.success(
      `Consultation switched to ${nextDocObj.formalTitle} (${nextDoc === 'dr_ananya' ? 'Wellness & Labs' : 'General Physician'})`,
      { icon: '👨‍⚕️' }
    )
  }

  // End consultation and generate structured clinical notes
  const handleEndCall = () => {
    interrupt()

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
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
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
              speakerName: doctor.name,
              text: `Appointment request confirmed with ${details.doctor_name} at ${details.hospital} on ${details.date} (${details.time_slot}). Booking ID: ${details.booking_id}.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
          speak(
            `Your appointment request with ${details.doctor_name} has been prepared. Please arrive 15 minutes prior to your consultation slot.`
          )
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
              speakerName: doctor.name,
              text: `I've analyzed your report (${rep.fileName}). Parameter breakdown: ${rep.tests
                .map((t) => `${t.name}: ${t.value} ${t.unit} (${t.status})`)
                .join(', ')}. Clinical Note: ${rep.aiInterpretation}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
          speak(
            `I have examined your diagnostic report for ${rep.fileName}. I analyzed the clinical parameters and summarized the reference ranges. Please discuss these with your attending physician.`
          )
        }}
      />

      {/* ── Consultation Summary Modal ── */}
      {summaryData && (
        <ConsultationSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => {
            setIsSummaryModalOpen(false)
            onEndConsultation?.()
          }}
          summary={summaryData}
        />
      )}

      {/* ── TOP NAVIGATION BAR ── */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <HeartPulse size={19} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                Medi<span className="text-sky-400">Care</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-semibold">
                Your AI Doctor
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  doctorId === 'dr_ananya'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                    : 'bg-sky-950/80 text-sky-300 border-sky-800'
                }`}
              >
                {doctorId === 'dr_ananya' ? 'Wellness & Diagnostics' : 'General Physician'}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Consulting with <span className="text-sky-300 font-semibold">{doctor.name}</span> •{' '}
              <span className="text-slate-400">Chikkamagaluru, KA</span>
            </span>
          </div>
        </div>

        {/* Central Consultation Telemetry */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock size={13} className="text-sky-400" />
            <span>{formatTimer(consultationSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">{statusLabel}</span>
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
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONSULTATION LAYOUT: 65% VIDEO / 35% SIDEBAR ── */}
      <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ── 65% MAIN CONSULTATION AREA: Photorealistic Digital Human Doctor ── */}
        <section className="relative w-full lg:w-[65%] h-[60vh] lg:h-full flex flex-col bg-slate-950 overflow-hidden">
          {/* Photorealistic Digital Human Video Viewport */}
          <div className="relative w-full flex-1 overflow-hidden">
            <DoctorPhotorealisticViewport
              doctorId={doctorId}
              doctorState={doctorState}
              audioLevel={audioLevel}
              isMuted={isMuted}
              subtitles={subtitles}
              activeTriage={activeTriage}
              onStateChange={(st) => setDoctorState(st)}
              onReconnect={() => setDoctorState('idle')}
              className="w-full h-full"
            />

            {/* Floating Patient Camera Window (PiP) */}
            <div className="absolute top-4 right-4 z-20">
              <PatientWebcamPiP
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                onToggleCamera={() => setIsCameraOn((prev) => !prev)}
                onToggleMic={() => setIsMicOn((prev) => !prev)}
              />
            </div>

            {/* Emergency Hotline Banner (Triggered on Triage Level 4) */}
            {activeTriage === 4 && (
              <div className="absolute top-20 left-4 right-4 z-30 max-w-lg mx-auto p-4 rounded-2xl bg-red-600/95 border border-red-400 text-white shadow-2xl backdrop-blur-md animate-bounce">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={26} className="text-white flex-shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">
                        Emergency Warning Signs Detected
                      </span>
                      <span className="text-xs text-red-100">
                        Call 112 (National Emergency) or 108 (Arogya Kavacha Karnataka) immediately.
                      </span>
                    </div>
                  </div>
                  <a
                    href="tel:112"
                    className="px-3.5 py-1.5 rounded-xl bg-white text-red-700 font-extrabold text-xs flex items-center gap-1 shadow-md hover:bg-red-50"
                  >
                    <PhoneCall size={14} />
                    <span>Dial 112</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── BOTTOM CONSULTATION CONTROLS (Zero dead black space) ── */}
          <div className="h-16 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
            {/* Left: Triage Status Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  activeTriage === 4
                    ? 'bg-red-500 animate-ping'
                    : activeTriage === 3
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-xs text-slate-300 font-mono hidden sm:inline">
                Triage Level {activeTriage} • Clinical Screening Active
              </span>
            </div>

            {/* Center: Essential Telemedicine Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mic Speech Button */}
              <button
                onClick={toggleMicListening}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
                  isListeningSpeech
                    ? 'bg-emerald-600 text-white animate-pulse ring-2 ring-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Speak to doctor (Speech-to-Text)"
              >
                {isListeningSpeech ? <Mic size={15} /> : <MicOff size={15} />}
                <span className="hidden md:inline">
                  {isListeningSpeech ? 'Listening…' : 'Speak'}
                </span>
              </button>

              {/* Camera Toggle */}
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isCameraOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}
                title="Toggle Patient Camera"
              >
                {isCameraOn ? <Video size={15} /> : <VideoOff size={15} />}
                <span className="hidden md:inline">{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              {/* Speaker Mute */}
              <button
                onClick={toggleMute}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isMuted
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isMuted ? 'Unmute Doctor' : 'Mute Doctor'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span className="hidden md:inline">{isMuted ? 'Muted' : 'Audio'}</span>
              </button>

              {/* Patient Interrupt Button */}
              <button
                onClick={interrupt}
                className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Interrupt doctor politely"
              >
                <Hand size={14} className="text-purple-300" />
                <span>Interrupt</span>
              </button>
            </div>

            {/* Right: End Call & Summary Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleEndCall}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
              >
                <PhoneOff size={14} />
                <span>End Call &amp; Summary</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 35% RIGHT SIDEBAR: Consultation Transcript, Quick Tools & Specialist Switcher ── */}
        <aside className="w-full lg:w-[35%] h-[40vh] lg:h-full border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 flex flex-col z-20 flex-shrink-0 shadow-2xl backdrop-blur-xl">
          {/* Sidebar Header with Doctor Switcher */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-sky-400" />
              <span className="font-bold text-xs text-white">Consultation Transcript</span>
            </div>

            {/* Doctor Switcher Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => handleToggleDoctor('dr_arjun')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  doctorId === 'dr_arjun'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dr. Arjun
              </button>
              <button
                onClick={() => handleToggleDoctor('dr_ananya')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  doctorId === 'dr_ananya'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dr. Ananya
              </button>
            </div>
          </div>

          {/* Quick Clinical Inquiries Carousel */}
          <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            {[
              { label: '🌡️ Fever & Chills', query: 'I have a high fever and shivering since yesterday.' },
              { label: '🫁 Cough & Chest', query: 'I have a persistent dry cough and chest congestion.' },
              { label: '📋 Upload Lab Report', query: 'I would like to analyze my CBC and blood test report.' },
              { label: '🧘 4-4-4 Breathing', query: 'I feel anxious and overwhelmed, guide me through breathing exercises.' },
              { label: '🏥 Chikkamagaluru Specialist', query: 'Find specialist doctors in Chikkamagaluru district.' },
            ].map((shortcut, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(shortcut.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-[11px] text-slate-300 hover:text-white transition-colors flex-shrink-0"
              >
                {shortcut.label}
              </button>
            ))}
          </div>

          {/* Transcript Messages List */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {chatHistory.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col ${
                  item.role === 'patient' ? 'items-end' : 'items-start'
                } animate-fade-in`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-400">{item.speakerName}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>

                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    item.role === 'patient'
                      ? 'bg-sky-600 text-white rounded-br-xs shadow-md'
                      : 'glass-card text-slate-200 border border-slate-700/70 rounded-bl-xs shadow-md'
                  }`}
                >
                  <p>{item.text}</p>

                  {/* Specialist Referral Card */}
                  {item.actionCard?.type === 'specialist_recommendation' && (
                    <div className="mt-3 space-y-2 pt-2.5 border-t border-slate-700">
                      <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">
                        Verified Karnataka Healthcare Specialists:
                      </span>
                      {item.actionCard.payload.specialists.map((spec: Specialist) => (
                        <div
                          key={spec.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{spec.name}</span>
                            <button
                              onClick={() => setIsSpecialistModalOpen(true)}
                              className="px-2 py-0.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[10px]"
                            >
                              Book Visit
                            </button>
                          </div>
                          <span className="text-slate-400">
                            {spec.specialty} • {spec.hospital}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {spec.location}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 4-4-4 Box Breathing Interactive Card */}
                  {item.actionCard?.type === 'breathing_exercise' && (
                    <div className="mt-3 p-3.5 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-200 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-300 mb-2">
                        <Wind size={15} className="animate-spin" />
                        <span>Box Breathing Pacer (Inhale 4s • Hold 4s • Exhale 4s)</span>
                      </div>
                      <p className="text-[11px] text-purple-300 mb-2">
                        Breathe along with Dr. Ananya to regulate heart rate variability.
                      </p>
                      <div className="w-full bg-purple-900/60 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full w-2/3 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Transcript Text Input Area */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80">
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
                placeholder={`Ask ${doctor.name} symptoms or health questions…`}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                title="Send message"
              >
                <Send size={15} />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 px-1">
              <span>District Hospital Chikkamagaluru Network</span>
              <span>Emergency: Dial 112 / 108</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
