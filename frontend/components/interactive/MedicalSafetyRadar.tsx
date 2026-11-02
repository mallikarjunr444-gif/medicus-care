'use client'

import React, { useState } from 'react'
import { soundFX } from '@/lib/audioEffects'
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  PhoneCall,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Activity,
} from 'lucide-react'

interface TierInfo {
  level: number
  name: string
  subtitle: string
  color: string
  borderColor: string
  bgColor: string
  icon: typeof ShieldCheck
  criteria: string[]
  action: string
}

const TIERS: TierInfo[] = [
  {
    level: 1,
    name: 'Level 1: General Healthcare Education',
    subtitle: 'Wellness, Nutrition & Mild Self-Care',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    icon: ShieldCheck,
    criteria: [
      'Normal vital signs & baseline hemodynamics',
      'Non-progressive mild fatigue or muscle tension',
      'Dietary and lifestyle optimization queries',
    ],
    action: 'Empathetic guidance, hydration, and digital health education.',
  },
  {
    level: 2,
    name: 'Level 2: Non-Urgent Outpatient Review',
    subtitle: 'Sub-Acute Monitoring & Chronic Care',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/10',
    icon: HelpCircle,
    criteria: [
      'Mild fever < 101°F without secondary red flags',
      'Localized seasonal allergy or minor skin rash',
      'Routine follow-up for stable chronic conditions',
    ],
    action: 'Schedule outpatient consultation within 48 to 72 hours.',
  },
  {
    level: 3,
    name: 'Level 3: Urgent Clinical Triage',
    subtitle: 'Same-Day Physician Video Consultation',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/15',
    icon: AlertOctagon,
    criteria: [
      'High fever persisting > 3 days or acute discomfort',
      'Uncontrolled systolic BP > 160 mmHg at rest',
      'Abnormal CBC or lipid panel requiring prescription',
    ],
    action: 'Priority live 3D video-consultation with Dr. Arjun or Dr. Ananya today.',
  },
  {
    level: 4,
    name: 'Level 4: Red Flag Emergency Escalation',
    subtitle: 'Immediate Life-Safety Escalation to 112',
    color: 'text-red-400',
    borderColor: 'border-red-500/50',
    bgColor: 'bg-red-500/15',
    icon: ShieldAlert,
    criteria: [
      'Crushing chest pressure radiating to left arm or jaw',
      'Acute respiratory failure or sudden severe cyanosis',
      'Unresponsiveness, acute stroke signs (FAST), or seizure',
    ],
    action: 'Autonomous hard-stop triage with immediate 112 emergency escalation.',
  },
]

export function MedicalSafetyRadar() {
  const [activeTier, setActiveTier] = useState<number>(3)

  const selectedTier = TIERS.find((t) => t.level === activeTier) || TIERS[2]

  const handleSelectTier = (lvl: number) => {
    setActiveTier(lvl)
    soundFX.playClick()
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-3">
          <ShieldAlert size={14} className="text-red-400" />
          <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
            Clinical Safety & Governance
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Deterministic 4-Tier Medical Architecture
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Built under strict clinical guidelines to ensure patient safety. Our deterministic safety
          engine prevents over-prescription and escalates critical conditions automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Tier Step Selector */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {TIERS.map((tier) => {
            const isSelected = tier.level === activeTier
            const Icon = tier.icon
            return (
              <div
                key={tier.level}
                onClick={() => handleSelectTier(tier.level)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all duration-200 flex items-center justify-between gap-4 ${
                  isSelected
                    ? `glass-panel ${tier.borderColor} shadow-lg shadow-black/40 -translate-y-0.5`
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm font-mono ${tier.bgColor} ${tier.color} border ${tier.borderColor}`}
                  >
                    L{tier.level}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {tier.name.split(':')[1] || tier.name}
                    </h3>
                    <p className="text-xs text-slate-400">{tier.subtitle}</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full block ${
                      isSelected ? `${tier.bgColor} ${tier.color} animate-ping` : 'bg-slate-700'
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: Radar Display & Detailed Tier Deep-Dive */}
        <div className="lg:col-span-7 relative glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Subtle Radar Pulse Circle Effect */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-sky-500/10 animate-radar" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-sky-500/20" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${selectedTier.borderColor} ${selectedTier.bgColor} ${selectedTier.color}`}
              >
                Safety Protocol Level {selectedTier.level}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Activity size={13} className={selectedTier.color} />
                <span>Deterministic Rule Guard</span>
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white mb-2">{selectedTier.name}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedTier.action}
              </p>
            </div>

            {/* Clinical Inclusion Criteria */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
                Clinical Inclusion Criteria
              </h4>
              <div className="space-y-2">
                {selectedTier.criteria.map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={14} className={`${selectedTier.color} mt-0.5 flex-shrink-0`} />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol Action Box */}
            <div
              className={`p-4 rounded-2xl border ${selectedTier.borderColor} ${selectedTier.bgColor} flex items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3">
                {selectedTier.level === 4 ? (
                  <PhoneCall size={20} className="text-red-400 animate-bounce" />
                ) : (
                  <ShieldCheck size={20} className={selectedTier.color} />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">
                    {selectedTier.level === 4
                      ? 'Emergency Escalation Triggered'
                      : 'Clinical Action Protocol'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedTier.level === 4
                      ? 'Automatic 112 guidance with location broadcast'
                      : 'Deterministic consultation and physician triage'}
                  </span>
                </div>
              </div>

              {selectedTier.level === 4 ? (
                <a
                  href="tel:112"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                >
                  <PhoneCall size={13} />
                  <span>Dial 112</span>
                </a>
              ) : (
                <a
                  href="#consultation"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                >
                  <span>Consult</span>
                  <ArrowRight size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
