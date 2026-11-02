'use client'

import React, { useState } from 'react'
import type { ConsultationLanguage, DoctorId } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { Globe, Check, Sparkles, Volume2, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react'
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
      dr_arjun: 'ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಅರ್ಜುನ್. ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಮಾತನಾಡಲು ಬಂದಿದ್ದೇನೆ. ಇಂದು ನಿಮಗೆ ಏನು ತೊಂದರೆಯಾಗುತ್ತಿದೆ?',
      dr_ananya: 'ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಅನನ್ಯಾ. ನಿಮ್ಮ ಆರೋಗ್ಯ ಮತ್ತು ಕ್ಷೇಮದ ಬಗ್ಗೆ ಮಾತನಾಡಲು ಬಂದಿದ್ದೇನೆ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    },
  },
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    region: 'All India & Global',
    sampleGreeting: {
      dr_arjun: "Hello! I'm Dr. Arjun, your AI physician. I'm here to talk about your health. How can I help you today?",
      dr_ananya: "Hello! I'm Dr. Ananya. I'm here to guide your diagnostic review and wellness. What symptoms are you experiencing?",
    },
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'National (भारत)',
    sampleGreeting: {
      dr_arjun: 'नमस्ते! मैं डॉ. अर्जुन हूँ। आपके स्वास्थ्य के बारे में बात करने आया हूँ। आज आपको क्या परेशानी हो रही है?',
      dr_ananya: 'नमस्ते! मैं डॉ. अनन्या हूँ। आपकी सेहत और जांच रिपोर्ट की समीक्षा के लिए यहाँ हूँ। आपको क्या समस्या है?',
    },
  },
  {
    code: 'te',
    label: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'Andhra Pradesh & Telangana',
    sampleGreeting: {
      dr_arjun: 'నమస్కారం! నేను డాక్టర్ అర్జున్. మీ ఆరోగ్య సమస్య గురించి చర్చించడానికి వచ్చాను. ఈ రోజు మీకు ఏ విధమైన సమస్య ఉంది?',
      dr_ananya: 'నమస్కారం! నేను డాక్టర్ అనన్య. మీ ఆరోగ్య మరియు వెల్‌నెస్ సమీక్షకు నేను ఇక్కడ ఉన్నాను. మీకు ఎలా సహాయపడగలను?',
    },
  },
  {
    code: 'ta',
    label: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'Tamil Nadu (தமிழ்நாடு)',
    sampleGreeting: {
      dr_arjun: 'வணக்கம்! நான் டாக்டர் அர்ஜுன். உங்கள் உடல்நலம் பற்றி பேச வந்துள்ளேன். இன்று உங்களுக்கு என்ன பிரச்சனை?',
      dr_ananya: 'வணக்கம்! நான் டாக்டர் அனன்யா. உங்கள் ஆரோக்கியம் மற்றும் நல்வாழ்வு பற்றி விவாதிக்க வந்துள்ளேன். உங்களுக்கு என்ன உதவி தேவை?',
    },
  },
  {
    code: 'ml',
    label: 'Malayalam',
    nativeName: 'മലയാളം',
    region: 'Kerala (കേരളം)',
    sampleGreeting: {
      dr_arjun: 'നമസ്കാരം! ഞാൻ ഡോ. അർജുൻ. നിങ്ങളുടെ ആരോഗ്യത്തെക്കുറിച്ച് സംസാരിക്കാൻ വന്നതാണ്. ഇന്ന് നിങ്ങൾക്ക് എന്താണ് ബുദ്ധിമുട്ട്?',
      dr_ananya: 'നമസ്കാരം! ഞാൻ ഡോ. അനന്യ. നിങ്ങളുടെ ആരോഗ്യവും ക്ഷേമവും വിലയിരുത്താൻ ഞാൻ ഇവിടെയുണ്ട്. ഞാൻ എങ്ങനെ സഹായിക്കണം?',
    },
  },
  {
    code: 'mr',
    label: 'Marathi',
    nativeName: 'मराठी',
    region: 'Maharashtra (महाराष्ट्र)',
    sampleGreeting: {
      dr_arjun: 'नमस्कार! मी डॉ. अर्जुन आहे. आपल्या आरोग्याबद्दल चर्चा करण्यासाठी आलो आहे. आज आपल्याला काय त्रास होत आहे?',
      dr_ananya: 'नमस्कार! मी डॉ. अनन्या आहे. आपल्या आरोग्याची आणि निरोगीपणाची काळजी घेण्यासाठी मी येथे आहे. मी कशी मदत करू?',
    },
  },
  {
    code: 'bn',
    label: 'Bengali',
    nativeName: 'বাংলা',
    region: 'West Bengal & Tripura',
    sampleGreeting: {
      dr_arjun: 'নমস্কার! আমি ডঃ অর্জুন। আপনার স্বাস্থ্য নিয়ে কথা বলতে এসেছি। আজ আপনার কী সমস্যা হচ্ছে?',
      dr_ananya: 'নমস্কার! আমি ডঃ অনন্যা। আপনার সুস্থতা এবং স্বাস্থ্য পরীক্ষার জন্য আমি এখানে আছি। আমি কীভাবে সাহায্য করতে পারি?',
    },
  },
  {
    code: 'gu',
    label: 'Gujarati',
    nativeName: 'ગુજરાતી',
    region: 'Gujarat (ગુજરાત)',
    sampleGreeting: {
      dr_arjun: 'નમસ્તે! હું ડૉ. અર્જુન છું. તમારા સ્વાસ્થ્ય વિશે વાત કરવા આવ્યો છું. આજે તમને શું તકલીફ છે?',
      dr_ananya: 'નમસ્તે! હું ડૉ. અનન્યા છું. તમારા આરોગ્ય અને સુખાકારીની સમીક્ષા કરવા માટે હું અહીં છું. હું તમને કેવી રીતે મદદ કરી શકું?',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-3xl glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill mb-3">
            <Globe size={14} className="text-sky-400" />
            <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
              MediCare • Welcome to Your Consultation
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Which language are you most comfortable speaking?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Choose your preferred language for the entire consultation. {doctor.name} will speak,
            listen, understand symptoms, and respond naturally in this language.
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 mb-6 max-h-[38vh] scrollbar-thin">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentSelected === lang.code
            return (
              <div
                key={lang.code}
                onClick={() => handleCardClick(lang.code)}
                className={`p-3.5 rounded-2xl cursor-pointer border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'glass-card border-sky-400/80 bg-sky-950/50 shadow-lg shadow-sky-500/20 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base sm:text-lg font-bold text-white">
                    {lang.nativeName}
                  </span>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700" />
                  )}
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-300 block">{lang.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{lang.region}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Doctor Preview Greeting Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
            {doctorId === 'dr_ananya' ? 'An' : 'Ar'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">
                {doctor.name} will greet you in {selectedOption.label} ({selectedOption.nativeName}):
              </span>
              <span className="text-[10px] text-sky-400 font-mono font-semibold flex items-center gap-1">
                <Volume2 size={12} />
                <span>Native Voice Active</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-sky-200 leading-relaxed italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              "{selectedOption.sampleGreeting[doctorId]}"
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            You can also switch language at any time during the call
          </span>

          <button
            onClick={() => {
              soundFX.playClick()
              onConfirm()
            }}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
          >
            <span>Start Consultation in {selectedOption.nativeName}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
