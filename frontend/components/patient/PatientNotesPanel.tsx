'use client'

import { useEffect, useState } from 'react'
import { FileText, LockKeyhole, RotateCcw, Save } from 'lucide-react'
import { ClinicalBadge, ClinicalButton, ClinicalCard } from '@/components/ui/clinical-primitives'

const STORAGE_KEY = 'medicus-care-patient-notes-v1'

export function PatientNotesPanel() {
  const [notes, setNotes] = useState('')
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState(true)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { text?: string; savedAt?: string }
        setNotes(parsed.text || '')
        setSavedAt(parsed.savedAt || null)
      }
    } catch {
      // A blocked or unavailable localStorage should not make this screen unusable.
    } finally {
      setReady(true)
    }
  }, [])

  const saveNotes = () => {
    const timestamp = new Date().toISOString()
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: notes, savedAt: timestamp }))
      setSavedAt(timestamp)
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  const clearNotes = () => {
    if (!window.confirm('Clear the notes saved in this browser?')) return
    setNotes('')
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      setSavedAt(null)
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <ClinicalBadge><FileText size={13} /> Personal workspace</ClinicalBadge>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#183a34] sm:text-4xl">Your health notes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687b74]">Keep questions and details you want to remember for a conversation with a qualified clinician.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#71817b]">
          <LockKeyhole size={15} className="text-[#4d7e6b]" /> Saved only in this browser
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(250px,.7fr)]">
        <ClinicalCard className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-[#edf1ee] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-[#29463f]">Private notes</h2>
              <p className="mt-1 text-xs text-[#7a8983]">A simple personal reminder—not part of your medical record.</p>
            </div>
            <ClinicalBadge className={saved ? '' : 'border-amber-200 bg-amber-50 text-amber-800'}>
              <span className={`h-1.5 w-1.5 rounded-full ${saved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {saved ? 'Saved' : 'Not saved'}
            </ClinicalBadge>
          </div>
          <div className="p-4 sm:p-6">
            <label htmlFor="patient-notes" className="sr-only">Write your personal health notes</label>
            <textarea
              id="patient-notes"
              value={notes}
              onChange={(event) => { setNotes(event.target.value); setSaved(false) }}
              disabled={!ready}
              placeholder={'Questions I want to ask…\n\nSymptoms or changes I want to remember…\n\nDates, medicines, or details to discuss…'}
              className="min-h-[320px] w-full resize-y rounded-xl border border-[#dfe8e2] bg-[#fcfdfc] p-4 text-sm leading-7 text-[#2b4841] placeholder:text-[#9aa8a1] focus:border-[#75aa97] focus:outline-none focus:ring-4 focus:ring-[#e4f1ea] disabled:opacity-60 sm:p-5"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#7b8983]" aria-live="polite">
                {!ready ? 'Opening notes…' : savedAt && saved ? `Last saved ${new Date(savedAt).toLocaleString()}` : 'Changes are not saved yet'}
              </p>
              <div className="flex items-center gap-2">
                <ClinicalButton variant="quiet" size="sm" onClick={clearNotes} disabled={!ready || (!notes && !savedAt)}>
                  <RotateCcw size={14} /> Clear
                </ClinicalButton>
                <ClinicalButton size="sm" onClick={saveNotes} disabled={!ready || saved}>
                  <Save size={14} /> Save notes
                </ClinicalButton>
              </div>
            </div>
          </div>
        </ClinicalCard>

        <aside className="space-y-4">
          <ClinicalCard className="p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5f0] text-[#176b5b]"><LockKeyhole size={18} /></div>
            <h2 className="mt-4 text-base font-semibold text-[#29463f]">Know where notes live</h2>
            <p className="mt-2 text-sm leading-6 text-[#6d7e77]">These notes stay in this browser’s local storage. They are not sent to your account, shared with a doctor, or synced to other devices.</p>
            <p className="mt-3 rounded-xl bg-[#f6f9f7] p-3 text-xs leading-5 text-[#76857f]">Avoid entering information you would not want stored on this device. Clear notes on shared devices.</p>
          </ClinicalCard>
          <ClinicalCard className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#528170]">A useful prompt</p>
            <h2 className="mt-2 text-base font-semibold text-[#29463f]">What changed, and when?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6d7e77]">Timing, what makes a symptom better or worse, and questions you want answered can help you prepare for a clinician visit.</p>
          </ClinicalCard>
        </aside>
      </div>
    </section>
  )
}
