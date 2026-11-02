'use client'

import React, { useState } from 'react'
import { soundFX } from '@/lib/audioEffects'
import {
  FileText,
  Scan,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
} from 'lucide-react'

interface LabTestItem {
  id: string
  name: string
  measured: string
  unit: string
  referenceRange: string
  status: 'normal' | 'borderline' | 'attention'
  physicianNote: string
}

interface ReportPreset {
  id: string
  title: string
  date: string
  category: string
  tests: LabTestItem[]
}

const REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'cbc',
    title: 'Complete Blood Count (CBC)',
    date: 'Recent Diagnostic Lab',
    category: 'Hematology Profile',
    tests: [
      {
        id: 'hb',
        name: 'Hemoglobin (Hb)',
        measured: '14.8',
        unit: 'g/dL',
        referenceRange: '13.5 - 17.5',
        status: 'normal',
        physicianNote:
          'Optimal oxygen-carrying capacity. Erythrocyte saturation levels are well within healthy physiological baseline.',
      },
      {
        id: 'wbc',
        name: 'Total Leukocytes (WBC)',
        measured: '6,800',
        unit: '/mcL',
        referenceRange: '4,500 - 11,000',
        status: 'normal',
        physicianNote:
          'Immunological sentinel count is stable, indicating absence of acute systemic bacteremia or active infection.',
      },
      {
        id: 'plt',
        name: 'Platelet Count',
        measured: '265,000',
        unit: '/mcL',
        referenceRange: '150,000 - 450,000',
        status: 'normal',
        physicianNote:
          'Normal clotting mechanics with intact hemostatic reserve. No thrombocytopenia detected.',
      },
      {
        id: 'neutrophils',
        name: 'Neutrophil Fraction',
        measured: '62%',
        unit: '%',
        referenceRange: '40% - 75%',
        status: 'normal',
        physicianNote:
          'Differential distribution balanced. Innate immune surveillance operating normally.',
      },
    ],
  },
  {
    id: 'lipid',
    title: 'Comprehensive Lipid & Metabolic Panel',
    date: 'Cardiovascular Risk Screening',
    category: 'Metabolic Biomarkers',
    tests: [
      {
        id: 'tc',
        name: 'Total Cholesterol',
        measured: '188',
        unit: 'mg/dL',
        referenceRange: '< 200',
        status: 'normal',
        physicianNote:
          'Desired overall lipid envelope maintained. Continues to reflect good dietary cardiovascular balance.',
      },
      {
        id: 'ldl',
        name: 'LDL (Atherogenic Lipoprotein)',
        measured: '112',
        unit: 'mg/dL',
        referenceRange: '< 100',
        status: 'borderline',
        physicianNote:
          'Mild borderline elevation. Dr. Ananya recommends increasing soluble fiber (oats, legumes) and 20 mins brisk daily walking.',
      },
      {
        id: 'hdl',
        name: 'HDL (Protective Fraction)',
        measured: '54',
        unit: 'mg/dL',
        referenceRange: '> 40',
        status: 'normal',
        physicianNote:
          'Optimal reverse cholesterol transport mechanics. Good protective vascular factor.',
      },
      {
        id: 'tg',
        name: 'Serum Triglycerides',
        measured: '110',
        unit: 'mg/dL',
        referenceRange: '< 150',
        status: 'normal',
        physicianNote:
          'Healthy baseline triglyceride clearance. Low risk for metabolic syndrome.',
      },
    ],
  },
  {
    id: 'thyroid',
    title: 'Thyroid & Endocrine Function (TSH)',
    date: 'Metabolic & Energy Balance',
    category: 'Endocrinology',
    tests: [
      {
        id: 'tsh',
        name: 'Ultrasensitive TSH',
        measured: '2.14',
        unit: 'uIU/mL',
        referenceRange: '0.45 - 4.50',
        status: 'normal',
        physicianNote:
          'Euthyroid pituitary feedback loop. Basal metabolic rate and energy regulation are optimal.',
      },
      {
        id: 'ft4',
        name: 'Free Thyroxine (FT4)',
        measured: '1.25',
        unit: 'ng/dL',
        referenceRange: '0.82 - 1.77',
        status: 'normal',
        physicianNote:
          'Target cellular circulating hormone levels. No hypothyroid or hyperthyroid signs.',
      },
    ],
  },
]

