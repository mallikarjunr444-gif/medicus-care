'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Building2, CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, Phone, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '@/lib/api'

export interface Specialist {
  id: string
  name: string
  specialty: string
  qualification: string
  hospital: string
  location: string
  district: string
  state: string
  available_days: string[]
  consultation_type: string
  contact_phone?: string
}

export interface AppointmentRequestResult {
  booking_id: string
  doctor_name: string
  specialty: string
  hospital: string
  location: string
  district: string
  date: string
  time_slot: string
  phone?: string
}

interface SpecialistBookingModalProps {
  isOpen: boolean
  onClose: () => void
  initialSpecialty?: string
  onAppointmentBooked?: (details: AppointmentRequestResult) => void
}

export function SpecialistBookingModal({ isOpen, onClose, initialSpecialty, onAppointmentBooked }: SpecialistBookingModalProps) {
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredSlot, setPreferredSlot] = useState('Morning (10:00 AM - 1:00 PM)')
  const [patientConfirmed, setPatientConfirmed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const selectedSpecialist = specialists.find((specialist) => specialist.id === selectedId) || null

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setIsLoading(true)
    setErrorMessage(null)
    api.getSpecialists().then((result) => {
      if (!active) return
      const items = (result.specialists || []) as Specialist[]
      setSpecialists(items)
      const preferred = initialSpecialty
        ? items.find((item) => item.specialty.toLowerCase().includes(initialSpecialty.toLowerCase()))
        : undefined
      setSelectedId(preferred?.id || items[0]?.id || '')
      if (!items.length) setErrorMessage('No specialists were returned for this district.')
    }).catch(() => {
      if (active) setErrorMessage('The specialist directory could not be loaded. Try again when the service is available.')
    }).finally(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [isOpen, initialSpecialty])

  if (!isOpen) return null

  const handleRequest = async () => {
    if (!selectedSpecialist || !patientConfirmed) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await api.requestAppointment({
        specialist_id: selectedSpecialist.id,
        preferred_date: preferredDate,
        preferred_time_slot: preferredSlot,
        reason: `Specialist consultation request for ${selectedSpecialist.specialty}.`,
        patient_confirmed: true,
      })
      const details: AppointmentRequestResult = {
        booking_id: result.booking_id,
        doctor_name: result.specialist.name,
        specialty: result.specialist.specialty,
        hospital: result.specialist.hospital,
        location: result.clinic_location,
        district: result.specialist.district,
        date: result.appointment_date,
        time_slot: result.time_slot,
        phone: result.hospital_contact,
      }
      toast.success('Your appointment request was submitted. Contact the clinic to confirm availability.')
      onAppointmentBooked?.(details)
      onClose()
    } catch (error) {
      const message = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErrorMessage(message || 'The appointment request could not be submitted. Please try again.')
      toast.error('Appointment request was not submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="specialist-title" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><Stethoscope size={19} /></div>
            <div>
              <h2 id="specialist-title" className="text-base font-semibold text-slate-900">Request a specialist appointment</h2>
              <p className="mt-0.5 text-xs text-slate-500">Directory results from Medicus Care’s specialist service</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close specialist request" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={18} /></button>
        </header>

        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-600"><Loader2 size={18} className="animate-spin" />Loading specialists…</div>
          ) : errorMessage && !specialists.length ? (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{errorMessage}</div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-800">Available specialists</h3>
                {specialists.map((specialist) => {
                  const selected = specialist.id === selectedId
                  return (
                    <button key={specialist.id} type="button" aria-pressed={selected} onClick={() => setSelectedId(specialist.id)} className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 ${selected ? 'border-sky-700 bg-sky-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{specialist.name}</div>
                          <div className="mt-0.5 text-sm text-sky-900">{specialist.specialty}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{specialist.qualification}</div>
                        </div>
                        {selected && <CheckCircle2 size={18} className="shrink-0 text-sky-800" />}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1"><Building2 size={13} />{specialist.hospital}</span>
                        <span className="inline-flex items-center gap-1"><MapPin size={13} />{specialist.location}</span>
                        {specialist.contact_phone && <span className="inline-flex items-center gap-1"><Phone size={13} />{specialist.contact_phone}</span>}
                        <span>{specialist.consultation_type}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-slate-800">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-sky-800" />Preferred date</span>
                  <input type="date" value={preferredDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setPreferredDate(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-800">
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={15} className="text-sky-800" />Preferred time</span>
                  <select value={preferredSlot} onChange={(event) => setPreferredSlot(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100">
                    <option>Morning (10:00 AM - 1:00 PM)</option>
                    <option>Afternoon (2:00 PM - 5:00 PM)</option>
                    <option>Evening (5:30 PM - 7:30 PM)</option>
                  </select>
                </label>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-5 text-slate-700">
                <input type="checkbox" checked={patientConfirmed} onChange={(event) => setPatientConfirmed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-800 focus:ring-sky-700" />
                <span>I authorize Medicus Care to submit an appointment request for {selectedSpecialist?.name || 'the selected specialist'}. The clinic must confirm availability separately.</span>
              </label>
              <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-sky-800" />This sends a request to the configured directory service; it does not guarantee a clinic booking.</p>
              {errorMessage && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{errorMessage}</div>}
            </>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleRequest} disabled={!selectedSpecialist || !preferredDate || !patientConfirmed || isSubmitting || isLoading} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#123d55] px-4 text-sm font-semibold text-white hover:bg-[#0d3145] disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isSubmitting ? 'Submitting…' : 'Submit appointment request'}
          </button>
        </footer>
      </section>
    </div>
  )
}
