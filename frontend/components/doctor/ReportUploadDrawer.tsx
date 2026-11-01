'use client'

import React, { useState } from 'react'
import {
  FileUp,
  FileCheck,
  AlertCircle,
  X,
  FileText,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import type { MedicalReportItem } from '@/lib/doctorTypes'

interface ReportUploadDrawerProps {
  isOpen: boolean
  onClose: () => void
  onReportAnalyzed: (report: MedicalReportItem) => void
}

export function ReportUploadDrawer({
  isOpen,
  onClose,
  onReportAnalyzed,
}: ReportUploadDrawerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analyzedReport, setAnalyzedReport] = useState<MedicalReportItem | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload PDF, JPG, or PNG files only.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10MB limit.')
      return
    }

    setErrorMsg(null)
    setSelectedFile(file)
  }

  const handleProcessReport = () => {
    if (!selectedFile) return
    setIsProcessing(true)

    // Simulate clinical document intelligence extraction (MedGemma / pipeline)
    setTimeout(() => {
      const mockReport: MedicalReportItem = {
        id: `REP-${Date.now()}`,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        fileType: selectedFile.type,
        uploadDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        tests: [
          {
            name: 'Fasting Blood Glucose',
            value: '118',
            unit: 'mg/dL',
            referenceRange: '70 - 99 mg/dL',
            status: 'high',
          },
          {
            name: 'HbA1c (Glycated Hemoglobin)',
            value: '6.2',
            unit: '%',
            referenceRange: '< 5.7 % (Normal), 5.7-6.4% (Prediabetes)',
            status: 'high',
          },
          {
            name: 'Total Cholesterol',
            value: '185',
            unit: 'mg/dL',
            referenceRange: '< 200 mg/dL',
            status: 'normal',
          },
          {
            name: 'Hemoglobin (Hb)',
            value: '14.2',
            unit: 'g/dL',
            referenceRange: '13.0 - 17.0 g/dL',
            status: 'normal',
          },
          {
            name: 'Thyroid Stimulating Hormone (TSH)',
            value: '2.84',
            unit: 'uIU/mL',
            referenceRange: '0.40 - 4.20 uIU/mL',
            status: 'normal',
          },
        ],
        aiInterpretation:
          'Your fasting glucose (118 mg/dL) and HbA1c (6.2%) are slightly elevated, indicating a prediabetic metabolic pattern. Other basic metabolic parameters, including hemoglobin and thyroid hormone levels, fall within normal reference ranges.',
        warningSigns: [
          'Elevated fasting blood sugar requires dietary assessment and confirmation testing.',
          'Consult a registered physician or endocrinologist before making medication changes.',
        ],
      }

      setAnalyzedReport(mockReport)
      setIsProcessing(false)
      onReportAnalyzed(mockReport)
    }, 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 px-5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileUp size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Medical Report Intelligence</h3>
              <p className="text-[11px] text-slate-400">Upload lab tests (PDF, JPG, PNG)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {!analyzedReport && (
            <>
              {/* Dropzone */}
              <label className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileText size={32} className="text-slate-500 mb-2" />
                <span className="text-slate-300 font-medium mb-1">
                  {selectedFile ? selectedFile.name : 'Click to select or drag a medical document'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Supports CBC, Blood Sugar, HbA1c, Thyroid, Lipid profile (Max 10MB)
                </span>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {selectedFile && !isProcessing && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleProcessReport}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <span>Analyze Medical Report</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {isProcessing && (
                <div className="p-6 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin mx-auto" />
                  <p className="text-slate-300 font-medium">Extracting medical test parameters...</p>
                  <p className="text-slate-500 text-[11px]">
                    Preserving test units, reference ranges, and clinical values
                  </p>
                </div>
              )}
            </>
          )}

          {/* Analyzed Report View */}
          {analyzedReport && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} className="text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-200">{analyzedReport.fileName}</span>
                    <span className="block text-[10px] text-slate-500">
                      {analyzedReport.fileSize} • Uploaded {analyzedReport.uploadDate}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Extracted
                </span>
              </div>

              {/* Tests Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-950 p-2.5 text-[11px] font-mono text-slate-400 border-b border-slate-800">
                  <span className="col-span-5">Test Parameter</span>
                  <span className="col-span-3">Result</span>
                  <span className="col-span-4">Reference Range</span>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {analyzedReport.tests.map((t, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 p-2.5 items-center bg-slate-900/40 text-xs"
                    >
                      <span className="col-span-5 font-medium text-slate-200">{t.name}</span>
                      <div className="col-span-3 flex items-center gap-1 font-mono font-semibold">
                        <span
                          className={
                            t.status === 'high'
                              ? 'text-amber-400'
                              : t.status === 'low'
                              ? 'text-sky-400'
                              : 'text-emerald-400'
                          }
                        >
                          {t.value} {t.unit}
                        </span>
                        {t.status === 'high' && <TrendingUp size={12} className="text-amber-400" />}
                        {t.status === 'low' && <TrendingDown size={12} className="text-sky-400" />}
                      </div>
                      <span className="col-span-4 text-[11px] text-slate-400 font-mono">
                        {t.referenceRange}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interpretation */}
              <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-900/40 space-y-1">
                <span className="font-semibold text-sky-300 uppercase font-mono text-[10px]">
                  AI Doctor Explanation:
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {analyzedReport.aiInterpretation}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle size={12} />
                  Important Clinical Note:
                </span>
                <p>
                  This AI extraction is for informational understanding only. Always verify reports
                  with an authorized medical practitioner.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setAnalyzedReport(null)
                    setSelectedFile(null)
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                  Upload Another
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium"
                >
                  Discuss with AI Doctor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
