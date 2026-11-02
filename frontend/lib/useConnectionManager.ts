'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ConnectionState {
  isOnline: boolean
  backendConnected: boolean
  cameraActive: boolean
  micGranted: boolean
  micListening: boolean
  digitalHumanReady: boolean
  voiceEngineReady: boolean
  overallStatus: 'live' | 'connecting' | 'warning' | 'offline'
  statusLabel: string
}

export function useConnectionManager(params?: {
  isCameraOn?: boolean
  isMicListening?: boolean
  isDigitalHumanReady?: boolean
}) {
  const [isOnline, setIsOnline] = useState(true)
  const [backendConnected, setBackendConnected] = useState(true)
  const [micGranted, setMicGranted] = useState(false)
  const [voiceEngineReady, setVoiceEngineReady] = useState(false)

  // Network online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)
    const handleOnline = () => {
      setIsOnline(true)
      setBackendConnected(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setBackendConnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check speech synthesis readiness
    if ('speechSynthesis' in window) {
      setVoiceEngineReady(true)
    }

    // Check microphone permissions
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setMicGranted(true)
          // Stop stream immediately after permission check
          stream.getTracks().forEach((track) => track.stop())
        })
        .catch(() => {
          setMicGranted(false)
        })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Derive consolidated status
  const cameraActive = params?.isCameraOn ?? true
  const micListening = params?.isMicListening ?? false
  const digitalHumanReady = params?.isDigitalHumanReady ?? true

  let overallStatus: 'live' | 'connecting' | 'warning' | 'offline' = 'live'
  let statusLabel = '3D Telemedicine Live'

  if (!isOnline) {
    overallStatus = 'offline'
    statusLabel = 'System Offline'
  } else if (!backendConnected) {
    overallStatus = 'warning'
    statusLabel = 'Reconnecting Gateway'
  } else if (!digitalHumanReady) {
    overallStatus = 'connecting'
    statusLabel = 'Calibrating Digital Human'
  } else if (micListening) {
    overallStatus = 'live'
    statusLabel = 'Doctor Listening Actively'
  } else {
    overallStatus = 'live'
    statusLabel = 'Telemedicine Live • 1080p'
  }

  return {
    isOnline,
    backendConnected,
    cameraActive,
    micGranted,
    micListening,
    digitalHumanReady,
    voiceEngineReady,
    overallStatus,
    statusLabel,
  }
}
