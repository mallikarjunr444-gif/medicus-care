'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  User,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface PatientWebcamPiPProps {
  isCameraOn: boolean
  isMicOn: boolean
  onToggleCamera: () => void
  onToggleMic: () => void
  className?: string
}

export function PatientWebcamPiP({
  isCameraOn,
  isMicOn,
  onToggleCamera,
  onToggleMic,
  className = '',
}: PatientWebcamPiPProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    let active = true

    async function setupCamera() {
      if (!isCameraOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })

        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setHasPermission(true)
        setErrorMessage(null)
      } catch (err: any) {
        if (!active) return
        setHasPermission(false)
        setErrorMessage('Camera access was denied or is unavailable.')
      }
    }

    setupCamera()

    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [isCameraOn])

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="cursor-pointer inline-flex h-10 items-center gap-2 rounded-full bg-white/95 px-3.5 text-clinic-ink shadow-[0_1px_3px_rgba(15,47,54,.25)] transition hover:bg-white group"
        title="Show your camera"
      >
        <span className="h-2 w-2 rounded-full bg-clinic-teal" aria-hidden="true" />
        <span className="text-[13px] font-semibold">Your camera</span>
        <ChevronUp size={15} className="text-clinic-muted" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-white bg-clinic-ink shadow-[0_4px_16px_rgba(15,47,54,.35)] transition-all group ${
        isExpanded ? 'w-72 sm:w-80 aspect-[4/3]' : 'w-44 sm:w-52 aspect-[4/3]'
      } ${className}`}
    >
      {/* Realtime Video Stream */}
      {isCameraOn && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
      )}

      {/* Camera Off / Privacy Fallback */}
      {!isCameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-clinic-ink p-3 text-center">
          <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            <User size={20} />
          </div>
          <span className="text-[13px] font-semibold text-white/85">Camera is off</span>
        </div>
      )}

      {/* Error State */}
      {isCameraOn && hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-clinic-ink p-2 text-center text-[13px] font-semibold text-white">
          <CameraOff size={20} className="mb-1" aria-hidden="true" />
          <span>Camera blocked. Allow it in your browser.</span>
        </div>
      )}

      {/* Label Badge Overlay */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-white">
        <span className={`h-1.5 w-1.5 rounded-full ${isCameraOn ? 'bg-teal-300' : 'bg-slate-400'}`} aria-hidden="true" />
        <span>You</span>
      </div>

      {/* Quick Camera, Mic, Minimize & Expand Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleMic}
          className={`h-8 w-8 flex items-center justify-center rounded-lg text-white transition-colors ${
            isMicOn ? 'bg-black/60 hover:bg-black/80' : 'bg-clinic-brick hover:bg-clinic-brick-deep'
          }`}
          title={isMicOn ? 'Turn microphone off' : 'Turn microphone on'} aria-label={isMicOn ? 'Turn microphone off' : 'Turn microphone on'}
        >
          {isMicOn ? <Mic size={15} /> : <MicOff size={15} />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`h-8 w-8 flex items-center justify-center rounded-lg text-white transition-colors ${
            isCameraOn ? 'bg-black/60 hover:bg-black/80' : 'bg-clinic-brick hover:bg-clinic-brick-deep'
          }`}
          title={isCameraOn ? 'Turn camera off' : 'Turn camera on'} aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {isCameraOn ? <Camera size={15} /> : <CameraOff size={15} />}
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-white bg-black/60 hover:bg-black/80 transition-colors"
          title={isExpanded ? 'Shrink preview' : 'Enlarge preview'} aria-label={isExpanded ? 'Shrink preview' : 'Enlarge preview'}
        >
          {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        <button
          onClick={() => setIsMinimized(true)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-white bg-black/60 hover:bg-black/80 transition-colors"
          title="Hide preview" aria-label="Hide preview"
        >
          <ChevronDown size={15} />
        </button>
      </div>
    </div>
  )
}
