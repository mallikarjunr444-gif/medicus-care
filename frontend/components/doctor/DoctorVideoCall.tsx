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
import { PhotorealisticDigitalHuman } from './PhotorealisticDigitalHuman'
import { DoctorCanvas3D } from './DoctorCanvas3D'
import { PatientWebcamPiP } from '../video/PatientWebcamPiP'
import { useDoctorSpeech } from './useDoctorSpeech'
import { ConsultationSummaryModal } from './ConsultationSummaryModal'
import { ReportUploadDrawer } from './ReportUploadDrawer'
import { SpecialistBookingModal, VERIFIED_SPECIALISTS_LOCAL, type Specialist } from './SpecialistBookingModal'
import { LanguageSelectionModal, SUPPORTED_LANGUAGES } from './LanguageSelectionModal'
import { useConnectionManager } from '@/lib/useConnectionManager'
import {
  analyzePatientInput,
  createInitialSessionMemory,
  type ClinicalSessionMemory,
} from '@/lib/medicalConsultationEngine'
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
  const [language, setLanguage] = useState<ConsultationLanguage>('kn') // Default to regional Kannada or selected
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(true)
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

  // Conversational Session Memory (Prevents repetitive questions & tracks symptoms across turns)
  const sessionMemoryRef = useRef<ClinicalSessionMemory>(
    createInitialSessionMemory('kn', initialDoctorId)
  )

  // Speech Recognition state with continuous watchdog loop
  const [isListeningSpeech, setIsListeningSpeech] = useState(false)
  const [avatarEngineMode, setAvatarEngineMode] = useState<'neural' | 'threejs'>('neural')
  const recognitionRef = useRef<any>(null)
  const isSpeechActiveRef = useRef(false)
  const speechWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastFinalTranscriptRef = useRef<string>('')
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const doctor = DOCTORS[doctorId] || DOCTORS.dr_arjun

  // Centralized Connection Management Hook
  const { statusLabel, overallStatus } = useConnectionManager({
    isCameraOn,
    isMicListening: isListeningSpeech,
    isDigitalHumanReady: true,
  })

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
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatHistory])

  // Consultation Timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (!isLanguageModalOpen) {
      timer = setInterval(() => {
        setConsultationSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isLanguageModalOpen])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Speech Recognition with Continuous Listening & Auto-Healing Watchdog Loop
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    const bcp47Map: Record<ConsultationLanguage, string> = {
      kn: 'kn-IN',
      hi: 'hi-IN',
      en: 'en-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      ml: 'ml-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
    }
    recognition.lang = bcp47Map[language] || 'kn-IN'

    recognition.onstart = () => {
      setIsListeningSpeech(true)
      setIsMicOn(true)
      isSpeechActiveRef.current = true
      if (doctorState !== 'speaking' && doctorState !== 'thinking') {
        setDoctorState('listening')
      }
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }

      // Barge-in: If patient starts speaking while doctor speaks, interrupt doctor immediately
      if ((final || interim.length > 2) && isSpeaking) {
        interrupt()
      }

      if (final.trim()) {
        const cleaned = final.trim()
        if (cleaned !== lastFinalTranscriptRef.current) {
          lastFinalTranscriptRef.current = cleaned
          handleSendMessage(cleaned)
        }
      }
    }

    recognition.onerror = (err: any) => {
      // Auto-restart if user intends mic to remain on
      if (err.error === 'no-speech' || err.error === 'network') {
        if (isSpeechActiveRef.current) {
          try {
            recognition.stop()
          } catch {}
          setTimeout(() => {
            if (isSpeechActiveRef.current) {
              try {
                recognition.start()
              } catch {}
            }
          }, 300)
        }
      } else {
        setIsListeningSpeech(false)
      }
    }

    recognition.onend = () => {
      // Auto-heal continuous connection unless explicitly turned off
      if (isSpeechActiveRef.current) {
        setTimeout(() => {
          if (isSpeechActiveRef.current) {
            try {
              recognition.start()
            } catch {}
          }
        }, 200)
      } else {
        setIsListeningSpeech(false)
        setIsMicOn(false)
      }
    }

    recognitionRef.current = recognition

    return () => {
      isSpeechActiveRef.current = false
      try {
        recognition.stop()
      } catch {}
    }
  }, [language, isSpeaking, interrupt])

  const toggleMicListening = () => {
    if (isListeningSpeech || isSpeechActiveRef.current) {
      isSpeechActiveRef.current = false
      try {
        recognitionRef.current?.stop()
      } catch {}
      setIsListeningSpeech(false)
      setIsMicOn(false)
      setDoctorState('idle')
      toast('Microphone muted', { icon: '🎙️' })
    } else {
      if (recognitionRef.current) {
        isSpeechActiveRef.current = true
        const bcp47Map: Record<ConsultationLanguage, string> = {
          kn: 'kn-IN',
          hi: 'hi-IN',
          en: 'en-IN',
          te: 'te-IN',
          ta: 'ta-IN',
          ml: 'ml-IN',
          mr: 'mr-IN',
          bn: 'bn-IN',
          gu: 'gu-IN',
        }
        recognitionRef.current.lang = bcp47Map[language] || 'kn-IN'
        try {
          recognitionRef.current.start()
          setIsMicOn(true)
          toast.success('Microphone active — speaking to doctor', { icon: '🎙️' })
        } catch {
          setIsListeningSpeech(true)
          setIsMicOn(true)
        }
      } else {
        toast('Speech recognition not supported in this browser. Please type your message.', {
          icon: '🎙️',
        })
      }
    }
  }

  // Handle patient asking symptoms or speaking naturally
  const handleSendMessage = useCallback(
    async (customText?: string) => {
      const msg = (customText || inputText).trim()
      if (!msg) return

      // Interrupt ongoing doctor speech if patient starts speaking
      if (isSpeaking) {
        interrupt()
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

      // Process through Context-Aware Medical Consultation Engine with Conversational Memory
      const result = analyzePatientInput(msg, sessionMemoryRef.current)
      sessionMemoryRef.current = result.updatedMemory
      setActiveTriage(result.triage)

      // Fast Immediate Dispatch without artificial lag
      const doctorEntry: ChatEntry = {
        id: `doc-${Date.now()}`,
        role: 'doctor',
        speakerName: doctor.name,
        text: result.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        triage: result.triage,
        warningSign: result.warningSign,
        actionCard: result.actionCard as ActionCardData | undefined,
      }
      setChatHistory((prev) => [...prev, doctorEntry])
      speak(result.response)
    },
    [inputText, isSpeaking, interrupt, doctor.name, speak]
  )

  // Language Selection Confirmation Handler (First Step Gate)
  const handleLanguageConfirm = (selectedLang: ConsultationLanguage) => {
    setLanguage(selectedLang)
    setIsLanguageModalOpen(false)

    // Initialize session memory with selected language
    sessionMemoryRef.current = createInitialSessionMemory(selectedLang, doctorId)

    // Find native greeting for selected language
    const langConfig =
      SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0]
    const greetingText = langConfig.sampleGreeting[doctorId]

    // Set initial greeting in transcript
    const initialEntry: ChatEntry = {
      id: `init-${Date.now()}`,
      role: 'doctor',
      speakerName: doctor.name,
      text: greetingText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setChatHistory([initialEntry])

    // Doctor speaks native greeting immediately
    speak(greetingText)
    toast.success(`Consultation language set: ${langConfig.label} (${langConfig.nativeName})`, {
      icon: '🌐',
    })
  }

  // Switch Language during ongoing consultation (Preserves conversation history & symptoms!)
  const handleSwitchLanguage = (newLang: ConsultationLanguage) => {
    if (newLang === language) return

    interrupt()
    setLanguage(newLang)

    // Update session memory language while preserving symptoms & context
    sessionMemoryRef.current = {
      ...sessionMemoryRef.current,
      language: newLang,
    }

    const langConfig =
      SUPPORTED_LANGUAGES.find((l) => l.code === newLang) || SUPPORTED_LANGUAGES[0]

    const switchNotificationMap: Record<ConsultationLanguage, string> = {
      kn: `ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ನಾನು ನಿಮ್ಮ ಹಿಂದಿನ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ಗಮನದಲ್ಲಿಟ್ಟುಕೊಂಡು ಸಂಭಾಷಣೆಯನ್ನು ಮುಂದುವರಿಸುತ್ತೇನೆ.`,
      hi: `भाषा को हिन्दी में बदल दिया गया है। मैं आपकी पिछली स्वास्थ्य जानकारी को ध्यान में रखते हुए बातचीत जारी रखूँगा।`,
      en: `Language switched to English. I have retained your previous symptoms and will continue our consultation in English.`,
      te: `భాష తెలుగుకు మార్చబడింది. మీ మునుపటి ఆరోగ్య వివరాలను దృష్టిలో ఉంచుకుని సంభాషణ కొనసాగిస్తాను.`,
      ta: `மொழி தமிழுக்கு மாற்றப்பட்டது. உங்கள் முந்தைய உடல்நல விவரங்களை நினைவில் வைத்து உரையாடலைத் தொடர்கிறேன்.`,
      ml: `ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി. നിങ്ങളുടെ മുൻ വിവരങ്ങൾ നിലനിർത്തിക്കൊണ്ട് ഞങ്ങൾ തുടരും.`,
      mr: `भाषा मराठीमध्ये बदलली आहे. मी आपल्या मागील माहितीसह संभाषण सुरू ठेवेन.`,
      bn: `ভাষা বাংলায় পরিবর্তন করা হয়েছে। আমি পূর্ববর্তী তথ্যের ভিত্তিতে আলোচনা চালিয়ে যাব।`,
      gu: `ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે. હું તમારી અગાઉની વિગતો સાથે ચર્ચા ચાલુ રાખીશ.`,
    }

    const notice = switchNotificationMap[newLang] || switchNotificationMap.en

    setChatHistory((prev) => [
      ...prev,
      {
        id: `lang-switch-${Date.now()}`,
        role: 'doctor',
        speakerName: doctor.name,
        text: notice,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    speak(notice)
    toast.success(`Switched language to ${langConfig.nativeName}`, { icon: '🌐' })
  }

  // Switch doctor identity (Dr. Arjun vs Dr. Ananya)
  const handleToggleDoctor = (targetDoctorId?: DoctorId) => {
    const nextDoc: DoctorId = targetDoctorId || (doctorId === 'dr_arjun' ? 'dr_ananya' : 'dr_arjun')
    if (nextDoc === doctorId) return

    interrupt()
    setDoctorId(nextDoc)

    // Update session memory doctorId while preserving symptoms
    sessionMemoryRef.current = {
      ...sessionMemoryRef.current,
      doctorId: nextDoc,
    }

    const nextDocObj = DOCTORS[nextDoc]
    const welcomeMessages: Record<ConsultationLanguage, Record<DoctorId, string>> = {
      kn: {
        dr_ananya: `ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಅನನ್ಯಾ, ನಿಮ್ಮ ಮಾನಸಿಕ ಕ್ಷೇಮ ಮತ್ತು ಲ್ಯಾಬ್ ತಪಾಸಣೆ ಸಮಾಲೋಚಕಿ. ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳ ವಿವರಗಳನ್ನು ನಾನು ಪಡೆದಿದ್ದೇನೆ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
        dr_arjun: `ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಅರ್ಜುನ್, ನಿಮ್ಮ ಸಾಮಾನ್ಯ ವೈದ್ಯ. ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳ ವಿವರಗಳನ್ನು ನಾನು ಪರಿಶೀಲಿಸಿದ್ದೇನೆ. ಮುಂದಿನ ಆರೋಗ್ಯ ತಪಾಸಣೆ ಮಾಡೋಣ.`,
      },
      hi: {
        dr_ananya: `नमस्ते! मैं डॉ. अनन्या हूँ, आपकी वेलनेस और लैब डायग्नोस्टिक सलाहकार। मैं आपकी पिछली जानकारी से अवगत हूँ। मैं कैसे सहायता करूँ?`,
        dr_arjun: `नमस्ते! मैं डॉ. अर्जुन हूँ, आपका सामान्य चिकित्सक। मैंने आपके लक्षणों को नोट कर लिया है। चलिए आगे की बात करते हैं।`,
      },
      en: {
        dr_ananya: `Hello! I'm Dr. Ananya, your Wellness & Diagnostic Lab Consultant. I have reviewed your previous symptoms. How can I guide you further?`,
        dr_arjun: `Hello! I'm Dr. Arjun, your General Physician. I have your reported symptom history in mind. Let us continue your medical evaluation.`,
      },
      te: {
        dr_ananya: `నమస్కారం! నేను డాక్టర్ అనన్య. మీ వివరాలను గమనించాను. నేను మీకు ఎలా సహాయపడగలను?`,
        dr_arjun: `నమస్కారం! నేను డాక్టర్ అర్జున్. మీ లక్షణాలను సమీక్షించాను. ముందుకు వెళ్దాం.`,
      },
      ta: {
        dr_ananya: `வணக்கம்! நான் டாக்டர் அனன்யா. உங்கள் முந்தைய தகவல்களை பார்த்தேன். நான் எவ்வாறு உதவ முடியும்?`,
        dr_arjun: `வணக்கம்! நான் டாக்டர் அர்ஜுன். உங்கள் அறிகுறிகளை கவனித்தேன். மருத்துவ பரிசோதனையை தொடர்வோம்.`,
      },
      ml: {
        dr_ananya: `നമസ്കാരം! ഞാൻ ഡോ. അനന്യ. നിങ്ങളുടെ മുൻ വിവരങ്ങൾ ഞാൻ മനസ്സിലാക്കി. ഞാൻ എങ്ങനെ സഹായിക്കണം?`,
        dr_arjun: `നമസ്കാരം! ഞാൻ ഡോ. അർജുൻ. നിങ്ങളുടെ ലക്ഷണങ്ങൾ ഞാൻ പരിശോധിച്ചു. നമുക്ക് തുടരാം.`,
      },
      mr: {
        dr_ananya: `नमस्कार! मी डॉ. अनन्या. मी आपली माहिती पाहिली आहे. मी कशी मदत करू?`,
        dr_arjun: `नमस्कार! मी डॉ. अर्जुन. मी आपले लक्षणे तपासली आहेत. आपण चर्चा पुढे सुरू ठेवूया.`,
      },
      bn: {
        dr_ananya: `নমস্কার! আমি ডঃ অনন্যা। আপনার পূর্ববর্তী তথ্য পেয়েছি। আমি কীভাবে সাহায্য করতে পারি?`,
        dr_arjun: `নমস্কার! আমি ডঃ অর্জুন। আপনার লক্ষণগুলি দেখেছি। চলুন কথা এগিয়ে নিয়ে যাই।`,
      },
      gu: {
        dr_ananya: `નમસ્તે! હું ડૉ. અનન્યા છું. મેં તમારી વિગતો નોંધી છે. હું તમને કેવી રીતે મદદ કરું?`,
        dr_arjun: `નમસ્તે! હું ડૉ. અર્જુન છું. મેં તમારા લક્ષણો તપાસ્યા છે. ચાલો આગળ વાત કરીએ.`,
      },
    }

    const greeting =
      welcomeMessages[language]?.[nextDoc] || welcomeMessages.en[nextDoc]

    setChatHistory((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'doctor',
        speakerName: nextDocObj.name,
        text: greeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    speak(greeting)
    toast.success(
      `Consultation transferred to ${nextDocObj.formalTitle} (${nextDoc === 'dr_ananya' ? 'Wellness & Labs' : 'General Physician'})`,
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
      languageLabel:
        SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'English',
      durationFormatted: formatTimer(consultationSeconds),
      patientReportedSymptoms:
        sessionMemoryRef.current.chiefComplaints.length > 0
          ? sessionMemoryRef.current.chiefComplaints
          : patientSymptoms.length > 0
          ? patientSymptoms
          : ['General preventive health inquiry'],
      symptomDuration: sessionMemoryRef.current.duration || 'Reported during intake',
      relevantHistory: 'Chikkamagaluru & Karnataka regional healthcare network',
      informationDiscussed: [
        'Chief complaint symptom progression and characterization',
        'Clinical triage risk evaluation and associated symptoms check',
        'Guidance on hydration, rest, and home monitoring',
        'Referral guidelines for District Hospital Chikkamagaluru outpatient department',
      ],
      triageLevel: activeTriage,
      triageTitle:
        activeTriage === 4
          ? 'Emergency Attention Required (Dial 112 / 108)'
          : activeTriage === 3
          ? 'Urgent Outpatient Clinical Review Advised'
          : activeTriage === 2
          ? 'Non-Urgent Medical Assessment Recommended'
          : 'General Healthcare Education & Wellness',
      warningSignsIdentified:
        sessionMemoryRef.current.associatedSymptoms.length > 0
          ? sessionMemoryRef.current.associatedSymptoms
          : activeTriage >= 2
          ? ['Persistent symptoms requiring physician auscultation and review']
          : [],
      recommendedNextSteps: [
        'Schedule an evaluation with a certified registered physician at District Hospital Chikkamagaluru or local clinic.',
        'Monitor SpO2 saturation, temperature, and breathing cadence twice daily.',
        'If emergency red flags occur (chest pain, acute breathing difficulty), call 112 / 108 immediately.',
      ],
      referralRecommendation:
        'Consultation with an attending physician is strongly recommended for a physical examination and formal prescription.',
      disclaimer:
        'MediCare is an AI virtual medical assistant and is not an autonomous licensed doctor. No clinical diagnosis, prescription, or regulated medical service is provided. In emergencies, call 112 immediately.',
    }

    setSummaryData(summary)
    setIsSummaryModalOpen(true)
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* ── 1. PRE-CONSULTATION LANGUAGE SELECTION GATE MODAL ── */}
      <LanguageSelectionModal
        isOpen={isLanguageModalOpen}
        doctorId={doctorId}
        selectedLanguage={language}
        onSelectLanguage={(l) => setLanguage(l)}
        onConfirm={() => handleLanguageConfirm(language)}
      />

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

        {/* Right Controls: Language Selector Dropdown & End Call */}
        <div className="flex items-center gap-2">
          {/* Active Language Pill & Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <Globe size={13} className="text-sky-400 ml-1.5 mr-0.5" />
            <select
              value={language}
              onChange={(e) => handleSwitchLanguage(e.target.value as ConsultationLanguage)}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.nativeName} ({l.label})
                </option>
              ))}
            </select>
          </div>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-md ml-1"
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
          {/* Photorealistic Digital Human Video Viewport with 3D Rig Switcher */}
          <div className="relative w-full flex-1 overflow-hidden">
            {avatarEngineMode === 'neural' ? (
              <PhotorealisticDigitalHuman
                doctorId={doctorId}
                doctorState={doctorState}
                audioLevel={audioLevel}
                isMuted={isMuted}
                subtitles={subtitles}
                speakingVideoSrc={
                  doctorId === 'dr_ananya' && doctorState === 'speaking'
                    ? (language === 'kn' ? '/videos/dr_ananya/dr_ananya_speaking_kn.mp4' : '/videos/dr_ananya/dr_ananya_speaking_en.mp4')
                    : null
                }
                onStateChange={(st) => setDoctorState(st)}
                onReconnect={() => setDoctorState('idle')}
                className="w-full h-full"
              />
            ) : (
              <DoctorCanvas3D
                doctorId={doctorId}
                doctorState={doctorState}
                audioLevel={audioLevel}
                isMuted={isMuted}
                onStateChange={(st) => setDoctorState(st)}
                className="w-full h-full"
              />
            )}

            {/* Mode Switcher Pill */}
            <div className="absolute top-4 left-64 z-20 hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg">
              <button
                onClick={() => setAvatarEngineMode('neural')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  avatarEngineMode === 'neural'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Photorealistic AI
              </button>
              <button
                onClick={() => setAvatarEngineMode('threejs')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  avatarEngineMode === 'threejs'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                WebGL 3D Rig
              </button>
            </div>

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
                title="Speak to doctor (Speech-to-Text in selected language)"
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
              {
                label: language === 'kn' ? '🌡️ ಜ್ವರ ಮತ್ತು ಶೀತ' : '🌡️ Fever & Chills',
                query:
                  language === 'kn'
                    ? 'ನನಗೆ ನೆನ್ನೆಯಿಂದ ಜ್ವರ ಮತ್ತು ನಡುಕ ಇದೆ.'
                    : 'I have a fever and chills since yesterday.',
              },
              {
                label: language === 'kn' ? '🫁 ಕೆಮ್ಮು (10 ದಿನ)' : '🫁 Cough (10 Days)',
                query:
                  language === 'kn'
                    ? 'ನನಗೆ ಕಳೆದ ಹತ್ತು ದಿನಗಳಿಂದ ಕೆಮ್ಮು ಮತ್ತು ಎದೆ ಕಟ್ಟಿದಂತಿದೆ.'
                    : 'I have had a persistent cough and chest congestion for ten days.',
              },
              {
                label: language === 'kn' ? '📋 ಲ್ಯಾಬ್ ವರದಿ' : '📋 Lab Report',
                query:
                  language === 'kn'
                    ? 'ನನ್ನ ರಕ್ತ ತಪಾಸಣೆ ವರದಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಬಯಸುತ್ತೇನೆ.'
                    : 'I would like to analyze my CBC and blood test report.',
              },
              {
                label: language === 'kn' ? '🧘 ಉಸಿರಾಟದ ವ್ಯಾಯಾಮ' : '🧘 4-4-4 Breathing',
                query:
                  language === 'kn'
                    ? 'ನನಗೆ ಆತಂಕವಿದೆ, ಶಾಂತಗೊಳಿಸುವ ಉಸಿರಾಟದ ವ್ಯಾಯಾಮ ತಿಳಿಸಿ.'
                    : 'I feel anxious and overwhelmed, please guide me through breathing exercises.',
              },
              {
                label: language === 'kn' ? '🏥 ತಜ್ಞ ವೈದ್ಯರು' : '🏥 Specialists (CKM)',
                query:
                  language === 'kn'
                    ? 'ಚಿಕ್ಕಮಗಳೂರು ಜಿಲ್ಲೆಯ ತಜ್ಞ ವೈದ್ಯರನ್ನು ಹುಡುಕಿ.'
                    : 'Find specialist doctors in Chikkamagaluru district.',
              },
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
                placeholder={
                  language === 'kn'
                    ? `${doctor.name} ಅವರಿಗೆ ನಿಮ್ಮ ರೋಗಲಕ್ಷಣ ತಿಳಿಸಿ…`
                    : language === 'hi'
                    ? `${doctor.name} से अपनी परेशानी साझा करें…`
                    : `Speak or type symptoms for ${doctor.name}…`
                }
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
