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

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current)
      }
    }
  }, [])

  // Resolve matching speech voice for language and gender
  const getDoctorVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null
    const voices = synthRef.current.getVoices()
    if (!voices || voices.length === 0) return null

    const langTag = language === 'kn' ? 'kn' : language === 'hi' ? 'hi' : 'en'

    // Match language code
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langTag))
    if (langVoices.length > 0) {
      // If female doctor (Dr. Ananya), pick female sounding voice if available
      if (doctorId === 'dr_ananya') {
        const femaleVoice = langVoices.find((v) =>
          /female|woman|girl|samantha|zira|swara|kalpana|veena/i.test(v.name)
        )
        if (femaleVoice) return femaleVoice
      } else {
        const maleVoice = langVoices.find((v) =>
          /male|man|boy|david|george|ravi|madhav|rishi/i.test(v.name)
        )
        if (maleVoice) return maleVoice
      }
      return langVoices[0]
    }

    // Fallback to first available English voice
    return voices.find((v) => v.lang.startsWith('en')) || voices[0]
  }, [language, doctorId])

  // Speak doctor response with lip-sync amplitude tracking
  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return

      // Cancel previous speech if ongoing
      synthRef.current.cancel()
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current)
      }

      onStateChange('speaking')
      setIsSpeaking(true)
      setSubtitles(text)
      if (onSubtitleUpdate) onSubtitleUpdate(text)

      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance

      const voice = getDoctorVoice()
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      } else {
        utterance.lang = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
      }

      utterance.pitch = doctorId === 'dr_ananya' ? 1.08 : 0.94
      utterance.rate = 1.0

      if (isMuted) {
        utterance.volume = 0
      } else {
        utterance.volume = 1
      }

      // Simulate rhythmic syllable / speech amplitude envelope for 3D viseme morphing
      animIntervalRef.current = setInterval(() => {
        // Natural speech modulation
        const amp = 0.25 + 0.65 * Math.abs(Math.sin(Date.now() / 110) * Math.cos(Date.now() / 240))
        setAudioLevel(amp)
      }, 50)

      utterance.onend = () => {
        setIsSpeaking(false)
        setAudioLevel(0)
        if (animIntervalRef.current) {
          clearInterval(animIntervalRef.current)
          animIntervalRef.current = null
        }
        onStateChange('listening')
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        setAudioLevel(0)
        if (animIntervalRef.current) {
          clearInterval(animIntervalRef.current)
          animIntervalRef.current = null
        }
        onStateChange('idle')
      }

      synthRef.current.speak(utterance)
    },
    [doctorId, language, isMuted, getDoctorVoice, onStateChange, onSubtitleUpdate]
  )

  // Immediate Interruption Handler (PRD Section 8: Patient can interrupt doctor)
  const interrupt = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current)
      animIntervalRef.current = null
    }
    setIsSpeaking(false)
    setAudioLevel(0)

    onStateChange('interrupted')

    // Transition smoothly back to listening after brief pause
    setTimeout(() => {
      onStateChange('listening')
    }, 600)
  }, [onStateChange])

  // Mute / Unmute
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
