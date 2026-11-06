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
  HeartPulse,
  UserRound,
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
import { attachAudioAnalyser, setAudioOutputMuted } from '@/lib/audioEnergy'
import { PatientWebcamPiP } from '../video/PatientWebcamPiP'
import { useDoctorSpeech } from './useDoctorSpeech'
import { useConsultationSpeechRecognition } from './useConsultationSpeechRecognition'
import { api } from '@/lib/api'
import { useDoctorBackendSession } from './useDoctorBackendSession'
import { ConsultationSummaryModal } from './ConsultationSummaryModal'
import { ReportUploadDrawer } from './ReportUploadDrawer'
import { SpecialistBookingModal, type Specialist } from './SpecialistBookingModal'
import { LanguageSelectionModal, SUPPORTED_LANGUAGES } from './LanguageSelectionModal'
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
import type { WsMessage } from '@/lib/types'

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
  sources?: { title: string; year: string; url: string }[]
}

type PendingClinicalMeta = Pick<ChatEntry, 'triage' | 'warningSign' | 'actionCard'>

function appendLiveCaption(current: string, token: string) {
  const words = `${current}${token}`.trimStart().split(/\s+/).filter(Boolean)
  return words.slice(-14).join(' ')
}

interface DoctorVideoCallProps {
  initialDoctorId?: DoctorId
  onEndConsultation?: () => void
  onOpenPatient?: () => void
}

