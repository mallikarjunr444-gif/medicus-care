'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ConsultationLanguage, DoctorId, DoctorState } from '@/lib/doctorTypes'

interface UseDoctorSpeechOptions {
  doctorId: DoctorId
  language: ConsultationLanguage
  onStateChange: (state: DoctorState) => void
  onSubtitleUpdate?: (text: string) => void
}

export function useDoctorSpeech({
  doctorId,
  language,
  onStateChange,
  onSubtitleUpdate,
}: UseDoctorSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [subtitles, setSubtitles] = useState('')

  const synthRef = useRef<SpeechSynthesis | null>(null)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize SpeechSynthesis and ensure voices are loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      // Unlock voices on load
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
    }
  }, [])

  // Resolve matching speech voice
  const getDoctorVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null
    const voices = synthRef.current.getVoices()
    if (!voices || voices.length === 0) return null

    const langMap: Record<ConsultationLanguage, string> = {
      kn: 'kn',
      hi: 'hi',
      en: 'en',
      te: 'te',
      ta: 'ta',
      ml: 'ml',
      mr: 'mr',
      bn: 'bn',
      gu: 'gu',
    }
    const prefix = langMap[language] || 'en'
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix))

    if (langVoices.length > 0) {
      if (doctorId === 'dr_ananya') {
        const femaleVoice = langVoices.find((v) =>
          /female|woman|girl|samantha|zira|swara|kalpana|veena|geeta|leela/i.test(v.name)
        )
        if (femaleVoice) return femaleVoice
      } else {
        const maleVoice = langVoices.find((v) =>
          /male|man|boy|david|george|ravi|madhav|rishi|karthik|suresh/i.test(v.name)
        )
        if (maleVoice) return maleVoice
      }
      return langVoices[0]
    }

    return voices.find((v) => v.lang.startsWith('en')) || voices[0]
  }, [language, doctorId])

  // Speak doctor response with watchdog & Chrome GC fix
  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return

      // Cancel previous speech if ongoing
      synthRef.current.cancel()
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)

      onStateChange('speaking')
      setIsSpeaking(true)
      setSubtitles(text)
      if (onSubtitleUpdate) onSubtitleUpdate(text)

      const utterance = new SpeechSynthesisUtterance(text)
      // Retain utterance on window to prevent Chrome garbage-collection lockup
      if (typeof window !== 'undefined') {
        ;(window as any).__medicare_active_utterance = utterance
      }
      activeUtteranceRef.current = utterance

      const voice = getDoctorVoice()
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

      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      } else {
        utterance.lang = bcp47Map[language] || 'en-IN'
      }

      utterance.pitch = doctorId === 'dr_ananya' ? 1.08 : 0.94
      utterance.rate = 0.96
      utterance.volume = isMuted ? 0 : 1

      // Viseme frequency modulation
      animIntervalRef.current = setInterval(() => {
        const amp = 0.25 + 0.65 * Math.abs(Math.sin(Date.now() / 110) * Math.cos(Date.now() / 240))
        setAudioLevel(amp)
      }, 50)

      const handleEnd = () => {
        setIsSpeaking(false)
        setAudioLevel(0)
        if (animIntervalRef.current) {
          clearInterval(animIntervalRef.current)
          animIntervalRef.current = null
        }
        if (watchdogTimerRef.current) {
          clearTimeout(watchdogTimerRef.current)
          watchdogTimerRef.current = null
        }
        if (typeof window !== 'undefined') {
          delete (window as any).__medicare_active_utterance
        }
        onStateChange('listening')
      }

      utterance.onend = handleEnd
      utterance.onerror = handleEnd

      // Safety watchdog: If utterance fails to emit onend (Chrome bug), release state automatically
      // Average 15 chars per second
      const estimatedDurationMs = Math.max(2500, (text.length / 15) * 1000 + 1500)
      watchdogTimerRef.current = setTimeout(() => {
        if (synthRef.current?.speaking === false) {
          handleEnd()
        }
      }, estimatedDurationMs)

      synthRef.current.speak(utterance)
    },
    [doctorId, language, isMuted, getDoctorVoice, onStateChange, onSubtitleUpdate]
  )

  // Barge-In & Instant Patient Interruption
  const interrupt = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current)
      animIntervalRef.current = null
    }
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current)
      watchdogTimerRef.current = null
    }
    setIsSpeaking(false)
    setAudioLevel(0)
    onStateChange('interrupted')

    setTimeout(() => {
      onStateChange('listening')
    }, 400)
  }, [onStateChange])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  return {
    isSpeaking,
    audioLevel,
    isMuted,
    subtitles,
    speak,
    interrupt,
    toggleMute,
    setSubtitles,
  }
}
