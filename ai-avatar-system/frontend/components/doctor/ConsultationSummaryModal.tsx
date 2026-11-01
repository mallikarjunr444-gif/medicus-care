'use client'

import React from 'react'
import {
  FileText,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Download,
  Share2,
  X,
  ShieldAlert,
  ArrowRight,
  Printer,
} from 'lucide-react'
import type { ConsultationSummaryData } from '@/lib/doctorTypes'

interface ConsultationSummaryModalProps {
  summary: ConsultationSummaryData | null
  isOpen: boolean
  onClose: () => void
}

export function ConsultationSummaryModal({
  summary,
  isOpen,
  onClose,
}: ConsultationSummaryModalProps) {
  if (!isOpen || !summary) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const textContent = `MEDICUS CARE - CLINICAL CONSULTATION SUMMARY
=====================================================
Date: ${summary.consultationDate}
Consulting AI Assistant: ${summary.doctorName}
Language: ${summary.languageLabel}
Duration: ${summary.durationFormatted}
Triage Level: Level ${summary.triageLevel} - ${summary.triageTitle}

PATIENT REPORTED SYMPTOMS:
${summary.patientReportedSymptoms.map((s) => `• ${s}`).join('\n')}
Reported Duration: ${summary.symptomDuration}

RELEVANT MEDICAL HISTORY:
${summary.relevantHistory}

CLINICAL TOPICS DISCUSSED:
${summary.informationDiscussed.map((s) => `• ${s}`).join('\n')}

WARNING SIGNS IDENTIFIED:
${summary.warningSignsIdentified.map((s) => `! ${s}`).join('\n')}

RECOMMENDED NEXT STEPS:
${summary.recommendedNextSteps.map((s) => `[ ] ${s}`).join('\n')}

HUMAN DOCTOR REFERRAL:
${summary.referralRecommendation}

DISCLAIMER:
${summary.disclaimer}
`
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MedicusCare_Summary_${summary.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Clinical Consultation Summary
              </h2>
              <p className="text-xs text-slate-400">
                Medicus Care • Record ID: #{summary.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Print Summary"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Download text file"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="block text-[11px] text-slate-500 uppercase font-mono">Date</span>
              <span className="text-xs font-semibold text-slate-200">
                {summary.consultationDate}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 uppercase font-mono">AI Doctor</span>
              <span className="text-xs font-semibold text-sky-300">{summary.doctorName}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 uppercase font-mono">Language</span>
              <span className="text-xs font-semibold text-slate-200">
                {summary.languageLabel}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 uppercase font-mono">Duration</span>
              <span className="text-xs font-semibold text-slate-200">
                {summary.durationFormatted}
              </span>
            </div>
          </div>

          {/* Triage Level Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              summary.triageLevel === 4
                ? 'bg-red-500/10 border-red-500/30 text-red-200'
                : summary.triageLevel === 3
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert
                size={22}
                className={
                  summary.triageLevel === 4
                    ? 'text-red-400'
                    : summary.triageLevel === 3
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }
              />
              <div>
                <span className="text-xs uppercase font-mono tracking-wider font-bold">
                  Clinical Assessment: Level {summary.triageLevel}
                </span>
                <p className="text-sm font-semibold">{summary.triageTitle}</p>
              </div>
            </div>
          </div>

          {/* Patient Reported Section */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono text-slate-400 font-semibold tracking-wide flex items-center gap-1.5">
              <User size={13} className="text-sky-400" />
              Patient-Reported Information
            </h3>
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div>
                <span className="text-xs text-slate-400">Reported Symptoms:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {summary.patientReportedSymptoms.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Duration: </span>
                <span className="text-slate-200 font-medium">{summary.symptomDuration}</span>
              </div>
              {summary.relevantHistory && (
                <div className="text-xs">
                  <span className="text-slate-400">Relevant History: </span>
                  <span className="text-slate-200">{summary.relevantHistory}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Signs Identified */}
          {summary.warningSignsIdentified.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-mono text-amber-400 font-semibold tracking-wide flex items-center gap-1.5">
                <AlertTriangle size={13} />
                Warning Signs Identified
              </h3>
              <ul className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 text-xs text-amber-200">
                {summary.warningSignsIdentified.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Next Steps */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono text-sky-400 font-semibold tracking-wide flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              Recommended Next Steps
            </h3>
            <ul className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
              {summary.recommendedNextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-200">
                  <ArrowRight size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Professional Referral Recommendation */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-200 space-y-1">
            <span className="font-semibold text-blue-300 uppercase font-mono text-[11px]">
              Human Doctor Referral Guidance:
            </span>
            <p>{summary.referralRecommendation}</p>
          </div>

          {/* Regulatory Disclaimer (Mandatory PRD Section 20) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300">Medical AI Disclaimer: </span>
            {summary.disclaimer}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors shadow-lg"
          >
            Done & Save Summary
          </button>
        </div>
      </div>
    </div>
  )
}
