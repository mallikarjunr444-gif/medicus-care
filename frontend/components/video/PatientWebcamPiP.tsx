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
        className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-white text-xs hover:border-sky-500 transition-all group"
        title="Maximize Patient Camera"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-medium">You (Patient Video)</span>
        <ChevronUp size={14} className="text-slate-400 group-hover:text-white" />
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all group ${
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-slate-400 p-3 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-1 text-slate-400 border border-slate-700">
            <User size={20} />
          </div>
          <span className="text-[11px] font-medium text-slate-300">You (Camera Off)</span>
        </div>
      )}

      {/* Error State */}
      {isCameraOn && hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-amber-300 p-2 text-center text-[10px]">
          <CameraOff size={18} className="mb-1 text-amber-400" />
          <span>Camera Blocked</span>
        </div>
      )}

      {/* Label Badge Overlay */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-white font-medium">
        <span className={`w-1.5 h-1.5 rounded-full ${isCameraOn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        <span>You (Patient)</span>
      </div>

      {/* Quick Camera, Mic, Minimize & Expand Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleMic}
          className={`p-1 rounded-lg text-white backdrop-blur-sm transition-colors ${
            isMicOn ? 'bg-black/60 hover:bg-black/80' : 'bg-red-500/80 hover:bg-red-600'
          }`}
          title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
        >
          {isMicOn ? <Mic size={11} /> : <MicOff size={11} />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-1 rounded-lg text-white backdrop-blur-sm transition-colors ${
            isCameraOn ? 'bg-black/60 hover:bg-black/80' : 'bg-red-500/80 hover:bg-red-600'
          }`}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Camera size={11} /> : <CameraOff size={11} />}
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-white bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-colors"
          title={isExpanded ? 'Shrink window' : 'Expand window'}
        >
          {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
        </button>

        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 rounded-lg text-white bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-colors"
          title="Minimize window"
        >
          <ChevronDown size={11} />
        </button>
      </div>
    </div>
  )
}
