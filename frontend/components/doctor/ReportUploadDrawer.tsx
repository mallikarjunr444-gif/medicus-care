'use client'

import React, { useState } from 'react'
import { AlertCircle, FileCheck2, FileText, Loader2, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { MedicalReportItem } from '@/lib/doctorTypes'

interface ReportUploadDrawerProps {
  isOpen: boolean
  onClose: () => void
  onReportAnalyzed: (report: MedicalReportItem) => void
  onDiscussWithDoctor: (reportText: string) => void
}

interface ReportAnalysisResponse {
  report_title: string
  parameters_analyzed: Array<{
    parameter: string
    reference_range: string
    interpretation: string
    status: string
  }>
  preliminary_explanation: string
  clinical_limitations: string
  recommended_doctor_review: string
}

export function ReportUploadDrawer({ isOpen, onClose, onReportAnalyzed, onDiscussWithDoctor }: ReportUploadDrawerProps) {
  const [reportText, setReportText] = useState('')
  const [fileName, setFileName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [analyzedReport, setAnalyzedReport] = useState<MedicalReportItem | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const isTextFile = file.type === 'text/plain' || file.type === 'text/csv' || /\.(txt|csv)$/i.test(file.name)
    if (!isTextFile) {
      setErrorMsg('Choose a plain-text or CSV report, or paste the report text below. PDF and image OCR is not connected yet.')
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Text report exceeds the 2 MB limit.')
      event.target.value = ''
      return
    }
    try {
      const text = await file.text()
      setReportText(text)
      setFileName(file.name)
      setErrorMsg(null)
    } catch {
      setErrorMsg('Could not read this file. Paste the report text instead.')
    }
  }

  const handleAnalyze = async () => {
    const submittedText = reportText.trim()
    if (!submittedText) {
      setErrorMsg('Paste report text or choose a text/CSV file first.')
      return
    }
    setIsProcessing(true)
    setErrorMsg(null)
    try {
      const result = await api.analyzeLaboratoryReport({ report_text: submittedText }) as ReportAnalysisResponse
      const report: MedicalReportItem = {
        id: `REP-${Date.now()}`,
        fileName: fileName || 'Pasted laboratory report text',
        fileSize: `${submittedText.length.toLocaleString()} characters reviewed`,
        fileType: fileName.toLowerCase().endsWith('.csv') ? 'text/csv' : 'text/plain',
        uploadDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        tests: result.parameters_analyzed.map((parameter) => ({
          name: parameter.parameter,
          value: parameter.status,
          unit: '',
          referenceRange: parameter.reference_range,
          status: 'review' as const,
        })),
        aiInterpretation: result.preliminary_explanation,
        warningSigns: [result.clinical_limitations, result.recommended_doctor_review],
      }
      setAnalyzedReport(report)
      onReportAnalyzed(report)
    } catch (error) {
      const message = (error as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail || 'The report review service is unavailable. Your text has not been analyzed.'
      setErrorMsg(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setAnalyzedReport(null)
    setReportText('')
    setFileName('')
    setErrorMsg(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-review-title"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-mist/60 text-clinic-teal-deep">
              <FileText size={19} />
            </div>
            <div>
              <h2 id="report-review-title" className="text-base font-semibold text-slate-900">Review a laboratory report</h2>
              <p className="mt-0.5 text-xs text-slate-500">Submit text to MediCare’s existing report-review endpoint.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close report review" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-6">
          {!analyzedReport ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-800" htmlFor="report-text">Report text</label>
              <textarea
                id="report-text"
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
                rows={9}
                maxLength={30000}
                placeholder="Paste the report text, including values and laboratory reference ranges…"
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-clinic-teal focus:outline-none focus:ring-4 focus:ring-clinic-teal/25"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <FileCheck2 size={16} className="text-clinic-teal-deep" />
                  {fileName || 'Choose text/CSV file'}
                  <input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={handleFileChange} className="sr-only" />
                </label>
                <span className="text-xs text-slate-500">{reportText.length.toLocaleString()} / 30,000 characters</span>
              </div>
              <p className="text-xs leading-5 text-slate-500">PDF/image upload and OCR are not connected. Only the report text is sent for review; selected files are read locally in this browser.</p>

              {errorMsg && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isProcessing || !reportText.trim()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-clinic-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-clinic-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing && <Loader2 size={16} className="animate-spin" />}
                  {isProcessing ? 'Reviewing report…' : 'Review report text'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-clinic-hairline bg-clinic-mist/60 p-4">
                <div className="flex items-center gap-2 font-semibold text-clinic-ink">
                  <FileCheck2 size={18} />
                  <span>Report text reviewed</span>
                </div>
                <p className="mt-1 text-sm text-clinic-teal-deep">{analyzedReport.fileName} · {analyzedReport.fileSize}</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-12 gap-2 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">
                  <span className="col-span-4">Test parameter</span>
                  <span className="col-span-3">Review status</span>
                  <span className="col-span-5">Reference guidance</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {analyzedReport.tests.map((test) => (
                    <div key={test.name} className="grid grid-cols-12 gap-2 px-3 py-3 text-xs leading-5">
                      <span className="col-span-4 font-medium text-slate-900">{test.name}</span>
                      <span className="col-span-3 text-amber-800">{test.value}</span>
                      <span className="col-span-5 text-slate-600">{test.referenceRange}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-clinic-hairline bg-clinic-mist/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-clinic-ink">Preliminary guidance</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{analyzedReport.aiInterpretation}</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                {analyzedReport.warningSigns.map((note) => <p key={note}>{note}</p>)}
                <p className="mt-2 font-medium">This is not a diagnosis, and the service does not extract or verify numeric results. Review the original report with a qualified clinician.</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={reset} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Review another report</button>
                <button type="button" onClick={() => { onDiscussWithDoctor(reportText); onClose() }} className="min-h-10 rounded-lg bg-clinic-teal px-4 text-sm font-semibold text-white hover:bg-clinic-teal-deep">Discuss with doctor</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
