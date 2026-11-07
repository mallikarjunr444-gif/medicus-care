'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Languages,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { ConsultationSummaryData } from '@/lib/doctorTypes'

interface ConsultationSummaryModalProps {
  summary: ConsultationSummaryData | null
  isOpen: boolean
  onClose: () => void
}

/* ── plain-text / print builders ───────────────────────────── */

function buildSummaryText(s: ConsultationSummaryData): string {
  return `MEDICUS CARE — CLINICAL CONSULTATION SUMMARY
=====================================================
Record ID: #${s.id.slice(0, 8).toUpperCase()}
Date: ${s.consultationDate}
Consulting AI Assistant: ${s.doctorName}
Language: ${s.languageLabel}
Duration: ${s.durationFormatted}
Clinical Assessment: Level ${s.triageLevel} — ${s.triageTitle}

PATIENT-REPORTED SYMPTOMS:
${s.patientReportedSymptoms.map((x) => `• ${x}`).join('\n')}
Reported Duration: ${s.symptomDuration}
Relevant Medical History: ${s.relevantHistory}

CLINICAL TOPICS DISCUSSED:
${s.informationDiscussed.map((x) => `• ${x}`).join('\n')}

WARNING SIGNS IDENTIFIED:
${s.warningSignsIdentified.length ? s.warningSignsIdentified.map((x) => `! ${x}`).join('\n') : '• None reported'}

RECOMMENDED NEXT STEPS:
${s.recommendedNextSteps.map((x) => `[ ] ${x}`).join('\n')}

HUMAN DOCTOR REFERRAL:
${s.referralRecommendation}

DISCLAIMER:
${s.disclaimer}
`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPrintHtml(s: ConsultationSummaryData): string {
  const e = escapeHtml
  const symptoms = s.patientReportedSymptoms
    .map((x) => `<span class="chip">${e(x)}</span>`)
    .join('')
  const warnings = s.warningSignsIdentified.length
    ? `<h2>Warning signs identified</h2><ul>${s.warningSignsIdentified
        .map((x) => `<li>${e(x)}</li>`)
        .join('')}</ul>`
    : ''

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>Consultation Summary — ${e(s.id.slice(0, 8).toUpperCase())}</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #183331; margin: 0; font-size: 13px; line-height: 1.5; }
  .head { border-bottom: 2.5px solid #0f7565; padding-bottom: 12px; margin-bottom: 18px; }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: -0.01em; }
  .meta { color: #5c716b; font-size: 11.5px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px; margin: 16px 0 6px; }
  .grid b { display: block; color: #0f7565; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 1px; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .09em; color: #0f7565; margin: 20px 0 7px; border-bottom: 1px solid #e1e9e4; padding-bottom: 4px; }
  .chip { display: inline-block; border: 1px solid #cfe3da; background: #f1f8f4; border-radius: 999px; padding: 2px 9px; margin: 2px 5px 2px 0; font-size: 11.5px; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 3px 0; }
  .disclaimer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #e1e9e4; font-size: 10.5px; color: #687b74; }
</style></head>
<body>
  <div class="head">
    <h1>Clinical Consultation Summary</h1>
    <div class="meta">MediCare · Record #${e(s.id.slice(0, 8).toUpperCase())} · ${e(s.consultationDate)}</div>
  </div>
  <div class="grid">
    <div><b>AI Doctor</b>${e(s.doctorName)}</div>
    <div><b>Language</b>${e(s.languageLabel)}</div>
    <div><b>Duration</b>${e(s.durationFormatted)}</div>
    <div><b>Clinical assessment</b>Level ${s.triageLevel} — ${e(s.triageTitle)}</div>
  </div>
  <h2>Patient-reported symptoms</h2>
  <div>${symptoms || '<span class="chip">None reported</span>'}</div>
  <p><b>Duration:</b> ${e(s.symptomDuration)} &nbsp;·&nbsp; <b>Relevant history:</b> ${e(s.relevantHistory)}</p>
  ${warnings}
  <h2>Recommended next steps</h2>
  <ul>${s.recommendedNextSteps.map((x) => `<li>${e(x)}</li>`).join('')}</ul>
  <h2>Human doctor referral</h2>
  <p>${e(s.referralRecommendation)}</p>
  <div class="disclaimer"><b>Medical AI disclaimer:</b> ${e(s.disclaimer)}</div>
</body></html>`
}

function triageTheme(level: number) {
  if (level >= 4) {
    return {
      card: 'border-red-200 bg-red-50/70',
      accent: 'text-red-700',
      soft: 'text-red-600',
      track: 'bg-red-100',
      fill: 'bg-red-500',
    }
  }
  if (level === 3) {
    return {
      card: 'border-amber-200 bg-amber-50/70',
      accent: 'text-amber-700',
      soft: 'text-amber-600',
      track: 'bg-amber-100',
      fill: 'bg-amber-500',
    }
  }
  return {
    card: 'border-emerald-200 bg-emerald-50/70',
    accent: 'text-emerald-700',
    soft: 'text-emerald-600',
    track: 'bg-emerald-100',
    fill: 'bg-emerald-500',
  }
}

/* ── component ────────────────────────────────────────────── */

export function ConsultationSummaryModal({
  summary,
  isOpen,
  onClose,
}: ConsultationSummaryModalProps) {
  const [copied, setCopied] = useState(false)
  const onCloseRef = useRef(onClose)
  const recordId = summary ? summary.id.slice(0, 8).toUpperCase() : ''

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Escape to close + lock background scroll while the record is open.
  useEffect(() => {
    if (!isOpen) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  if (!isOpen || !summary) return null

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=880,height=1000')
    if (!printWindow) {
      window.print()
      return
    }
    printWindow.document.open()
    printWindow.document.write(buildPrintHtml(summary))
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 200)
  }

  const handleDownload = () => {
    const blob = new Blob([buildSummaryText(summary)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `MedicusCare_Summary_${summary.id.slice(0, 8)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText(summary))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const theme = triageTheme(summary.triageLevel)

  const metaItems: { icon: LucideIcon; label: string; value: string; accent?: boolean }[] = [
    { icon: Calendar, label: 'Date', value: summary.consultationDate },
    { icon: Stethoscope, label: 'AI doctor', value: summary.doctorName, accent: true },
    { icon: Languages, label: 'Language', value: summary.languageLabel },
    { icon: Clock, label: 'Duration', value: summary.durationFormatted },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07130f]/50 p-3 backdrop-blur-sm animate-fade-in sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-summary-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-24px_rgba(6,25,20,.55)] ring-1 ring-black/5 animate-fade-up"
      >
        {/* Letterhead header */}
        <header className="relative shrink-0 bg-gradient-to-r from-[#123f3a] via-[#0f4a40] to-[#0d5a4c] px-5 py-4 text-white sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <FileText size={20} className="text-[#a8e6d3]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2
                  id="consultation-summary-title"
                  className="truncate text-base font-semibold tracking-tight sm:text-lg"
                >
                  Clinical Consultation Summary
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={12} aria-hidden="true" /> AI-assisted record
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-white/85">
                    #{recordId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <HeaderAction onClick={handlePrint} label="Print summary">
                <Printer size={17} />
              </HeaderAction>
              <HeaderAction onClick={handleDownload} label="Download text file">
                <Download size={17} />
              </HeaderAction>
              <HeaderAction onClick={handleCopy} label={copied ? 'Copied to clipboard' : 'Copy summary'}>
                {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}
              </HeaderAction>
              <HeaderAction onClick={onClose} label="Close summary">
                <X size={18} />
              </HeaderAction>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {/* Metadata strip */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {metaItems.map(({ icon: Icon, label, value, accent }) => (
              <div key={label} className="rounded-xl border border-[#e6eee9] bg-[#f7faf8] px-3 py-2.5">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7d9089]">
                  <Icon size={11} aria-hidden="true" /> {label}
                </span>
                <span
                  className={`mt-1 block truncate text-sm font-semibold ${
                    accent ? 'text-[#0f7565]' : 'text-[#25423b]'
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Triage assessment */}
          <div className={`rounded-xl border ${theme.card} px-4 py-3.5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 ${theme.accent}`}
                >
                  <ShieldAlert size={18} aria-hidden="true" />
                </span>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.soft}`}>
                    Clinical assessment · Level {summary.triageLevel}
                  </span>
                  <p className={`mt-0.5 text-sm font-semibold ${theme.accent}`}>{summary.triageTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 pt-1" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 w-5 rounded-full ${
                      step <= summary.triageLevel ? theme.fill : theme.track
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Patient-reported information */}
          <Section icon={User} title="Patient-reported information">
            <div className="rounded-xl border border-[#e6eee9] bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#5c716b]">Reported symptoms</span>
                <span className="rounded-full bg-[#eef7f2] px-2 py-0.5 text-[10px] font-semibold text-[#0f7565]">
                  {summary.patientReportedSymptoms.length} extracts
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {summary.patientReportedSymptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-[#d7e8df] bg-[#f1f8f4] px-2.5 py-1 text-xs font-medium text-[#2f534a]"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid gap-2 border-t border-[#eef3ef] pt-3 sm:grid-cols-2">
                <Fact label="Duration" value={summary.symptomDuration} />
                <Fact label="Relevant history" value={summary.relevantHistory} />
              </div>
            </div>
          </Section>

          {/* Warning signs */}
          {summary.warningSignsIdentified.length > 0 && (
            <Section icon={AlertTriangle} title="Warning signs identified" tone="amber">
              <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                {summary.warningSignsIdentified.map((sign, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Recommended next steps */}
          <Section icon={CheckCircle2} title="Recommended next steps">
            <ol className="space-y-2.5 rounded-xl border border-[#e6eee9] bg-[#f9fbfa] p-3.5">
              {summary.recommendedNextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs text-[#36564d]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f7565] text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 leading-5">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Human doctor referral */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[#cfe3da] bg-[#eef7f2] p-3.5">
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-[#0f7565]" aria-hidden="true" />
            <div className="text-xs text-[#2f534a]">
              <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7565]">
                Human doctor referral
              </span>
              <p className="mt-0.5 leading-5">{summary.referralRecommendation}</p>
            </div>
          </div>

          {/* Regulatory disclaimer */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[#e6eee9] bg-[#f7faf8] p-3.5 text-[11px] leading-5 text-[#687b74]">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#7d9089]" aria-hidden="true" />
            <p>
              <span className="font-semibold text-[#45645d]">Medical AI disclaimer: </span>
              {summary.disclaimer}
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e6eee9] bg-[#f9fbfa] px-4 py-3.5 sm:px-6">
          <span className="hidden text-[11px] text-[#7d9089] sm:block">
            AI-generated summary · not a medical diagnosis
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#dfe8e2] bg-white px-3.5 text-xs font-semibold text-[#45645d] transition-colors hover:bg-[#f1f7f3]"
            >
              {copied ? <CheckCircle2 size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#0f7565] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0b5f52]"
            >
              Done &amp; save summary
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* ── presentational helpers ───────────────────────────────── */

function HeaderAction({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {children}
    </button>
  )
}

function Section({
  icon: Icon,
  title,
  tone = 'teal',
  children,
}: {
  icon: LucideIcon
  title: string
  tone?: 'teal' | 'amber'
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <h3
        className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${
          tone === 'amber' ? 'text-amber-700' : 'text-[#0f7565]'
        }`}
      >
        <Icon size={13} aria-hidden="true" /> {title}
      </h3>
      {children}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 text-xs">
      <span className="shrink-0 text-[#7d9089]">{label}:</span>
      <span className="font-medium text-[#36564d]">{value || 'Not recorded'}</span>
    </div>
  )
}
