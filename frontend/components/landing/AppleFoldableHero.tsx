'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, useSpring, useTransform, useMotionValue } from 'motion/react'
import {
  RotateCcw,
  Sparkles,
  Stethoscope,
  Heart,
  CloudSun,
  MapPin,
  Play,
  Volume2,
  Calendar,
  Phone,
  MessageCircle,
  Compass,
  Radio,
  Sliders,
  ChevronRight,
} from 'lucide-react'
import type { DoctorId } from '@/lib/doctorTypes'

interface AppleFoldableHeroProps {
  onSelectDoctor: (id: DoctorId) => void
}

export function AppleFoldableHero({ onSelectDoctor }: AppleFoldableHeroProps) {
  // Animation state: isUnfolded controls the opening spring
  const [isUnfolded, setIsUnfolded] = useState(false)
  const [activeTab, setActiveTab] = useState<'apple' | 'medicare'>('apple')
  const [replayKey, setReplayKey] = useState(0)
  const [foldProgress, setFoldProgress] = useState(1) // 0 = closed (90deg), 1 = unfolded (0deg)
  const [isInteractiveManual, setIsInteractiveManual] = useState(false)

  // 3D Parallax Tilt with Motion values
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 120, damping: 18 })
  const springY = useSpring(mouseY, { stiffness: 120, damping: 18 })

  const rotateYContainer = useTransform(springX, [-1, 1], [-12, 12])
  const rotateXContainer = useTransform(springY, [-1, 1], [8, -8])

  // Trigger unfold on mount or replay
  useEffect(() => {
    setIsUnfolded(false)
    setFoldProgress(0)
    const timer = setTimeout(() => {
      setIsUnfolded(true)
      setFoldProgress(1)
    }, 280)
    return () => clearTimeout(timer)
  }, [replayKey])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width * 2 - 1
    const y = (e.clientY - rect.top) / rect.height * 2 - 1
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleReplay = () => {
    setReplayKey((k) => k + 1)
    setIsInteractiveManual(false)
  }

  // Left wing rotation angle:
  // Starts at ~65 deg inward, opens to ~6 deg (subtle inward curve)
  const leftFoldDeg = isInteractiveManual
    ? (1 - foldProgress) * 70 + 6
    : isUnfolded ? 5 : 68

  // Right wing rotation angle:
  // Starts at ~-65 deg inward, opens to ~-6 deg
  const rightFoldDeg = isInteractiveManual
    ? -((1 - foldProgress) * 70 + 6)
    : isUnfolded ? -5 : -68

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-8 sm:pb-20 sm:pt-14 select-none">
      {/* Top Apple Typography */}
      <div className="mx-auto max-w-5xl px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[17px] font-medium tracking-tight text-[#1d1d1f]"
        >
          {activeTab === 'apple' ? 'iPhone Duo' : 'MediCare Duo'}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-1 font-sans text-6xl font-bold tracking-[-0.038em] text-[#1d1d1f] sm:text-7xl lg:text-[5.5rem] leading-[1.04]"
        >
          Hello, hello.
        </motion.h1>

        {/* View Mode Switcher Pills */}
        <div className="mt-4 flex justify-center items-center gap-2">
          <div className="inline-flex rounded-full bg-[#f2f2f4] p-1 text-xs font-medium text-[#6e6e73]">
            <button
              onClick={() => setActiveTab('apple')}
              className={`rounded-full px-3.5 py-1.5 transition-all ${
                activeTab === 'apple'
                  ? 'bg-white text-[#1d1d1f] shadow-sm font-semibold'
                  : 'hover:text-[#1d1d1f]'
              }`}
            >
              Apple Original Demo
            </button>
            <button
              onClick={() => setActiveTab('medicare')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all ${
                activeTab === 'medicare'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'hover:text-[#1d1d1f]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              MediCare Live Doctor
            </button>
          </div>
        </div>

        {/* The 3D Foldable Stage */}
        <div
          className="relative mx-auto mt-6 flex justify-center items-center"
          style={{ perspective: '1600px', minHeight: '390px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Main 3D Floating Pivot */}
          <motion.div
            key={replayKey}
            style={{
              rotateX: rotateXContainer,
              rotateY: rotateYContainer,
              transformStyle: 'preserve-3d',
            }}
            className="relative flex items-center justify-center transition-transform duration-100 ease-out"
          >
            {/* The Dual Folding Device Frame */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 'min(680px, 92vw)',
                height: 'min(380px, 54vw)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* LEFT HALF (Folds around right edge) */}
              <motion.div
                initial={{ rotateY: 68, opacity: 0.6 }}
                animate={{
                  rotateY: leftFoldDeg,
                  opacity: 1,
                  filter: isUnfolded ? 'brightness(1)' : 'brightness(0.7)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 75,
                  damping: 14,
                  mass: 1.1,
                }}
                style={{
                  transformOrigin: 'right center',
                  transformStyle: 'preserve-3d',
                  width: '50.6%',
                  height: '100%',
                }}
                className="relative overflow-visible"
              >
                {/* Left Device + Left Hand Graphic */}
                <div className="relative w-full h-full">
                  <Image
                    src="/landing/apple-duo-left-transparent.png"
                    alt="iPhone Duo Left Half"
                    fill
                    sizes="(max-width: 768px) 50vw, 360px"
                    className="object-contain object-right drop-shadow-[-16px_24px_38px_rgba(0,0,0,0.22)]"
                    priority
                  />

                  {/* MediCare Live Doctor Screen Replacement (Overlaid when in MediCare mode) */}
                  {activeTab === 'medicare' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="absolute top-[8%] left-[22%] w-[68%] h-[84%] rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 shadow-2xl z-20 flex flex-col"
                    >
                      {/* Doctor Video / Portrait */}
                      <div className="relative flex-1 bg-black overflow-hidden">
                        <Image
                          src="/doctor/dr_arjun.jpg"
                          alt="Dr. Smit"
                          fill
                          className="object-cover object-top opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE CONSULTATION
                          </span>
                          <span className="text-[10px] font-semibold text-white/90 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded">
                            24/7 AI MD
                          </span>
                        </div>

                        {/* Bottom Overlay info */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <p className="text-xs font-bold text-white drop-shadow">Dr. Smit, M.D.</p>
                          <p className="text-[10px] text-slate-300">General Physician & Diagnosis</p>
                          
                          {/* Mini Waveform & Button */}
                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-0.5">
                              {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.3].map((h, i) => (
                                <motion.span
                                  key={i}
                                  animate={{ scaleY: [h, 1.2, h * 0.5, h] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8 + i * 0.15,
                                    ease: 'easeInOut',
                                  }}
                                  className="w-1 h-3 rounded-full bg-emerald-400/80 origin-bottom"
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => onSelectDoctor('dr_arjun')}
                              className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white px-2.5 py-1 text-[10px] font-semibold transition-all shadow-md active:scale-95"
                            >
                              Connect
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Left Screen Specular Glare Sweep */}
                  <motion.div
                    initial={{ opacity: 0, x: '-100%' }}
                    animate={{
                      opacity: isUnfolded ? [0, 0.45, 0] : 0,
                      x: isUnfolded ? ['-100%', '160%'] : '-100%',
                    }}
                    transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                  />
                </div>
              </motion.div>

              {/* CENTER HINGE CREASE SHADOW */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[5%] -translate-x-1/2 h-[90%] w-[10px] z-20"
                style={{
                  background: isUnfolded
                    ? 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.12) 100%)'
                    : 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 100%)',
                  boxShadow: isUnfolded
                    ? '0 0 12px rgba(0,0,0,0.2)'
                    : '0 0 24px rgba(0,0,0,0.5)',
                  transition: 'background 0.5s ease',
                }}
              />

              {/* RIGHT HALF (Folds around left edge) */}
              <motion.div
                initial={{ rotateY: -68, opacity: 0.6 }}
                animate={{
                  rotateY: rightFoldDeg,
                  opacity: 1,
                  filter: isUnfolded ? 'brightness(1)' : 'brightness(0.7)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 75,
                  damping: 14,
                  mass: 1.1,
                }}
                style={{
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  width: '49.4%',
                  height: '100%',
                }}
                className="relative overflow-visible"
              >
                {/* Right Device + Right Hand Graphic */}
                <div className="relative w-full h-full">
                  <Image
                    src="/landing/apple-duo-right-transparent.png"
                    alt="iPhone Duo Right Half"
                    fill
                    sizes="(max-width: 768px) 50vw, 360px"
                    className="object-contain object-left drop-shadow-[16px_24px_38px_rgba(0,0,0,0.22)]"
                    priority
                  />

                  {/* MediCare Health Vitals Screen Overlay (when in MediCare mode) */}
                  {activeTab === 'medicare' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.05 }}
                      className="absolute top-[8%] left-[8%] w-[68%] h-[84%] rounded-xl overflow-hidden bg-slate-950/95 border border-slate-700/60 shadow-2xl z-20 p-2.5 flex flex-col justify-between text-white"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-white">HEALTH METRICS</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Normal
                        </span>
                      </div>

                      {/* Vitals Grid */}
                      <div className="grid grid-cols-2 gap-1.5 my-1">
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-rose-400">
                            <Heart className="w-2.5 h-2.5 animate-pulse" />
                            Heart Rate
                          </div>
                          <p className="text-sm font-bold text-white mt-0.5">72 <span className="text-[9px] font-normal text-slate-400">BPM</span></p>
                        </div>
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-sky-400">
                            <Radio className="w-2.5 h-2.5" />
                            SpO2
                          </div>
                          <p className="text-sm font-bold text-white mt-0.5">99 <span className="text-[9px] font-normal text-slate-400">%</span></p>
                        </div>
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-amber-400">
                            <Sliders className="w-2.5 h-2.5" />
                            Blood Pressure
                          </div>
                          <p className="text-sm font-bold text-white mt-0.5">120/80</p>
                        </div>
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-emerald-400">
                            <Stethoscope className="w-2.5 h-2.5" />
                            Diagnosis
                          </div>
                          <p className="text-[11px] font-medium text-emerald-200 mt-0.5 truncate">Stable</p>
                        </div>
                      </div>

                      {/* Quick Consultation CTA */}
                      <button
                        onClick={() => onSelectDoctor('dr_arjun')}
                        className="w-full py-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-[10px] font-bold text-white shadow flex items-center justify-center gap-1 transition-all"
                      >
                        Start Voice & Video Call
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}

                  {/* Right Screen Specular Glare Sweep */}
                  <motion.div
                    initial={{ opacity: 0, x: '-100%' }}
                    animate={{
                      opacity: isUnfolded ? [0, 0.45, 0] : 0,
                      x: isUnfolded ? ['-100%', '160%'] : '-100%',
                    }}
                    transition={{ duration: 1.4, delay: 0.35, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Apple-Grade Action Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex flex-col items-center gap-3.5"
        >
          <div className="flex w-fit items-center gap-5 rounded-full border border-[#d2d2d7]/80 bg-[#f5f5f7]/90 backdrop-blur-xl px-5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow">
            <div className="text-left">
              {activeTab === 'apple' ? (
                <>
                  <p className="text-[12px] font-semibold text-[#1d1d1f] tracking-tight">
                    From ₹299900.00*
                  </p>
                  <p className="text-[11px] text-[#86868b]">
                    or ₹26574.00/mo. for 12 mo.**
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[12px] font-semibold text-[#0f7565] tracking-tight">
                    Free Consultation · ₹0
                  </p>
                  <p className="text-[11px] text-[#6e6e73]">
                    Instant AI Doctor in Kannada, Hindi & English
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSelectDoctor('dr_arjun')}
              className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow transition-all active:scale-95 ${
                activeTab === 'apple'
                  ? 'bg-[#0071e3] hover:bg-[#0077ed]'
                  : 'bg-[#0f7565] hover:bg-[#0d6356]'
              }`}
            >
              {activeTab === 'apple' ? 'Buy' : 'Consult Now'}
            </button>
          </div>

          {/* Interactive Controls Bar: Replay animation, fold toggle, angle slider */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#86868b]">
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-1.5 font-medium hover:text-[#1d1d1f] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay Fold Animation
            </button>

            <span className="text-gray-300">•</span>

            <button
              type="button"
              onClick={() => {
                setIsInteractiveManual(true)
                setFoldProgress((p) => (p > 0.5 ? 0.15 : 1))
              }}
              className="hover:text-[#1d1d1f] font-medium transition-colors"
            >
              {foldProgress > 0.5 ? 'Fold Device' : 'Unfold Device'}
            </button>

            <span className="text-gray-300 hidden sm:inline">•</span>

            <div className="hidden sm:flex items-center gap-2">
              <span>Fold Angle:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={foldProgress}
                onChange={(e) => {
                  setIsInteractiveManual(true)
                  setFoldProgress(parseFloat(e.target.value))
                }}
                className="w-24 accent-[#0071e3] cursor-pointer"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
