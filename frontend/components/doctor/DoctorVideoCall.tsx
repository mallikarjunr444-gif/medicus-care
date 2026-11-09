'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BrandLogo } from '@/components/ui/BrandLogo'
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
import { VoiceOrb } from '@/components/ui/voice-orb'
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
  const [panelTab, setPanelTab] = useState<'chat' | 'notes'>('chat')
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
  // Tokens are useful live subtitles until the first generated audio starts.
  // After that point, keep subtitles on the exact audio chunk being played so
  // the caption does not run ahead of the doctor's voice.
  const responseAudioStartedRef = useRef(false)
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
    responseAudioStartedRef.current = false
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
        responseAudioStartedRef.current = true
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
        if (!responseAudioStartedRef.current) {
          setSubtitles((current) => appendLiveCaption(current, event.token))
        }
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

  // Whose turn it is, in plain words. Drives the stage chip and the dock next to the microphone.
  const turn = (() => {
    const name = doctor.name
    switch (consultationStatus) {
      case 'Speaking':
        return { chip: `${name} is speaking`, title: `${name} is replying`, hint: 'You can interrupt at any time.', dot: 'bg-clinic-teal', pulse: true }
      case 'Thinking':
        return { chip: `${name} is thinking`, title: 'Thinking…', hint: 'Preparing a reply.', dot: 'bg-[#c98a1d]', pulse: true }
      case 'Connecting':
        return { chip: 'Connecting', title: 'Connecting…', hint: 'Getting the microphone ready.', dot: 'bg-[#c98a1d]', pulse: true }
      case 'Disconnected':
      case 'Error':
        return { chip: consultationStatus === 'Error' ? 'Something went wrong' : 'Disconnected', title: 'Connection lost', hint: 'Check your network, then reconnect.', dot: 'bg-clinic-brick', pulse: false }
      case 'Listening':
        return { chip: 'Listening to you', title: 'Listening', hint: 'Speak naturally. Pause when you finish.', dot: 'bg-clinic-teal', pulse: true }
      default:
        return { chip: 'Ready', title: 'Tap the microphone to speak', hint: 'Or type in the panel on the right.', dot: 'bg-slate-400', pulse: false }
    }
  })()
  const notesCount =
    sessionMemorySnapshot.chiefComplaints.length + patientStatements.length + (sessionMemorySnapshot.duration ? 1 : 0)

  return (
    <div className="font-consult relative w-full min-h-[100dvh] lg:h-[100dvh] flex flex-col bg-clinic-porcelain text-clinic-ink overflow-x-hidden">
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

      {/* ── HEADER ── */}
      <header className="h-16 border-b border-clinic-hairline bg-clinic-surface px-4 sm:px-6 flex items-center justify-between gap-3 z-30 flex-shrink-0">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4 md:flex-none">
          <BrandLogo className="h-7 w-[84px] sm:h-9 sm:w-[124px] shrink-0" priority />
          <span className="h-7 w-px shrink-0 bg-clinic-hairline sm:h-8" aria-hidden="true" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-bold text-clinic-ink">{doctor.name}</p>
            <p className="hidden sm:block truncate text-[13px] text-clinic-muted">{doctor.specialty}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[13px] text-clinic-muted" aria-label="Consultation time">
          <Clock size={15} className="text-clinic-teal" aria-hidden="true" />
          <span className="font-semibold tabular-nums text-clinic-ink">{formatTimer(consultationSeconds)}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenPatient}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-clinic-hairline bg-clinic-surface px-3 text-[13px] font-semibold text-clinic-ink transition hover:bg-clinic-porcelain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/25"
            aria-label="Open patient portal"
          >
            <UserRound size={16} className="text-clinic-teal" aria-hidden="true" />
            <span className="hidden sm:inline">Patient</span>
          </button>

          <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-clinic-hairline bg-clinic-surface pl-3 pr-2 text-[13px] focus-within:ring-4 focus-within:ring-clinic-teal/25">
            <Globe size={16} className="text-clinic-teal" aria-hidden="true" />
            <select
              value={language}
              onChange={(e) => handleSwitchLanguage(e.target.value as ConsultationLanguage)}
              aria-label="Consultation language"
              className="max-w-[6.5rem] cursor-pointer truncate bg-transparent py-1 pr-1 text-[13px] font-semibold text-clinic-ink focus:outline-none sm:max-w-none"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-slate-900">
                  {l.nativeName === l.label ? l.label : `${l.nativeName} (${l.label})`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {/* ── MAIN: DOCTOR STAGE + CONVERSATION ── */}
      <div className="relative flex-1 min-h-0 w-full max-w-[1600px] mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-5 overflow-y-auto lg:overflow-hidden">
        {/* ── STAGE ── */}
        <section
          aria-label={`Video consultation with ${doctor.name}`}
          className="relative w-full lg:flex-[1.75] h-[66vh] min-h-[420px] lg:h-auto lg:min-h-0 flex flex-col overflow-hidden rounded-[20px] border border-clinic-hairline bg-clinic-surface"
        >
          <div className="relative w-full flex-1 min-h-0 overflow-hidden bg-clinic-ink">
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

            {/* Who has the floor */}
            <div
              role="status"
              aria-live="polite"
              className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-3 pr-3.5 text-[13px] font-semibold text-clinic-ink shadow-[0_1px_2px_rgba(15,47,54,.18)] backdrop-blur"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${turn.dot} ${turn.pulse ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
              {turn.chip}
            </div>

            {/* Patient camera preview */}
            <div className="absolute top-4 right-4 z-20">
              <PatientWebcamPiP
                isCameraOn={isCameraOn}
                isMicOn={isListeningSpeech}
                onToggleCamera={() => setIsCameraOn((prev) => !prev)}
                onToggleMic={toggleMicListening}
              />
            </div>

            {/* Emergency banner (triage level 4) */}
            {activeTriage === 4 && (
              <div role="alert" className="absolute top-16 left-4 right-4 z-30 mx-auto max-w-xl rounded-2xl bg-clinic-brick p-4 text-white shadow-[0_8px_24px_rgba(15,47,54,.35)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert size={24} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-[15px] font-bold">Possible emergency warning signs</p>
                      <p className="mt-0.5 text-[13px] text-white/90">
                        Call 112 (national emergency) or 108 (Arogya Kavacha, Karnataka) now.
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:112"
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-[14px] font-bold text-clinic-brick-deep hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    <PhoneCall size={16} aria-hidden="true" />
                    Dial 112
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── DOCK: whose turn it is, then the controls ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-clinic-hairline bg-clinic-surface px-4 py-3 sm:px-6 sm:flex-nowrap">
            <div className="flex min-w-0 items-center gap-3 sm:flex-1">
              <button
                onClick={toggleMicListening}
                aria-label={voiceInput.isEnabled ? 'Turn microphone off' : 'Turn microphone on'}
                aria-pressed={voiceInput.isEnabled}
                title="Speak naturally. Pause when you finish and the doctor will reply."
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/30 ${
                  voiceInput.isEnabled
                    ? 'bg-clinic-teal text-white hover:bg-clinic-teal-deep'
                    : 'border-2 border-clinic-hairline bg-clinic-surface text-clinic-teal hover:bg-clinic-mist'
                } ${isListeningSpeech ? 'ring-4 ring-clinic-teal/25' : ''}`}
              >
                {voiceInput.isEnabled ? (
                  <VoiceOrb
                    activity={Math.min(1, Math.max(0.2, audioLevel * 2))}
                    colors={['#e6fffb', '#5eead4', '#0c6e70']}
                    className="h-7 w-7 shrink-0"
                    speed={1.5}
                  />
                ) : (
                  <MicOff size={22} aria-hidden="true" />
                )}
              </button>
              <div className="min-w-0 leading-snug">
                <p className="truncate text-[16px] font-bold text-clinic-ink">{turn.title}</p>
                <p className="text-[13px] text-clinic-muted">{turn.hint}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
                aria-pressed={isCameraOn}
                title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-clinic-hairline bg-clinic-surface px-3 text-[13px] font-semibold text-clinic-ink transition hover:bg-clinic-porcelain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/25"
              >
                {isCameraOn ? <Video size={17} className="text-clinic-teal" aria-hidden="true" /> : <VideoOff size={17} className="text-clinic-muted" aria-hidden="true" />}
                <span className="hidden lg:inline">{isCameraOn ? 'Camera on' : 'Camera off'}</span>
              </button>

              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute doctor' : 'Mute doctor'}
                aria-pressed={isMuted}
                title={isMuted ? 'Unmute doctor' : 'Mute doctor'}
                className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/25 ${
                  isMuted
                    ? 'border-amber-300 bg-amber-50 text-clinic-amber'
                    : 'border-clinic-hairline bg-clinic-surface text-clinic-ink hover:bg-clinic-porcelain'
                }`}
              >
                {isMuted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} className="text-clinic-teal" aria-hidden="true" />}
                <span className="hidden lg:inline">{isMuted ? 'Doctor muted' : 'Doctor audio'}</span>
              </button>

              <button
                onClick={interruptDoctor}
                disabled={doctorState !== 'speaking' && doctorState !== 'thinking' && !isSpeaking}
                title="Interrupt the doctor politely"
                aria-label="Interrupt doctor"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-clinic-hairline bg-clinic-surface px-3 text-[13px] font-semibold text-clinic-ink transition hover:bg-clinic-porcelain disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/25"
              >
                <Hand size={17} className="text-clinic-teal" aria-hidden="true" />
                <span className="hidden lg:inline">Interrupt</span>
              </button>

              <button
                onClick={handleEndCall}
                aria-label="End call and create summary"
                className="ml-1 inline-flex h-11 items-center gap-2 rounded-xl bg-clinic-brick px-3.5 text-[13px] font-bold text-white transition hover:bg-clinic-brick-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-brick/30"
              >
                <PhoneOff size={17} aria-hidden="true" />
                <span className="hidden sm:inline">End call &amp; summary</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── CONVERSATION PANEL ── */}
        <aside className="w-full lg:w-[400px] xl:w-[440px] h-[56vh] min-h-[360px] lg:h-auto lg:min-h-0 flex flex-col flex-shrink-0 overflow-hidden rounded-[20px] border border-clinic-hairline bg-clinic-surface">
          {/* Tabs + report */}
          <div className="flex items-end gap-4 border-b border-clinic-hairline px-4 sm:gap-6 sm:px-5">
            <div role="tablist" aria-label="Consultation panel" className="flex items-end gap-4 sm:gap-6">
              <button
                type="button"
                role="tab"
                id="tab-chat"
                aria-selected={panelTab === 'chat'}
                aria-controls="panel-chat"
                onClick={() => setPanelTab('chat')}
                className={`-mb-px border-b-2 py-3.5 text-[15px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/25 ${
                  panelTab === 'chat' ? 'border-clinic-teal text-clinic-ink' : 'border-transparent text-clinic-muted hover:text-clinic-ink'
                }`}
              >
                Conversation
              </button>
              <button
                type="button"
                role="tab"
                id="tab-notes"
                aria-selected={panelTab === 'notes'}
                aria-controls="panel-notes"
                onClick={() => setPanelTab('notes')}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 py-3.5 text-[15px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/25 ${
                  panelTab === 'notes' ? 'border-clinic-teal text-clinic-ink' : 'border-transparent text-clinic-muted hover:text-clinic-ink'
                }`}
              >
                Notes
                {notesCount > 0 && (
                  <span className="rounded-full bg-clinic-mist px-2 py-0.5 text-[12px] font-bold leading-none text-clinic-teal-deep">{notesCount}</span>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsReportDrawerOpen(true)}
              className="mb-2 ml-auto inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold text-clinic-teal-deep transition hover:bg-clinic-mist focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/25"
            >
              <FileText size={16} aria-hidden="true" />
              <span className="sm:hidden">Report</span>
              <span className="hidden sm:inline">Add a report</span>
            </button>
          </div>

          {/* What the microphone just heard */}
          <div className="border-b border-clinic-hairline bg-clinic-porcelain/70 px-5 py-2.5" aria-live="polite" role="status">
            {voiceInput.error ? (
              <p className="text-[13px] leading-relaxed text-clinic-brick-deep">{voiceInput.error}</p>
            ) : voiceInput.transcript ? (
              <p className="text-[14px] leading-[1.6] text-clinic-ink">
                <span className="mr-2 font-bold text-clinic-teal-deep">I heard</span>
                {voiceInput.transcript}
              </p>
            ) : (
              <p className="text-[13px] text-clinic-muted">
                {isListeningSpeech
                  ? 'Listening. Speak naturally; pause briefly when you want a reply.'
                  : voiceInput.isEnabled
                    ? 'Your microphone will resume after the doctor finishes.'
                    : 'Turn on the microphone to talk, or type a message below.'}
              </p>
            )}
          </div>

          {/* Notes */}
          <section
            id="panel-notes"
            role="tabpanel"
            aria-labelledby="tab-notes"
            hidden={panelTab !== 'notes'}
            className={`${panelTab === 'notes' ? 'block' : 'hidden'} flex-1 min-h-0 overflow-y-auto px-5 py-4`}
            aria-live="polite"
          >
            <h3 className="text-[15px] font-bold text-clinic-ink">What you have told the doctor</h3>
            <p className="mt-0.5 text-[13px] text-clinic-muted">Updates as you speak. Nothing is added that you did not say.</p>
            {sessionMemorySnapshot.chiefComplaints.length > 0 || sessionMemorySnapshot.duration ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {sessionMemorySnapshot.chiefComplaints.map((complaint) => (
                  <span key={complaint} className="rounded-full bg-clinic-mist px-3 py-1 text-[13px] font-semibold text-clinic-teal-deep">{complaint}</span>
                ))}
                {sessionMemorySnapshot.duration && (
                  <span className="rounded-full bg-clinic-mist px-3 py-1 text-[13px] font-semibold text-clinic-teal-deep">For {sessionMemorySnapshot.duration}</span>
                )}
              </div>
            ) : null}
            {patientStatements.length > 0 ? (
              <ul className="mt-3 divide-y divide-clinic-hairline border-y border-clinic-hairline text-[14px] leading-[1.65] text-clinic-ink">
                {patientStatements.map((statement) => <li key={statement.id} className="py-2.5">{statement.text}</li>)}
              </ul>
            ) : (
              <p className="mt-4 text-[14px] leading-relaxed text-clinic-muted">Your spoken and typed details will appear here.</p>
            )}
            {voiceInput.transcript && (
              <p className="mt-3 text-[13px] text-clinic-teal-deep"><span className="font-bold">Hearing now: </span>{voiceInput.transcript}</p>
            )}
          </section>

          {/* Conversation */}
          <div
            id="panel-chat"
            role="tabpanel"
            aria-labelledby="tab-chat"
            hidden={panelTab !== 'chat'}
            className={`${panelTab === 'chat' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}
          >
            <div ref={chatScrollRef} tabIndex={0} role="log" aria-label="Conversation transcript" className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-clinic-teal/25">
              {chatHistory.length === 0 && (
                <div className="flex h-full min-h-[140px] flex-col items-center justify-center px-5 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-clinic-mist text-clinic-teal">
                    <HeartPulse size={22} aria-hidden="true" />
                  </div>
                  <p className="text-[16px] font-bold text-clinic-ink">Start with what brought you in</p>
                  <p className="mt-1 max-w-[260px] text-[14px] leading-relaxed text-clinic-muted">Your words will appear here, followed by the doctor’s response.</p>
                </div>
              )}
              {chatHistory.map((item) => (
                <div key={item.id} className={`flex flex-col ${item.role === 'patient' ? 'items-end' : 'items-start'}`}>
                  <div className="mb-1.5 flex items-baseline gap-2 text-[13px] text-clinic-muted">
                    <span className="font-bold text-clinic-ink">{item.speakerName}</span>
                    <span className="tabular-nums">{item.time}</span>
                  </div>

                  <div
                    className={
                      item.role === 'patient'
                        ? 'max-w-[92%] rounded-2xl rounded-br-md bg-clinic-ink px-4 py-3 text-[15px] leading-[1.7] text-white'
                        : 'w-full border-l-[3px] border-clinic-teal pl-4 text-[15px] leading-[1.7] text-clinic-ink'
                    }
                  >
                    <p>{item.text}</p>

                    {item.sources && item.sources.length > 0 && (
                      <div className="mt-3 border-t border-clinic-hairline pt-3">
                        <p className="mb-1 text-[13px] font-bold text-clinic-muted">Medical sources</p>
                        <ul className="space-y-1">
                          {item.sources.map((source) => (
                            <li key={source.url}>
                              <a href={source.url} target="_blank" rel="noreferrer" className="text-[13px] font-semibold leading-snug text-clinic-teal underline underline-offset-2 hover:text-clinic-teal-deep">
                                {source.title} ({source.year})
                              </a>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[12px] leading-relaxed text-clinic-muted">
                          PubMed records are provided by the U.S. National Library of Medicine. Their inclusion is not an endorsement; article abstracts may be copyrighted by their publishers or authors.{' '}
                          <a href="https://www.ncbi.nlm.nih.gov/home/about/policies/" target="_blank" rel="noreferrer" className="underline underline-offset-2">NCBI policies</a>.
                        </p>
                      </div>
                    )}

                    {item.actionCard?.type === 'report_analysis' && (
                      <button
                        type="button"
                        onClick={() => setIsReportDrawerOpen(true)}
                        className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-clinic-teal px-3.5 text-[13px] font-bold text-white transition hover:bg-clinic-teal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/30"
                      >
                        <FileText size={16} aria-hidden="true" />
                        Review report text
                      </button>
                    )}

                    {/* Specialist referral */}
                    {item.actionCard?.type === 'specialist_recommendation' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[13px] font-bold text-clinic-muted">Verified Karnataka healthcare specialists</p>
                        {item.actionCard.payload.specialists.map((spec: Specialist) => (
                          <div key={spec.id} className="rounded-xl border border-clinic-hairline bg-clinic-porcelain/60 p-3 text-[13px]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-bold text-clinic-ink">{spec.name}</span>
                              <button
                                onClick={() => setIsSpecialistModalOpen(true)}
                                className="h-9 shrink-0 rounded-lg bg-clinic-teal px-3 text-[13px] font-bold text-white transition hover:bg-clinic-teal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/30"
                              >
                                Book a visit
                              </button>
                            </div>
                            <p className="mt-1 text-clinic-muted">{spec.specialty} · {spec.hospital}</p>
                            <p className="text-clinic-muted">{spec.location}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Box breathing */}
                    {item.actionCard?.type === 'breathing_exercise' && (
                      <div className="mt-3 rounded-xl bg-clinic-mist p-4 text-clinic-ink">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-clinic-teal-deep">
                          <Wind size={17} aria-hidden="true" />
                          <span>Box breathing: in for 4, hold for 4, out for 4</span>
                        </div>
                        <p className="mt-1 text-[13px] text-clinic-muted">
                          Breathe along with {doctor.name} to settle your heart rate.
                        </p>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                          <div className="h-full w-2/3 rounded-full bg-clinic-teal motion-safe:animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div className="border-t border-clinic-hairline px-5 py-4">
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
                className="h-12 min-w-0 flex-1 rounded-xl border border-clinic-hairline bg-white px-4 text-[15px] text-clinic-ink placeholder:text-clinic-muted/80 focus:border-clinic-teal focus:outline-none focus:ring-4 focus:ring-clinic-teal/20"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                title="Send message"
                aria-label="Send message"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-clinic-teal text-white transition hover:bg-clinic-teal-deep disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/30"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between gap-2 text-[13px]">
              <span className="text-clinic-muted">Health information only</span>
              <a href="tel:112" className="inline-flex items-center gap-1.5 font-bold text-clinic-brick-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-brick/25 rounded">
                <PhoneCall size={14} aria-hidden="true" />
                Emergency? Call 112
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
