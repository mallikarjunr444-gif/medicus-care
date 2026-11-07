'use client'

import React, { useState, useMemo } from 'react'
import { soundFX } from '@/lib/audioEffects'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Activity,
  PhoneCall,
  Clock,
  Sparkles,
  ChevronRight,
  Video,
} from 'lucide-react'

interface SymptomOption {
  id: string
  label: string
  category: string
  baseLevel: 1 | 2 | 3 | 4
  emergencyAlert?: boolean
}

const SYMPTOMS: SymptomOption[] = [
  {
    id: 'chest_pain',
    label: 'Crushing chest pressure / radiating pain',
    category: 'Cardiovascular',
    baseLevel: 4,
    emergencyAlert: true,
  },
  {
    id: 'high_fever_stiff',
    label: 'High fever > 103°F with stiff neck',
    category: 'Neurological/Infection',
    baseLevel: 4,
    emergencyAlert: true,
  },
  {
    id: 'shortness_breath',
    label: 'Sudden acute shortness of breath at rest',
    category: 'Respiratory',
    baseLevel: 4,
    emergencyAlert: true,
  },
  {
    id: 'fever_mild',
    label: 'Low-grade fever (100°F) for 2 days',
    category: 'General',
    baseLevel: 2,
  },
  {
    id: 'cough_dry',
    label: 'Persistent dry cough with throat scratch',
    category: 'Respiratory',
    baseLevel: 2,
  },
  {
    id: 'bp_elevated',
    label: 'Home BP reading > 150/95 mmHg',
    category: 'Cardiovascular',
    baseLevel: 3,
  },
  {
    id: 'migraine_severe',
    label: 'Severe throbbing migraine with photophobia',
    category: 'Neurological',
    baseLevel: 3,
  },
  {
    id: 'stress_anxiety',
    label: 'Work fatigue, insomnia & tension headache',
    category: 'Mental Wellness',
    baseLevel: 1,
  },
  {
    id: 'allergy_seasonal',
    label: 'Sneezing, itchy eyes & clear runny nose',
    category: 'Allergy',
    baseLevel: 1,
  },
]

interface TriageSimulatorProps {
  onStartConsultation?: (doctorId: 'dr_arjun' | 'dr_ananya') => void
}

