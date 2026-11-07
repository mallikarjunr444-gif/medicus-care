'use client'

import React, { useState } from 'react'
import type { ConsultationLanguage, DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { Globe, Check, ArrowRight } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="consultation-language-title" className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-3">
            <Globe size={14} className="text-teal-800" />
            <span className="text-xs font-semibold text-teal-900">
              Consultation preferences
            </span>
          </div>

          <h2 id="consultation-language-title" className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
            Which language are you most comfortable speaking?
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
            Choose a language for voice recognition and messages. After you start, the microphone listens for a phrase and sends it when you pause. You can mute it at any time.
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto pr-1 mb-5 max-h-[42vh] scrollbar-thin">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentSelected === lang.code
            return (
              <button
                type="button"
                key={lang.code}
                onClick={() => handleCardClick(lang.code)}
                aria-pressed={isSelected}
                className={`min-h-[88px] p-3.5 rounded-xl text-left border transition-colors duration-150 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base sm:text-lg font-semibold text-slate-900">
                    {lang.nativeName}
                  </span>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-800 block">{lang.label}</span>
                  <span className="text-[10px] text-slate-600">{lang.region}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#123d55] flex items-center justify-center text-white font-semibold flex-shrink-0">
            {doctorId === 'dr_ananya' ? 'An' : 'Ar'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-900">
                Consultation language: {selectedOption.label} ({selectedOption.nativeName})
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              With {doctor.name}. You can switch languages during the call or type instead of speaking.
            </p>
          </div>
        </div>

        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-700">
          <input
            type="checkbox"
            checked={hasConsultationConsent}
            onChange={(event) => setHasConsultationConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-teal-700"
          />
          <span>
            I agree to use the microphone for speech recognition and to send my transcript and the doctor&apos;s replies to Medicus Care for this consultation. The conversation is saved in my consultation history. If local medical references have no match, a search query with common direct identifiers removed may be sent to PubMed; I will avoid sharing identifying details. Camera access is optional and starts only if I turn it on. I understand this is an AI health assistant, not a licensed physician.
          </span>
        </label>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Microphone starts if this browser supports voice input.
          </span>

          <button
            onClick={() => {
              soundFX.playClick()
              onConfirm()
            }}
            disabled={!hasConsultationConsent}
            className="min-h-12 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#123d55] hover:bg-[#0d3145] disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
          >
            <span>Start Consultation in {selectedOption.nativeName}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