export function DoctorVideoCall({
  initialDoctorId = 'dr_arjun',
  onEndConsultation,
  onOpenPatient,
}: DoctorVideoCallProps) {
  // Doctor & Session State
  const [doctorId] = useState<DoctorId>(initialDoctorId)
  const [doctorState, setDoctorState] = useState<DoctorState>('idle')
  const [language, setLanguage] = useState<ConsultationLanguage>('kn') // Default to regional Kannada or selected
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [consultationSeconds, setConsultationSeconds] = useState(0)
  const [inputText, setInputText] = useState('')
  const [activeTriage, setActiveTriage] = useState<TriageLevel>(1)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false)
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false)
  const [summaryData, setSummaryData] = useState<ConsultationSummaryData | null>(null)
  const [reports, setReports] = useState<MedicalReportItem[]>([])
  const [doctorVideoSrc, setDoctorVideoSrc] = useState<string | null>(null)
  const [speakingVideoStartAt, setSpeakingVideoStartAt] = useState(0)
  const [isRenderingLipSync, setIsRenderingLipSync] = useState(false)
  const [hasSeparateTtsAudio, setHasSeparateTtsAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioObjectUrlRef = useRef<string | null>(null)
  const audioQueueRef = useRef<Array<{ url: string; text: string; chunkIndex: number }>>([])
  const audioStreamEndedRef = useRef(false)
  const startNextAudioRef = useRef<() => void>(() => {})
  const currentAudioChunkIndexRef = useRef<number | null>(null)
  const currentVideoChunkIndexRef = useRef<number | null>(null)
  const streamedDoctorMessageIdRef = useRef<string | null>(null)
  const streamedDoctorTextRef = useRef('')
  const pendingClinicalMetaRef = useRef<PendingClinicalMeta | null>(null)
  const doctorVideoActiveRef = useRef(false)
  const doctorVideoQueueRef = useRef<string[]>([])
  const doctorVideoTurnEndedRef = useRef(false)
  const doctorVideoFailureRef = useRef(false)

  // Conversational Session Memory (Prevents repetitive questions & tracks symptoms across turns)
  const [sessionMemorySnapshot, setSessionMemorySnapshot] = useState<ClinicalSessionMemory>(
    () => createInitialSessionMemory('kn', initialDoctorId)
  )
  const sessionMemoryRef = useRef<ClinicalSessionMemory>(
    createInitialSessionMemory('kn', initialDoctorId)
  )

  // Speech input remains available while text and video are being prepared;
  // it pauses only while actual response audio or video is playing.
  const handleSendMessageRef = useRef<(text?: string) => void>(() => {})
  const dispatchRecognizedSpeech = useCallback((text: string) => {
    handleSendMessageRef.current(text)
  }, [])
  const voiceInput = useConsultationSpeechRecognition(language, dispatchRecognizedSpeech)
  const {
    pause: pauseVoiceInput,
    resume: resumeVoiceInput,
    start: startVoiceInput,
    stop: stopVoiceInput,
  } = voiceInput
  const isListeningSpeech = voiceInput.isListening
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const clearDoctorAudio = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    currentAudioChunkIndexRef.current = null
    if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current)
    audioObjectUrlRef.current = null
    audioQueueRef.current.forEach(({ url }) => URL.revokeObjectURL(url))
    audioQueueRef.current = []
    audioStreamEndedRef.current = false
    currentVideoChunkIndexRef.current = null
    setHasSeparateTtsAudio(false)
  }, [])

  const onDoctorSpeechStateChange = useCallback((state: DoctorState) => {
    setDoctorState(state)
    if (state === 'speaking') pauseVoiceInput()
    if (state === 'listening') resumeVoiceInput()
  }, [pauseVoiceInput, resumeVoiceInput])

  const doctor = DOCTORS[doctorId] || DOCTORS.dr_arjun

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
    onStateChange: onDoctorSpeechStateChange,
  })

  useEffect(() => {
    startNextAudioRef.current = () => {
      if (audioRef.current) return
      const queuedAudio = audioQueueRef.current.shift()
      if (!queuedAudio) {
        if (audioStreamEndedRef.current) {
          if (!doctorVideoActiveRef.current) {
            setDoctorState('listening')
            setSubtitles('')
            resumeVoiceInput()
          }
        } else if (!doctorVideoActiveRef.current) {
          setDoctorState('thinking')
        }
        return
      }

      const { url: objectUrl, text, chunkIndex } = queuedAudio
      const audio = new Audio(objectUrl)
      attachAudioAnalyser(audio, isMuted)
      audioRef.current = audio
      audioObjectUrlRef.current = objectUrl
      currentAudioChunkIndexRef.current = chunkIndex
      audio.onplay = () => {
        pauseVoiceInput()
        setDoctorState('speaking')
        setSubtitles(text)
      }
      const finishAudio = () => {
        if (audioRef.current !== audio) return
        audioRef.current = null
        if (audioObjectUrlRef.current === objectUrl) audioObjectUrlRef.current = null
        if (currentAudioChunkIndexRef.current === chunkIndex) currentAudioChunkIndexRef.current = null
        if (currentVideoChunkIndexRef.current === chunkIndex) {
          currentVideoChunkIndexRef.current = null
          doctorVideoActiveRef.current = false
          setDoctorVideoSrc(null)
          setSpeakingVideoStartAt(0)
        }
        URL.revokeObjectURL(objectUrl)
        startNextAudioRef.current()
      }
      audio.onended = finishAudio
      audio.onerror = () => {
        toast.error('A part of the doctor’s spoken reply could not be played.')
        finishAudio()
      }
      void audio.play().catch(() => {
        toast.error('Audio playback was blocked. Tap the page and try again.')
        finishAudio()
      })
    }
    return () => { startNextAudioRef.current = () => {} }
  }, [isMuted, pauseVoiceInput, resumeVoiceInput, setSubtitles])

  // Chat conversation history (Only ONE message added per interaction turn)
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const patientStatements = chatHistory.filter((entry) => entry.role === 'patient')

  const handleDoctorBackendEvent = useCallback((event: WsMessage) => {
    switch (event.type) {
      case 'token':
        if (!audioRef.current && !doctorVideoActiveRef.current) setDoctorState('thinking')
        setSubtitles((current) => appendLiveCaption(current, event.token))
        streamedDoctorTextRef.current += event.token
        if (!streamedDoctorMessageIdRef.current) {
          streamedDoctorMessageIdRef.current = `doc-stream-${Date.now()}`
        }
        const liveMessageId = streamedDoctorMessageIdRef.current
        const liveMessageText = streamedDoctorTextRef.current
        setChatHistory((previous) => {
          const exists = previous.some((entry) => entry.id === liveMessageId)
          const liveEntry: ChatEntry = {
            id: liveMessageId,
            role: 'doctor',
            speakerName: DOCTORS[doctorId].name,
            text: liveMessageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          return exists
            ? previous.map((entry) => entry.id === liveMessageId ? { ...entry, text: liveEntry.text } : entry)
            : [...previous, liveEntry]
        })
        break
      case 'message':
        if (event.role === 'assistant') {
          const pendingClinicalMeta = pendingClinicalMetaRef.current
          const triage = event.triage || pendingClinicalMeta?.triage
          const streamedId = streamedDoctorMessageIdRef.current
          const completedEntry: ChatEntry = {
            id: streamedId || `doc-${Date.now()}`,
            role: 'doctor',
            speakerName: DOCTORS[doctorId].name,
            text: event.content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            triage,
            warningSign: pendingClinicalMeta?.warningSign,
            actionCard: pendingClinicalMeta?.actionCard,
            sources: event.sources,
          }
          setChatHistory((previous) => streamedId && previous.some((entry) => entry.id === streamedId)
            ? previous.map((entry) => entry.id === streamedId ? completedEntry : entry)
            : [...previous, completedEntry])
          streamedDoctorMessageIdRef.current = null
          streamedDoctorTextRef.current = ''
          if (triage) setActiveTriage(triage)
          pendingClinicalMetaRef.current = null
        }
        break
      case 'audio_chunk': {
        const binary = window.atob(event.audio_data)
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
        const objectUrl = URL.createObjectURL(new Blob([bytes], { type: event.mime_type }))
        audioQueueRef.current.push({ url: objectUrl, text: event.text, chunkIndex: event.chunk_index })
        setHasSeparateTtsAudio(true)
        setIsRenderingLipSync(true)
        startNextAudioRef.current()
        break
      }
      case 'audio_stream_end':
        audioStreamEndedRef.current = true
        startNextAudioRef.current()
        break
      case 'audio_error':
        toast.error(event.message, { id: 'consultation-audio-warning' })
        break
      case 'video_chunk_start':
        if (!hasSeparateTtsAudio) pauseVoiceInput()
        doctorVideoQueueRef.current = []
        doctorVideoTurnEndedRef.current = false
        doctorVideoFailureRef.current = false
        doctorVideoActiveRef.current = false
        setDoctorVideoSrc(null)
        currentVideoChunkIndexRef.current = null
        setSpeakingVideoStartAt(0)
        break
      case 'video_chunk':
        // Avatar rendering continues independently. Only promote a generated
        // clip if the exact audio chunk it belongs to is still playing; stale
        // CPU renders must never replay a finished sentence or steal listening.
        if (
          audioRef.current &&
          !audioRef.current.ended &&
          currentAudioChunkIndexRef.current === event.chunk_index
        ) {
          currentVideoChunkIndexRef.current = event.chunk_index
          doctorVideoActiveRef.current = true
          setDoctorVideoSrc(event.video_url)
          setSpeakingVideoStartAt(audioRef.current.currentTime)
          setDoctorState('speaking')
        }
        break
      case 'video_chunk_end':
        doctorVideoTurnEndedRef.current = true
        setIsRenderingLipSync(false)
        break
      case 'video_error':
        doctorVideoFailureRef.current = true
        doctorVideoQueueRef.current = []
        doctorVideoActiveRef.current = false
        currentVideoChunkIndexRef.current = null
        setDoctorVideoSrc(null)
        setSpeakingVideoStartAt(0)
        setIsRenderingLipSync(false)
        if (audioRef.current || audioQueueRef.current.length > 0) {
          setDoctorState('speaking')
        } else if (!hasSeparateTtsAudio) {
          setDoctorState('listening')
        }
        if (!audioRef.current && audioQueueRef.current.length === 0 && audioStreamEndedRef.current) {
          resumeVoiceInput()
        }
        // A late avatar render is an optional visual enhancement, not a failed
        // consultation. Keep it out of the patient's way when TTS succeeded.
        if (!hasSeparateTtsAudio) toast.error(event.message, { id: 'consultation-video-warning' })
        break
      case 'interrupted':
        clearDoctorAudio()
        doctorVideoQueueRef.current = []
        doctorVideoTurnEndedRef.current = true
        doctorVideoActiveRef.current = false
        currentVideoChunkIndexRef.current = null
        setDoctorVideoSrc(null)
        setSpeakingVideoStartAt(0)
        setIsRenderingLipSync(false)
        setDoctorState('listening')
        setSubtitles('')
        resumeVoiceInput()
        break
      case 'error':
        doctorVideoFailureRef.current = true
        doctorVideoQueueRef.current = []
        doctorVideoActiveRef.current = false
        setDoctorVideoSrc(null)
        setIsRenderingLipSync(false)
        setDoctorState('error')
        resumeVoiceInput()
        toast.error(event.message, { id: 'consultation-backend-error' })
        break
      case 'tts_fallback':
        toast(event.message, { icon: '⚠️', duration: 5000 })
        break
      case 'status':
        if (event.stage === 'animation' && !doctorVideoActiveRef.current) {
          setIsRenderingLipSync(true)
        } else if (event.stage === 'llm') {
          setDoctorState('thinking')
        }
        break
      case 'transcription':
      case 'pong':
        break
    }
  }, [doctorId, hasSeparateTtsAudio, setSubtitles, pauseVoiceInput, resumeVoiceInput, clearDoctorAudio])

  const doctorBackend = useDoctorBackendSession(handleDoctorBackendEvent)
  const {
    sendText: sendTextToBackend,
    interrupt: interruptBackend,
  } = doctorBackend

  const interruptDoctor = useCallback(() => {
    clearDoctorAudio()
    setIsRenderingLipSync(false)
    interrupt()
    if (doctorVideoActiveRef.current || doctorState === 'thinking' || doctorState === 'speaking' || isRenderingLipSync) {
      interruptBackend()
      doctorVideoQueueRef.current = []
      doctorVideoTurnEndedRef.current = true
      doctorVideoActiveRef.current = false
      setDoctorVideoSrc(null)
      setDoctorState('listening')
    }
    resumeVoiceInput()
  }, [interrupt, interruptBackend, doctorState, isRenderingLipSync, resumeVoiceInput, clearDoctorAudio])

  const consultationStatus = doctorBackend.status === 'connecting'
    ? 'Connecting'
    : doctorBackend.status === 'disconnected'
      ? 'Disconnected'
      : doctorState === 'speaking'
          ? 'Speaking'
          : doctorState === 'thinking'
            ? 'Thinking'
            : doctorState === 'error'
              ? 'Error'
              : isListeningSpeech
                ? 'Listening'
                : voiceInput.isEnabled
                  ? 'Connecting'
                  : 'Ready'

  const getCurrentSpokenAudioTime = useCallback((): number | null => {
    const audio = audioRef.current
    if (
      !audio ||
      audio.ended ||
      currentAudioChunkIndexRef.current === null ||
      currentAudioChunkIndexRef.current !== currentVideoChunkIndexRef.current
    ) return null
    return audio.currentTime
  }, [])

  useEffect(() => {
    if (isListeningSpeech && doctorState === 'idle') setDoctorState('listening')
  }, [isListeningSpeech, doctorState])

  useEffect(() => {
    setAudioOutputMuted(isMuted, audioRef.current)
  }, [isMuted])

  useEffect(() => () => {
    audioRef.current?.pause()
    if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current)
    audioQueueRef.current.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [])

  const handleDoctorVideoEnded = useCallback(() => {
    doctorVideoActiveRef.current = false
    currentVideoChunkIndexRef.current = null
    setDoctorVideoSrc(null)
    setSpeakingVideoStartAt(0)

    if (audioRef.current && !audioRef.current.ended) {
      setDoctorState('speaking')
      return
    }

    if (audioQueueRef.current.length > 0) {
      setDoctorState('thinking')
      return
    }

    if (audioStreamEndedRef.current) {
      setDoctorState('listening')
      setSubtitles('')
      resumeVoiceInput()
      return
    }

    setDoctorState('thinking')
  }, [setSubtitles, resumeVoiceInput])

  const handleDoctorVideoError = useCallback(() => {
    doctorVideoFailureRef.current = true
    doctorVideoQueueRef.current = []
    doctorVideoTurnEndedRef.current = true
    doctorVideoActiveRef.current = false
    currentVideoChunkIndexRef.current = null
    setDoctorVideoSrc(null)
    setSpeakingVideoStartAt(0)
    if (audioRef.current && !audioRef.current.ended) {
      setDoctorState('speaking')
    } else if (audioStreamEndedRef.current) {
      setDoctorState('listening')
      resumeVoiceInput()
    } else if (!hasSeparateTtsAudio) {
      setDoctorState('error')
      resumeVoiceInput()
      toast.error(`${doctor.name}'s generated response video could not be played.`)
    }
  }, [doctor.name, hasSeparateTtsAudio, resumeVoiceInput])

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

  const toggleMicListening = () => {
    if (voiceInput.isEnabled) {
      stopVoiceInput()
      setDoctorState('idle')
      toast('Microphone paused', { icon: '🎙️' })
      return
    }

    if (!voiceInput.isSupported) {
      toast('Voice input is not supported in this browser. You can type below.', { icon: '🎙️' })
      return
    }

    startVoiceInput()
    setDoctorState('listening')
    toast.success('Microphone active — speak naturally, then pause for a reply.', { icon: '🎙️' })
  }

  // Handle patient asking symptoms or speaking naturally
  const handleSendMessage = useCallback(
    async (customText?: string) => {
      const msg = (customText || inputText).trim()
      if (!msg) return
      streamedDoctorMessageIdRef.current = null
      streamedDoctorTextRef.current = ''

      // Let the patient interrupt while the model is thinking/rendering. Pause only
      // when audible doctor speech starts so it is not transcribed as patient speech.
      clearDoctorAudio()
      setSubtitles('')
      if (isSpeaking) interrupt()
      if (doctorVideoActiveRef.current || doctorState === 'thinking' || doctorState === 'speaking' || isRenderingLipSync) {
        interruptBackend()
        doctorVideoQueueRef.current = []
        doctorVideoTurnEndedRef.current = true
        doctorVideoActiveRef.current = false
        setDoctorVideoSrc(null)
        setIsRenderingLipSync(false)
        setHasSeparateTtsAudio(false)
        setDoctorState('listening')
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
      setSessionMemorySnapshot(result.updatedMemory)
      setActiveTriage(result.triage)
      pendingClinicalMetaRef.current = {
        triage: result.triage,
        warningSign: result.warningSign,
        actionCard: result.actionCard as ActionCardData | undefined,
      }

      // The backend response is the sole spoken answer. Its actual TTS audio
      // is passed to the model video generator for both built-in doctors.
      if (!sendTextToBackend(msg)) {
        pendingClinicalMetaRef.current = null
        setDoctorState('disconnected')
        resumeVoiceInput()
        toast.error(`${doctor.name} is not connected to the AI backend. Reconnect and try again.`, { id: 'consultation-backend-error' })
      }
    },
    [inputText, isSpeaking, interrupt, doctor.name, doctorState, isRenderingLipSync, sendTextToBackend, interruptBackend, resumeVoiceInput, clearDoctorAudio, setSubtitles]
  )

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage
  }, [handleSendMessage])

  // Language Selection Confirmation Handler (First Step Gate)
  const handleLanguageConfirm = (selectedLang: ConsultationLanguage) => {
    setLanguage(selectedLang)
    setIsLanguageModalOpen(false)
    doctorBackend.setLanguage(selectedLang)
    void doctorBackend.connect(doctorId, selectedLang).then(() => {
      setDoctorState('listening')
      if (voiceInput.isSupported) startVoiceInput(selectedLang)
      else toast('This browser does not support voice input. You can type during the consultation.', { icon: '🎙️' })
    }).catch((error) => {
      setDoctorState('disconnected')
      toast.error(error instanceof Error ? error.message : 'Could not connect to the AI consultation backend.', { id: 'consultation-backend-error' })
    })

    // Initialize session memory with selected language
    const newSessionMemory = createInitialSessionMemory(selectedLang, doctorId)
    sessionMemoryRef.current = newSessionMemory
    setSessionMemorySnapshot(newSessionMemory)

    setChatHistory([])
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0]
    toast.success(`Consultation language set: ${langConfig.label} (${langConfig.nativeName})`, {
      icon: '🌐',
    })
  }

  // Switch Language during ongoing consultation (Preserves conversation history & symptoms!)
  const handleSwitchLanguage = (newLang: ConsultationLanguage) => {
    if (newLang === language) return

    interrupt()
    interruptBackend()
    clearDoctorAudio()
    setSubtitles('')
    setIsRenderingLipSync(false)
    doctorVideoQueueRef.current = []
    doctorVideoTurnEndedRef.current = true
    doctorVideoActiveRef.current = false
    setDoctorVideoSrc(null)
    setDoctorState('listening')
    setLanguage(newLang)

    // Update session memory language while preserving symptoms & context
    const nextMemory = {
      ...sessionMemoryRef.current,
      language: newLang,
    }
    sessionMemoryRef.current = nextMemory
    setSessionMemorySnapshot(nextMemory)

    const langConfig =
      SUPPORTED_LANGUAGES.find((l) => l.code === newLang) || SUPPORTED_LANGUAGES[0]

    doctorBackend.setLanguage(newLang)
    if (voiceInput.isEnabled) {
      pauseVoiceInput()
      window.setTimeout(() => resumeVoiceInput(), 150)
    }
    toast.success(`Switched language to ${langConfig.nativeName}`, { icon: '🌐' })
  }

  // End consultation and generate structured clinical notes
  const handleEndCall = () => {
    interruptDoctor()
    stopVoiceInput()
    setIsCameraOn(false)
    const endedSessionId = doctorBackend.getSessionId()
    doctorBackend.disconnect()
    doctorVideoQueueRef.current = []
    doctorVideoActiveRef.current = false
    setDoctorVideoSrc(null)

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
      patientReportedSymptoms: patientStatements.length > 0
        ? patientStatements.map((entry) => entry.text)
        : ['No symptoms or concerns recorded'],
      symptomDuration: sessionMemoryRef.current.duration || 'Not mentioned',
      relevantHistory: 'No medical history recorded in this consultation',
      informationDiscussed: chatHistory
        .filter((entry) => entry.role === 'doctor')
        .map((entry) => entry.text)
        .filter(Boolean),
      triageLevel: activeTriage,
      triageTitle:
        activeTriage === 4
          ? 'Emergency help needed now'
          : activeTriage === 3
          ? 'Prompt medical review may be needed'
          : activeTriage === 2
          ? 'Symptoms discussed; continue assessment'
          : 'General health information',
      warningSignsIdentified:
        sessionMemoryRef.current.associatedSymptoms.length > 0
          ? sessionMemoryRef.current.associatedSymptoms
          : [],
      recommendedNextSteps: [
        ...(activeTriage === 4
          ? ['Call your local emergency number now. In India, call 112.']
          : activeTriage === 3
            ? ['Arrange a prompt review with a qualified clinician, especially if symptoms worsen.']
            : ['Continue the conversation if you have more symptoms, history, or questions to add.']),
        ...(activeTriage < 4 ? ['Seek urgent help if severe chest pain, trouble breathing, fainting, or other sudden severe symptoms occur.'] : []),
      ],
      referralRecommendation:
        activeTriage === 4
          ? 'Urgent emergency care was advised because a possible emergency warning sign was reported.'
          : activeTriage === 3
            ? 'A clinician review may be appropriate based on the symptoms discussed.'
            : 'No referral was suggested based on the information shared in this conversation.',
      disclaimer:
        'MediCare is an AI virtual medical assistant and is not an autonomous licensed doctor. No clinical diagnosis, prescription, or regulated medical service is provided. In emergencies, call 112 immediately.',
    }

    setSummaryData(summary)
    setIsSummaryModalOpen(true)

    // Persist the report to the database (best effort; the on-screen summary never depends on it).
    if (endedSessionId) {
      api
        .saveConsultationReport(endedSessionId, {
          doctor_id: doctorId,
          language,
          triage_level: activeTriage,
          duration_seconds: consultationSeconds,
          report: { ...summary },
        })
        .catch((err) => console.warn('Could not save consultation report', err))
    }
  }

  return (
    <div className="relative w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] flex flex-col bg-[#f3f7fc] text-slate-900 overflow-x-hidden font-sans">
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
              speakerName: 'MediCare',
              text: `Appointment request submitted for ${details.doctor_name} at ${details.hospital} on ${details.date} (${details.time_slot}). Please contact the clinic to confirm availability. Request ID: ${details.booking_id}.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
        }}
      />

      {/* ── Report Upload Drawer ── */}
      <ReportUploadDrawer
        isOpen={isReportDrawerOpen}
        onClose={() => setIsReportDrawerOpen(false)}
        onReportAnalyzed={(rep: MedicalReportItem) => {
          setReports((prev) => [...prev, rep])
        }}
        onDiscussWithDoctor={(reportText) => {
          setIsReportDrawerOpen(false)
          handleSendMessageRef.current(`Please help me understand this laboratory report. Here is the report text: ${reportText}`)
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
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-3 z-30 flex-shrink-0 shadow-sm">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4f6580] flex items-center justify-center text-white shadow-sm">
            <HeartPulse size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Medicus Labs <span className="font-medium text-teal-700">· MediCare</span>
              </span>
              <span className="hidden xl:inline text-[10px] uppercase px-2 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100 font-semibold">
                Care consultation
              </span>
            </div>
            <span className="text-xs text-slate-500">
              With <span className="text-slate-800 font-semibold">{doctor.name}</span>
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Clock size={14} className="text-teal-700" />
            <span>{formatTimer(consultationSeconds)}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
            <span className={`w-2 h-2 rounded-full ${consultationStatus === 'Listening' ? 'bg-emerald-500' : consultationStatus === 'Speaking' ? 'bg-teal-600' : consultationStatus === 'Error' || consultationStatus === 'Disconnected' ? 'bg-rose-500' : consultationStatus === 'Thinking' || consultationStatus === 'Connecting' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span className="font-medium">{consultationStatus}</span>
          </div>
        </div>

        {/* Right Controls: Language Selector Dropdown & End Call */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPatient}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50 px-2.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 sm:px-3"
            aria-label="Open patient portal"
          >
            <UserRound size={15} aria-hidden="true" />
            <span>Patient</span>
          </button>

          {/* Active Language Pill & Switcher */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-sm">
            <Globe size={14} className="text-teal-700 ml-1.5 mr-0.5" />
            <select
              value={language}
              onChange={(e) => handleSwitchLanguage(e.target.value as ConsultationLanguage)}
              aria-label="Consultation language"
              className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer pr-1 py-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-slate-900">
                  {l.nativeName} ({l.label})
                </option>
              ))}
            </select>
          </div>

        </div>
      </header>

      {/* ── MAIN CONSULTATION LAYOUT: DOCTOR-FOCUSED VIDEO + TRANSCRIPT ── */}
      <div className="relative flex-1 min-h-0 w-full max-w-[1600px] mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden">
        {/* ── MAIN CONSULTATION AREA ── */}
        <section className="relative w-full lg:flex-[1.75] h-[60vh] min-h-[380px] lg:h-auto lg:min-h-0 flex flex-col bg-[#101b25] overflow-hidden rounded-3xl border border-slate-200 shadow-xl">
          {/* Doctor video viewport */}
          <div className="relative w-full flex-1 overflow-hidden">
            <PhotorealisticDigitalHuman
              doctorId={doctorId}
              doctorState={doctorState}
              isMuted={isMuted}
              hasSeparateTtsAudio={hasSeparateTtsAudio}
              subtitles={subtitles}
              fallbackSpeechLevel={audioLevel}
              speakingVideoSrc={doctorVideoSrc}
              speakingVideoStartAt={speakingVideoStartAt}
              getSpeakingAudioTime={getCurrentSpokenAudioTime}
              onSpeakingVideoEnded={handleDoctorVideoEnded}
              onSpeakingVideoError={handleDoctorVideoError}
              onStateChange={(st) => setDoctorState(st)}
              onReconnect={() => {
                void doctorBackend.connect(doctorId, language).then(() => setDoctorState('listening')).catch((error) => {
                  setDoctorState('disconnected')
                  toast.error(error instanceof Error ? error.message : 'Could not reconnect to the consultation backend.', { id: 'consultation-backend-error' })
                })
              }}
              className="w-full h-full"
            />

            {/* Floating Patient Camera Window (PiP) */}
            <div className="absolute top-4 right-4 z-20">
              <PatientWebcamPiP
                isCameraOn={isCameraOn}
                isMicOn={isListeningSpeech}
                onToggleCamera={() => setIsCameraOn((prev) => !prev)}
                onToggleMic={toggleMicListening}
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
          <div className="min-h-[76px] border-t border-slate-700/70 bg-white px-3 sm:px-5 flex items-center justify-between gap-2 z-20 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 min-w-[130px]">
              <span className={`w-2 h-2 rounded-full ${isListeningSpeech ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>{isListeningSpeech ? 'Listening to you' : voiceInput.isEnabled ? 'Mic paused for reply' : 'Voice off'}</span>
            </div>

            {/* Center: Essential Telemedicine Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mic Speech Button */}
              <button
                onClick={toggleMicListening}
                aria-label={voiceInput.isEnabled ? 'Turn microphone off' : 'Turn microphone on'}
                aria-pressed={voiceInput.isEnabled}
                className={`h-12 w-12 sm:w-auto sm:px-4 rounded-2xl text-xs font-semibold flex items-center justify-center sm:justify-start gap-2 transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-teal-100 ${
                  voiceInput.isEnabled
                    ? 'bg-teal-700 text-white hover:bg-teal-800'
                    : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
                title="Speak naturally. Pause when you finish and the doctor will reply."
              >
                {voiceInput.isEnabled ? <Mic size={17} /> : <MicOff size={17} />}
                <span className="hidden sm:inline">{voiceInput.isEnabled ? (isListeningSpeech ? 'Listening' : 'Mic on') : 'Start speaking'}</span>
              </button>

              {/* Camera Toggle */}
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
                className={`h-11 w-11 sm:w-auto sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  isCameraOn
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
                title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
              >
                {isCameraOn ? <Video size={15} /> : <VideoOff size={15} />}
                <span className="hidden sm:inline">{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              {/* Speaker Mute */}
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute doctor' : 'Mute doctor'}
                aria-pressed={isMuted}
                className={`h-11 w-11 sm:w-auto sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  isMuted
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title={isMuted ? 'Unmute Doctor' : 'Mute Doctor'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio'}</span>
              </button>

              {/* Patient Interrupt Button */}
              <button
                onClick={interruptDoctor}
                disabled={doctorState !== 'speaking' && doctorState !== 'thinking' && !isSpeaking}
                className="h-11 w-11 sm:w-auto sm:px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold flex items-center justify-center sm:justify-start gap-1.5 transition-all"
                title="Interrupt doctor politely"
                aria-label="Interrupt doctor"
              >
                <Hand size={14} className="text-teal-700" />
                <span className="hidden sm:inline">Interrupt</span>
              </button>
            </div>

            {/* Right: End Call & Summary Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleEndCall}
                className="h-11 w-11 sm:w-auto sm:px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                aria-label="End call and create summary"
              >
                <PhoneOff size={14} />
                <span className="hidden sm:inline">End Call &amp; Summary</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── TRANSCRIPT SIDEBAR ── */}
        <aside className="w-full lg:w-[390px] xl:w-[420px] h-[38vh] min-h-[270px] lg:h-auto lg:min-h-0 border border-slate-200 bg-white flex flex-col z-20 flex-shrink-0 rounded-3xl shadow-sm overflow-hidden">
          {/* Transcript Header */}
          <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-teal-700" />
              <span className="font-semibold text-sm text-slate-900">Conversation</span>
            </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{SUPPORTED_LANGUAGES.find((item) => item.code === language)?.nativeName}</span>
                <button
                  type="button"
                  onClick={() => setIsReportDrawerOpen(true)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
                >
                  <FileText size={14} className="text-teal-800" />
                  <span>Report</span>
                </button>
              </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 bg-[#f6f9fd]" aria-live="polite" role="status">
            {voiceInput.error ? (
              <p className="text-xs leading-relaxed text-rose-700">{voiceInput.error}</p>
            ) : voiceInput.transcript ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-800 mb-1">I heard</p>
                <p className="text-sm text-slate-700 leading-relaxed">{voiceInput.transcript}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {isListeningSpeech
                  ? 'Listening. Speak naturally; pause briefly when you want a reply.'
                  : voiceInput.isEnabled
                    ? 'Your microphone will resume after the doctor finishes.'
                    : 'Turn on the microphone to talk, or type a message below.'}
              </p>
            )}
          </div>

          {/* Running consultation note: only patient statements and fields the intake recognizer captured. */}
          <section className="mx-4 mt-3 rounded-xl border border-teal-100 bg-teal-50/70 p-3" aria-live="polite">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-teal-950">Consultation notes</h3>
              <span className="text-[10px] text-teal-800">Updates as you speak</span>
            </div>
            {sessionMemorySnapshot.chiefComplaints.length > 0 || sessionMemorySnapshot.duration ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {sessionMemorySnapshot.chiefComplaints.map((complaint) => (
                  <span key={complaint} className="rounded-full border border-teal-200 bg-white px-2 py-0.5 text-[11px] text-slate-700">{complaint}</span>
                ))}
                {sessionMemorySnapshot.duration && (
                  <span className="rounded-full border border-teal-200 bg-white px-2 py-0.5 text-[11px] text-slate-700">Duration: {sessionMemorySnapshot.duration}</span>
                )}
              </div>
            ) : null}
            {patientStatements.length > 0 ? (
              <ul className="max-h-24 space-y-1 overflow-y-auto text-xs leading-relaxed text-slate-700">
                {patientStatements.map((statement) => <li key={statement.id}>• {statement.text}</li>)}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Your spoken and typed details will appear here. Nothing is inferred when you haven’t mentioned it.</p>
            )}
            {voiceInput.transcript && (
              <p className="mt-2 border-t border-teal-100 pt-2 text-xs text-teal-900"><span className="font-semibold">Hearing now: </span>{voiceInput.transcript}</p>
            )}
          </section>

          {/* Transcript Messages List */}
          <div ref={chatScrollRef} tabIndex={0} role="log" aria-label="Conversation transcript" className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm">
            {chatHistory.length === 0 && (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center px-5">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mb-3">
                  <HeartPulse size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-800">Start with what brought you in</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Your words will appear here, followed by the doctor’s response.</p>
              </div>
            )}
            {chatHistory.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col ${
                  item.role === 'patient' ? 'items-end' : 'items-start'
                } animate-fade-in`}
              >
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-slate-600">
                  <span className="font-semibold text-slate-600">{item.speakerName}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>

                <div
                    className={`max-w-[94%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    item.role === 'patient'
                      ? 'bg-[#123d55] text-white rounded-br-md shadow-sm'
                      : 'bg-[#f1f6fc] text-slate-800 border border-slate-100 rounded-bl-md'
                  }`}
                >
                  <p>{item.text}</p>

                  {item.sources && item.sources.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Medical sources</p>
                      <ul className="space-y-1">
                        {item.sources.map((source) => (
                          <li key={source.url}>
                            <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-teal-800 underline underline-offset-2 hover:text-teal-950">
                              {source.title} ({source.year})
                            </a>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                        PubMed records are provided by the U.S. National Library of Medicine. Their inclusion is not an endorsement; article abstracts may be copyrighted by their publishers or authors.{' '}
                        <a href="https://www.ncbi.nlm.nih.gov/home/about/policies/" target="_blank" rel="noreferrer" className="underline underline-offset-2">NCBI policies</a>.
                      </p>
                    </div>
                  )}

                  {item.actionCard?.type === 'report_analysis' && (
                    <button
                      type="button"
                      onClick={() => setIsReportDrawerOpen(true)}
                      className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#123d55] px-3 text-xs font-semibold text-white hover:bg-[#0d3145]"
                    >
                      <FileText size={14} />
                      Review report text
                    </button>
                  )}

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
          <div className="p-4 border-t border-slate-100 bg-white">
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
                aria-label="Type a message for the doctor"
                className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-11 w-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
                title="Send message"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>

            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-600 mt-2 px-1">
              <span>Health information only</span>
              <a href="tel:112" className="text-rose-700 font-medium hover:underline">Emergency: 112</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
