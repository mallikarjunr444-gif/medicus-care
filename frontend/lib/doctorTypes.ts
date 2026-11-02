export type DoctorId = 'dr_arjun' | 'dr_ananya'

export type DoctorState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'disconnected'
  | 'explaining'
  | 'waiting'
  | 'reconnecting'

export type ConsultationLanguage = 'en' | 'kn' | 'hi'

export type TriageLevel = 1 | 2 | 3 | 4

export interface DoctorProfile {
  id: DoctorId
  name: string
  formalTitle: string
  specialty: string
  gender: 'male' | 'female'
  bio: string
  avatarThumbnail: string
  coatColor: string
  scrubColor: string
  stethColor: string
  languages: { code: ConsultationLanguage; label: string; nativeName: string }[]
  badgeNumber: string
}

export interface MedicalReportItem {
  id: string
  fileName: string
  fileSize: string
  fileType: string
  uploadDate: string
  tests: {
    name: string
    value: string
    unit: string
    referenceRange: string
    status: 'normal' | 'low' | 'high' | 'critical'
  }[]
  aiInterpretation: string
  warningSigns: string[]
}

export interface ConsultationSummaryData {
  id: string
  consultationDate: string
  doctorId: DoctorId
  doctorName: string
  language: ConsultationLanguage
  languageLabel: string
  durationFormatted: string
  patientReportedSymptoms: string[]
  symptomDuration: string
  relevantHistory: string
  informationDiscussed: string[]
  triageLevel: TriageLevel
  triageTitle: string
  warningSignsIdentified: string[]
  recommendedNextSteps: string[]
  referralRecommendation: string
  disclaimer: string
}

export const DOCTORS: Record<DoctorId, DoctorProfile> = {
  dr_arjun: {
    id: 'dr_arjun',
    name: 'Dr. Arjun',
    formalTitle: 'Dr. Arjun, M.D.',
    specialty: 'AI General Physician & Health Assistant',
    gender: 'male',
    bio: 'Specialized in primary healthcare triage, symptom assessment, and preventative medical guidance.',
    avatarThumbnail: '/avatars/dr_arjun_thumb.png',
    coatColor: '#FFFFFF',
    scrubColor: '#0E7490', // Cyan-700
    stethColor: '#0284C7', // Sky-600
    badgeNumber: 'MC-ARJ-2026',
    languages: [
      { code: 'en', label: 'English', nativeName: 'English' },
      { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
    ],
  },
  dr_ananya: {
    id: 'dr_ananya',
    name: 'Dr. Ananya',
    formalTitle: 'Dr. Ananya, M.D.',
    specialty: 'AI General Physician & Wellness Consultant',
    gender: 'female',
    bio: 'Specialized in holistic preliminary health assessment, diagnostic lab interpretation, and wellness counselling.',
    avatarThumbnail: '/avatars/dr_ananya_thumb.png',
    coatColor: '#FFFFFF',
    scrubColor: '#2563EB', // Blue-600
    stethColor: '#7C3AED', // Violet-600
    badgeNumber: 'MC-ANA-2026',
    languages: [
      { code: 'en', label: 'English', nativeName: 'English' },
      { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
    ],
  },
}
