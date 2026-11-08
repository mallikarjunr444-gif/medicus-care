'use client'

import { CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Stethoscope } from 'lucide-react'
import type { AppointmentRequestResult } from '@/components/doctor/SpecialistBookingModal'
import { ClinicalBadge, ClinicalButton, ClinicalCard } from '@/components/ui/clinical-primitives'

interface AppointmentWorkspaceProps {
  onRequestAppointment: () => void
  latestRequest: AppointmentRequestResult | null
}

export function AppointmentWorkspace({ onRequestAppointment, latestRequest }: AppointmentWorkspaceProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <ClinicalBadge><CalendarDays size={13} /> Care coordination</ClinicalBadge>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#1d1d1f] sm:text-4xl">Appointments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e6e73]">Send a request to a specialist in the available directory. The clinic confirms the appointment separately.</p>
        </div>
        <ClinicalButton onClick={onRequestAppointment}><CalendarDays size={16} /> Request an appointment</ClinicalButton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(270px,.65fr)]">
        <ClinicalCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[#d2d2d7] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-[#6e6e73]">Your appointment requests</h2>
              <p className="mt-1 text-xs text-[#6e6e73]">Requests submitted during this visit appear here.</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f7] text-[#6e6e73]"><Stethoscope size={18} /></span>
          </div>

          {latestRequest ? (
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" />
                <div className="min-w-0">
                  <p className="font-semibold text-[#6e6e73]">Request sent · awaiting clinic confirmation</p>
                  <p className="mt-1 text-sm text-[#6e6e73]">{latestRequest.doctor_name} · {latestRequest.specialty}</p>
                  <div className="mt-4 grid gap-2 text-xs text-[#6e6e73] sm:grid-cols-2">
                    <span className="flex items-center gap-2"><CalendarDays size={14} />{latestRequest.date} · {latestRequest.time_slot}</span>
                    <span className="flex items-center gap-2"><MapPin size={14} />{latestRequest.hospital}, {latestRequest.location}</span>
                  </div>
                  <p className="mt-4 rounded-xl bg-[#f5f5f7] p-3 text-xs leading-5 text-[#6e6e73]">Request ID: {latestRequest.booking_id}. This is a request, not a confirmed appointment. Contact the clinic to confirm availability.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#6e6e73]"><CalendarDays size={21} /></span>
              <h3 className="mt-4 text-base font-semibold text-[#6e6e73]">No appointment request yet</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#6e6e73]">Browse the available specialists and submit a preferred date and time for the clinic to review.</p>
              <ClinicalButton className="mt-5" variant="secondary" onClick={onRequestAppointment}>Browse specialists</ClinicalButton>
            </div>
          )}
        </ClinicalCard>

        <aside className="space-y-4">
          <ClinicalCard className="p-5 sm:p-6">
            <ClinicalBadge><ShieldCheck size={13} /> Clear next steps</ClinicalBadge>
            <ol className="mt-5 space-y-4">
              {[
                ['01', 'Choose a specialist', 'Review directory details and location.'],
                ['02', 'Send your preferred time', 'Your request is sent to the configured service.'],
                ['03', 'Wait for clinic confirmation', 'The clinic confirms availability directly.'],
              ].map(([number, title, description]) => (
                <li key={number} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f7] text-[11px] font-bold text-[#0071e3]">{number}</span>
                  <span><span className="block text-sm font-semibold text-[#6e6e73]">{title}</span><span className="mt-0.5 block text-xs leading-5 text-[#6e6e73]">{description}</span></span>
                </li>
              ))}
            </ol>
          </ClinicalCard>
          <ClinicalCard className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#6e6e73]"><Clock3 size={16} /><h2 className="text-sm font-semibold text-[#6e6e73]">Before you request</h2></div>
            <p className="mt-2 text-sm leading-6 text-[#6e6e73]">A preferred time is not a confirmed slot. The request form displays current directory results and asks for your consent before sending.</p>
          </ClinicalCard>
        </aside>
      </div>
    </section>
  )
}
