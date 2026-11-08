'use client'

import React, { useState } from 'react'
import type { ConsultationLanguage, DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { Check, ArrowRight } from 'lucide-react'
import { soundFX } from '@/lib/audioEffects'

export interface LanguageOption {
  code: ConsultationLanguage
  label: string
  nativeName: string
  region: string
  sampleGreeting: Record<DoctorId, string>
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'kn',
    label: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    region: 'Karnataka (ಕರ್ನಾಟಕ)',
    sampleGreeting: {
      dr_arjun: 'ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಸ್ಮಿತ್. ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಮಾತನಾಡಲು ಬಂದಿದ್ದೇನೆ. ಇಂದು ನಿಮಗೆ ಏನು ತೊಂದರೆಯಾಗುತ್ತಿದೆ?',
      dr_ananya: 'ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಅನನ್ಯಾ. ನಿಮ್ಮ ಆರೋಗ್ಯ ಮತ್ತು ಕ್ಷೇಮದ ಬಗ್ಗೆ ಮಾತನಾಡಲು ಬಂದಿದ್ದೇನೆ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    },
  },
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    region: 'All India & Global',
    sampleGreeting: {
      dr_arjun: "Hello! I'm Dr. Smit, your AI physician. I'm here to talk about your health. How can I help you today?",
      dr_ananya: "Hello! I'm Dr. Ananya. I'm here to guide your diagnostic review and wellness. What symptoms are you experiencing?",
    },
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'National (भारत)',
    sampleGreeting: {
      dr_arjun: 'नमस्ते! मैं डॉ. स्मित हूँ। आपके स्वास्थ्य के बारे में बात करने आया हूँ। आज आपको क्या परेशानी हो रही है?',
      dr_ananya: 'नमस्ते! मैं डॉ. अनन्या हूँ। आपकी सेहत और जांच रिपोर्ट की समीक्षा के लिए यहाँ हूँ। आपको क्या समस्या है?',
    },
  },
]

interface LanguageSelectionModalProps {
  isOpen: boolean
  doctorId: DoctorId
  selectedLanguage: ConsultationLanguage
  onSelectLanguage: (lang: ConsultationLanguage) => void
  onConfirm: () => void
}

export function LanguageSelectionModal({
  isOpen,
  doctorId,
  selectedLanguage,
  onSelectLanguage,
  onConfirm,
}: LanguageSelectionModalProps) {
  const [currentSelected, setCurrentSelected] = useState<ConsultationLanguage>(selectedLanguage)
  const [hasConsultationConsent, setHasConsultationConsent] = useState(false)
  const doctor = DOCTORS[doctorId] || DOCTORS.dr_arjun

  if (!isOpen) return null

  const handleCardClick = (code: ConsultationLanguage) => {
    setCurrentSelected(code)
    onSelectLanguage(code)
    soundFX.playClick()
  }

  const selectedOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentSelected) || SUPPORTED_LANGUAGES[0]

  return (
    <div className="font-consult fixed inset-0 z-50 flex items-center justify-center bg-clinic-ink/60 p-3 backdrop-blur-sm animate-fade-in sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="consultation-language-title" className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-[20px] bg-white p-5 shadow-[0_24px_60px_rgba(15,47,54,.35)] sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 id="consultation-language-title" className="mb-2 text-[26px] font-bold leading-tight tracking-tight text-clinic-ink sm:text-[30px]">
            Which language do you speak most comfortably?
          </h2>
          <p className="max-w-xl text-[15px] leading-relaxed text-clinic-muted">
            {doctor.name} will listen and reply in this language. The microphone sends what you say when you pause, and you can mute it at any time.
          </p>
        </div>

        {/* Language Grid */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentSelected === lang.code
            return (
              <button
                type="button"
                key={lang.code}
                onClick={() => handleCardClick(lang.code)}
                aria-pressed={isSelected}
                className={`flex min-h-[96px] flex-col justify-between rounded-2xl border-2 p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/30 ${
                  isSelected
                    ? 'border-clinic-teal bg-clinic-mist/60'
                    : 'border-clinic-hairline bg-white hover:bg-clinic-porcelain'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[22px] font-bold leading-tight text-clinic-ink">
                    {lang.nativeName}
                  </span>
                  {isSelected ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-clinic-teal text-white">
                      <Check size={14} strokeWidth={3} aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="h-6 w-6 rounded-full border-2 border-clinic-hairline" aria-hidden="true" />
                  )}
                </div>

                <div>
                  <span className="block text-[14px] font-semibold text-clinic-ink">{lang.label}</span>
                  <span className="text-[13px] text-clinic-muted">{lang.region}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-clinic-porcelain p-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-clinic-ink text-[15px] font-bold text-white">
            {doctorId === 'dr_ananya' ? 'An' : 'Ar'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[15px] font-bold text-clinic-ink">
                {doctor.name} · {selectedOption.label} ({selectedOption.nativeName})
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-clinic-muted">
              You can switch language during the call, or type instead of speaking.
            </p>
          </div>
        </div>

        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-clinic-hairline bg-white p-4 text-[14px] leading-[1.65] text-clinic-ink focus-within:border-clinic-teal">
          <input
            type="checkbox"
            checked={hasConsultationConsent}
            onChange={(event) => setHasConsultationConsent(event.target.checked)}
            className="mt-1 h-5 w-5 flex-shrink-0 accent-[#0c6e70]"
          />
          <span>
            I agree to use the microphone for speech recognition and to send my transcript and the doctor&apos;s replies to MediCare for this consultation. The conversation is saved in my consultation history. If local medical references have no match, a search query with common direct identifiers removed may be sent to PubMed; I will avoid sharing identifying details. Camera access is optional and starts only if I turn it on. I understand this is an AI health assistant, not a licensed physician.
          </span>
        </label>

        {/* Action Button */}
        <div className="flex flex-col gap-3 border-t border-clinic-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="hidden text-[13px] text-clinic-muted sm:inline">
            Microphone starts if this browser supports voice input.
          </span>

          <button
            onClick={() => {
              soundFX.playClick()
              onConfirm()
            }}
            disabled={!hasConsultationConsent}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-clinic-teal px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-clinic-teal-deep disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clinic-teal/30 sm:w-auto"
          >
            <span>Start in {selectedOption.nativeName}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