export function LabReportScanner3D() {
  const [selectedReportId, setSelectedReportId] = useState<string>('cbc')
  const [selectedTestId, setSelectedTestId] = useState<string>('hb')
  const [isScanning, setIsScanning] = useState<boolean>(true)

  const currentReport = REPORT_PRESETS.find((r) => r.id === selectedReportId) || REPORT_PRESETS[0]
  const currentTest =
    currentReport.tests.find((t) => t.id === selectedTestId) || currentReport.tests[0]

  const handleSelectReport = (rId: string) => {
    setSelectedReportId(rId)
    const report = REPORT_PRESETS.find((r) => r.id === rId)
    if (report && report.tests[0]) {
      setSelectedTestId(report.tests[0].id)
    }
    soundFX.playClick()
  }

  const handleSelectTest = (tId: string) => {
    setSelectedTestId(tId)
    soundFX.playHover()
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-3">
          <Scan size={14} className="text-sky-400" />
          <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
            Medical Document Intelligence
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Holographic Diagnostic Lab Report Scanner
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Upload or preview clinical lab reports with automated parameter extraction, reference
          range validation, and natural language physician explanations.
        </p>
      </div>

      {/* Preset Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {REPORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectReport(preset.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              preset.id === selectedReportId
                ? 'glass-card text-white border-sky-500/50 shadow-lg shadow-sky-500/10'
                : 'text-slate-400 hover:text-white glass-pill hover:bg-slate-800/60'
            }`}
          >
            <FileText size={14} className={preset.id === selectedReportId ? 'text-sky-400' : ''} />
            <span>{preset.title}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Holographic Lab Sheet with Laser Scanline */}
        <div className="lg:col-span-7 relative glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Glowing Laser Scanline */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-laser z-20" />
          )}

          {/* Report Sheet Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span className="text-[11px] font-mono uppercase text-sky-400 font-semibold tracking-wider">
                  {currentReport.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{currentReport.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                OCR Verification: 99.8%
              </span>
            </div>
          </div>

          {/* Test Parameters List */}
          <div className="flex flex-col gap-2.5">
            {currentReport.tests.map((test) => {
              const isSelected = test.id === currentTest.id
              return (
                <div
                  key={test.id}
                  onClick={() => handleSelectTest(test.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'glass-card border-sky-500/60 shadow-lg shadow-sky-500/10 -translate-y-0.5'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono ${
                        test.status === 'normal'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {test.status === 'normal' ? 'OK' : '!'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{test.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">
                        Ref: {test.referenceRange} {test.unit}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-white font-mono">
                      {test.measured}{' '}
                      <span className="text-xs text-sky-400 font-normal">{test.unit}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                        test.status === 'normal'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {test.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Physician AI Diagnostic Interpretation */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col gap-5 shadow-2xl relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Physician Interpretation</h3>
              <p className="text-xs text-sky-400 font-mono">Dr. Ananya, M.D. • Diagnostic Lab</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Active Parameter Analysis
            </span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-base font-bold text-white">{currentTest.name}</span>
              <span className="text-lg font-mono font-extrabold text-sky-300">
                {currentTest.measured} {currentTest.unit}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Standard Range:</span>
              <span className="text-slate-200">
                {currentTest.referenceRange} {currentTest.unit}
              </span>
            </div>
          </div>

          <div className="relative p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 animate-pulse" />
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentTest.physicianNote}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
              <span>OCR Extraction Integrity</span>
              <span className="text-emerald-400 font-mono font-bold">100% Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="#consultation"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Discuss Lab Results with Doctor</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
