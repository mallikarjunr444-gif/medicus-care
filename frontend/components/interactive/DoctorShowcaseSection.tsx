'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { soundFX } from '@/lib/audioEffects'
import { TiltCard } from '@/components/interactive/TiltCard'
import { DOCTORS } from '@/lib/doctorTypes'
import type { DoctorId } from '@/lib/doctorTypes'
import {
  Video,
  Languages,
  Sparkles,
  Stethoscope,
  Volume2,
  CheckCircle2,
  Brain,
  ShieldCheck,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface DoctorShowcaseSectionProps {
  onSelectDoctor: (doctorId: DoctorId) => void
}

export function DoctorShowcaseSection({ onSelectDoctor }: DoctorShowcaseSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const [playingVoice, setPlayingVoice] = useState<{ docId: DoctorId; lang: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      // Stagger reveal for doctor cards
      gsap.from('.doctor-card-anim', {
        scrollTrigger: {
          trigger: cardsContainerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.25,
        ease: 'power3.out',
      })

      // Parallax glow effect
      gsap.to('.doctor-glow-bg', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: -40,
        scale: 1.15,
        ease: 'none',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // Simulated Voice Greeting preview
  const handlePlayVoiceSample = (docId: DoctorId, lang: 'en' | 'kn' | 'hi') => {
    soundFX.playTelemetryPing()
    setPlayingVoice({ docId, lang })

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()

      const textMap: Record<string, Record<string, string>> = {
        dr_arjun: {
          en: 'Hello, I am Doctor Arjun. Welcome to MediCare. How are you feeling today?',
          kn: 'ನಮಸ್ಕಾರ, ನಾನು ಡಾಕ್ಟರ್ ಅರ್ಜುನ್. ಮೆಡಿಕೇರ್‌ಗೆ ಸ್ವಾಗತ. ಇಂದು ನಿಮ್ಮ ಆರೋಗ್ಯ ಹೇಗಿದೆ?',
          hi: 'नमस्ते, मैं डॉक्टर अर्जुन हूँ। मेडिकेयर में आपका स्वागत है। आज आप कैसा महसूस कर रहे हैं?',
        },
        dr_ananya: {
          en: 'Welcome, I am Doctor Ananya. Let us review your lab report and wellbeing together.',
          kn: 'ನಮಸ್ಕಾರ, ನಾನು ಡಾಕ್ಟರ್ ಅನನ್ಯಾ. ನಿಮ್ಮ ಲ್ಯಾಬ್ ವರದಿ ಮತ್ತು ಆರೋಗ್ಯವನ್ನು ಪರಿಶೀಲಿಸೋಣ.',
          hi: 'नमस्ते, मैं डॉक्टर अनन्या हूँ। आइए आपकी लैब रिपोर्ट और स्वास्थ्य की समीक्षा करें।',
        },
      }

      const utterance = new SpeechSynthesisUtterance(textMap[docId]?.[lang] || 'Welcome to MediCare.')
      utterance.rate = 0.95
      utterance.onend = () => setPlayingVoice(null)
      utterance.onerror = () => setPlayingVoice(null)
      window.speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => setPlayingVoice(null), 2500)
    }
  }

  return (
    <section ref={sectionRef} className="relative w-full py-20 px-6 overflow-hidden">
      {/* Background Animated Parallax Glow */}
      <div className="doctor-glow-bg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-sky-600/15 via-indigo-600/10 to-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-3">
            <Stethoscope size={13} className="text-sky-400" />
            <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
              Meet Your Clinical Physicians
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Consult With{' '}
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Realistic AI Doctors
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Choose your physician for live video-consultation. Real-time natural speech
            and regional multilingual consultations in English, Kannada, and Hindi.
          </p>
        </div>

        {/* Doctor Cards Container */}
        <div ref={cardsContainerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Dr. Arjun */}
          <div className="doctor-card-anim">
            <TiltCard maxTilt={8} className="h-full">
              <div className="glass-card rounded-3xl border border-sky-500/20 hover:border-sky-500/50 transition-all duration-300 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                {/* Accent Corner Glow */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-sky-500/20 rounded-full blur-2xl group-hover:bg-sky-500/30 transition-all pointer-events-none" />

                {/* Doctor Photo */}
                <div className="relative w-full h-72 sm:h-80 overflow-hidden rounded-t-3xl">
                  <Image
                    src="/doctor/dr_arjun.jpg"
                    alt="Dr. Arjun - AI General Physician"
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  {/* Status badge on photo */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 backdrop-blur-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Available Now
                    </span>
                  </div>
                  {/* Name overlay on photo */}
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">Dr. Arjun, M.D.</h3>
                    <p className="text-sm text-sky-300 font-medium mt-0.5">
                      Internal Medicine & Primary Care Triage
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-4 flex flex-col flex-1">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                    Specialized in acute symptoms, fever evaluation, respiratory assessment, home
                    vitals review, and preventive health guidance. Employs real-time conversational
                    speech with precise medical explanations.
                  </p>

                  {/* Languages & Voice Test */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Languages size={13} className="text-sky-400" />
                        <span>Interactive Voice Audio</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">EN • KN • HI</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {[
                        { code: 'en' as const, label: 'English' },
                        { code: 'kn' as const, label: 'ಕನ್ನಡ (Kannada)' },
                        { code: 'hi' as const, label: 'हिन्दी (Hindi)' },
                      ].map((lang) => {
                        const isThisPlaying =
                          playingVoice?.docId === 'dr_arjun' && playingVoice?.lang === lang.code
                        return (
                          <button
                            key={lang.code}
                            onClick={() => handlePlayVoiceSample('dr_arjun', lang.code)}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                              isThisPlaying
                                ? 'bg-sky-500 text-white shadow-md'
                                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {isThisPlaying ? <Pause size={11} /> : <Play size={11} />}
                            <span>{lang.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Clinical Highlights */}
                  <div className="space-y-2 mb-5">
                    {[
                      'Deterministic 4-Tier Triage Screening',
                      'High-Fidelity WebGL 3D Lip-Sync Kinematics',
                      'Instant Interruption Recovery & VAD',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle2 size={13} className="text-sky-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => onSelectDoctor('dr_arjun')}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
                    >
                      <Video size={16} />
                      <span>Start Consultation with Dr. Arjun</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Card 2: Dr. Ananya */}
          <div className="doctor-card-anim">
            <TiltCard maxTilt={8} className="h-full">
              <div className="glass-card rounded-3xl border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all pointer-events-none" />

                {/* Doctor Photo */}
                <div className="relative w-full h-72 sm:h-80 overflow-hidden rounded-t-3xl">
                  <Image
                    src="/doctor/dr_ananya.jpg"
                    alt="Dr. Ananya - AI Wellness Consultant"
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  {/* Status badge on photo */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 backdrop-blur-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Available Now
                    </span>
                  </div>
                  {/* Name overlay on photo */}
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">Dr. Ananya, M.D.</h3>
                    <p className="text-sm text-indigo-300 font-medium mt-0.5">
                      Metabolic Health, Lab Diagnostics & Wellness
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-4 flex flex-col flex-1">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                    Specialized in medical document intelligence, CBC and lipid interpretation,
                    thyroid kinetics, stress balance, and guided breathing exercises. Delivers warm,
                    empathetic, and evidence-grounded consultations.
                  </p>

                  {/* Languages & Voice Test */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Languages size={13} className="text-indigo-400" />
                        <span>Interactive Voice Audio</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">EN • KN • HI</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {[
                        { code: 'en' as const, label: 'English' },
                        { code: 'kn' as const, label: 'ಕನ್ನಡ (Kannada)' },
                        { code: 'hi' as const, label: 'हिन्दी (Hindi)' },
                      ].map((lang) => {
                        const isThisPlaying =
                          playingVoice?.docId === 'dr_ananya' && playingVoice?.lang === lang.code
                        return (
                          <button
                            key={lang.code}
                            onClick={() => handlePlayVoiceSample('dr_ananya', lang.code)}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                              isThisPlaying
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {isThisPlaying ? <Pause size={11} /> : <Play size={11} />}
                            <span>{lang.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Clinical Highlights */}
                  <div className="space-y-2 mb-5">
                    {[
                      'Lab Report Automated Extraction (CBC, Lipid, TSH)',
                      'Empathetic Stress & Guided Breath Exercises',
                      'Natural Kannada & Hindi Regional Phonation',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle2 size={13} className="text-indigo-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => onSelectDoctor('dr_ananya')}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
                    >
                      <Video size={16} />
                      <span>Start Consultation with Dr. Ananya</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  )
}