export function TriageSimulator({ onStartConsultation }: TriageSimulatorProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['bp_elevated'])
  const [severityScore, setSeverityScore] = useState<number>(6)
  const [durationDays, setDurationDays] = useState<number>(2)

  const toggleSymptom = (id: string) => {
    soundFX.playClick()
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  // Triage Calculation Engine
  const triageResult = useMemo(() => {
    if (selectedSymptoms.length === 0) {
      return {
        level: 1 as const,
        title: 'Level 1: General Health Guidance',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        badge: 'General Education',
        action: 'Self-care & lifestyle monitoring',
        recommendation:
          'No acute clinical risks detected. Maintain adequate hydration, balanced nutrition, and monitor symptoms if they evolve.',
        isEmergency: false,
      }
    }

    const matched = SYMPTOMS.filter((s) => selectedSymptoms.includes(s.id))
    const hasEmergency = matched.some((s) => s.baseLevel === 4)

    if (hasEmergency || severityScore >= 9) {
      return {
        level: 4 as const,
        title: 'Level 4: Red Flag Emergency Alert',
        color: 'text-red-400',
        bgColor: 'bg-red-500/15',
        borderColor: 'border-red-500/50',
        badge: 'Immediate Medical Emergency',
        action: 'Dial 112 / Seek Nearest ER Immediately',
        recommendation:
          'CRITICAL: Acute life-safety criteria detected. Do not wait for digital triage. Contact local emergency medical services (112) or reach an emergency room immediately.',
        isEmergency: true,
      }
    }

    const maxBase = Math.max(...matched.map((s) => s.baseLevel))

    if (maxBase === 3 || severityScore >= 7 || durationDays >= 5) {
      return {
        level: 3 as const,
        title: 'Level 3: Urgent Clinical Tele-Consultation',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/15',
        borderColor: 'border-amber-500/40',
        badge: 'Priority Doctor Consultation',
        action: 'Same-day 3D video-consult with Dr. Smit or Dr. Ananya',
        recommendation:
          'Moderate-to-high clinical risk. A physician evaluation is strongly advised today to review vitals, prescribe medications, or order confirmatory lab work.',
        isEmergency: false,
      }
    }

    if (maxBase === 2 || severityScore >= 4) {
      return {
        level: 2 as const,
        title: 'Level 2: Non-Urgent Outpatient Review',
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
        borderColor: 'border-sky-500/30',
        badge: 'Routine Review',
        action: 'Schedule consultation within 48-72 hours',
        recommendation:
          'Mild clinical symptoms suitable for outpatient monitoring, home rest, and routine follow-up with your physician if unresolved.',
        isEmergency: false,
      }
    }

    return {
      level: 1 as const,
      title: 'Level 1: General Health Guidance',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      badge: 'Preventive Care',
      action: 'Hydration, rest, and lifestyle tracking',
      recommendation:
        'Symptoms appear mild and non-progressive. Our AI wellness guidance and breathing exercises can assist your recovery.',
      isEmergency: false,
    }
  }, [selectedSymptoms, severityScore, durationDays])

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-3">
          <ShieldAlert size={14} className="text-sky-400" />
          <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
            Deterministic Medical Safety Simulator
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          4-Tier Clinical Triage Engine
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Test our clinical screening protocol in real time. Select symptoms and parameters to
          experience how Medicus Care classifies health risks and protects patient safety.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Symptom Tags & Sliders */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <span>Select Presenting Symptoms</span>
                <span className="text-xs text-sky-400 font-mono">
                  ({selectedSymptoms.length} active)
                </span>
              </label>
              <button
                onClick={() => setSelectedSymptoms([])}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id)
                return (
                  <button
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? sym.emergencyAlert
                          ? 'bg-red-500/20 text-red-200 border border-red-500/50 shadow-md shadow-red-500/10'
                          : 'bg-sky-500/20 text-sky-200 border border-sky-500/50 shadow-md shadow-sky-500/10'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{sym.label}</span>
                    {sym.emergencyAlert && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-800/80">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-300">Severity / Discomfort</span>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {severityScore} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={severityScore}
                onChange={(e) => setSeverityScore(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Mild (1)</span>
                <span>Moderate (5)</span>
                <span>Severe (10)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-300">Symptom Duration</span>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Today</span>
                <span>1 Week</span>
                <span>2 Weeks+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Triage Classification Result Card */}
        <div
          className={`lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${triageResult.borderColor} shadow-2xl relative overflow-hidden`}
        >
          {/* Subtle Background Glow */}
          <div
            className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
              triageResult.level === 4
                ? 'bg-red-500/20'
                : triageResult.level === 3
                ? 'bg-amber-500/20'
                : 'bg-sky-500/15'
            }`}
          />

          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${triageResult.borderColor} ${triageResult.color} ${triageResult.bgColor}`}
            >
              {triageResult.badge}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
              <Activity size={13} className={triageResult.color} />
              <span>Safety Protocol Active</span>
            </div>
          </div>

          <h3 className={`text-xl sm:text-2xl font-extrabold mb-2 ${triageResult.color}`}>
            {triageResult.title}
          </h3>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-4">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              Required Protocol:
            </span>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              {triageResult.isEmergency ? (
                <PhoneCall size={16} className="text-red-400 animate-bounce" />
              ) : (
                <CheckCircleIcon color={triageResult.color} />
              )}
              <span>{triageResult.action}</span>
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            {triageResult.recommendation}
          </p>

          {triageResult.isEmergency ? (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-center">
              <span className="text-xs font-bold text-red-200 block mb-1">
                Emergency Escalate 112
              </span>
              <p className="text-[11px] text-red-300 mb-3">
                Immediate in-person hospital care required.
              </p>
              <a
                href="tel:112"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-[1.02]"
              >
                <PhoneCall size={14} />
                <span>Call Emergency Services (112)</span>
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => onStartConsultation?.('dr_arjun')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
              >
                <Video size={15} />
                <span>Review with Dr. Smit</span>
              </button>
              <button
                onClick={() => onStartConsultation?.('dr_ananya')}
                className="w-full py-2.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <span>Consult Dr. Ananya (Wellness & Labs)</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckCircleIcon({ color }: { color: string }) {
  return (
    <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
