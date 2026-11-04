// MediCare Natural Multilingual Medical Consultation Engine
// Context-aware session memory, clinical intake staging, and regional response synthesis

import type { ConsultationLanguage, DoctorId, TriageLevel } from './doctorTypes'

export interface ClinicalSessionMemory {
  language: ConsultationLanguage
  doctorId: DoctorId
  chiefComplaints: string[]
  duration: string | null
  character: string | null // e.g. 'dry' (ಒಣ), 'productive' (ಕಫ/phlegm), 'spiking', etc.
  associatedSymptoms: string[] // e.g. 'fever', 'breathlessness', 'chest_pain', 'headache'
  severity: number // 1-10
  triageLevel: TriageLevel
  stage: 'intake' | 'characterize' | 'check_risks' | 'advice' | 'followup'
  askedQuestionKeys: string[]
  emergencyAlert: boolean
  patientHistory: string[]
}

export function createInitialSessionMemory(
  language: ConsultationLanguage = 'en',
  doctorId: DoctorId = 'dr_arjun'
): ClinicalSessionMemory {
  return {
    language,
    doctorId,
    chiefComplaints: [],
    duration: null,
    character: null,
    associatedSymptoms: [],
    severity: 5,
    triageLevel: 1,
    stage: 'intake',
    askedQuestionKeys: [],
    emergencyAlert: false,
    patientHistory: [],
  }
}

export interface EngineResult {
  response: string
  triage: TriageLevel
  warningSign?: string
  actionCard?: { type: string; payload: any }
  updatedMemory: ClinicalSessionMemory
}

// Medical Knowledge & Pattern Detection
export function analyzePatientInput(
  rawInput: string,
  memory: ClinicalSessionMemory
): EngineResult {
  const text = rawInput.trim()
  const lower = text.toLowerCase()
  const lang = memory.language
  const docId = memory.doctorId

  const updated: ClinicalSessionMemory = {
    ...memory,
    askedQuestionKeys: [...memory.askedQuestionKeys],
    chiefComplaints: [...memory.chiefComplaints],
    associatedSymptoms: [...memory.associatedSymptoms],
  }

  // ─────────────────────────────────────────────
  // 1. Critical Emergency Red Flags (Dial 112 / 108 immediately)
  // ─────────────────────────────────────────────
  const isEmergency =
    lower.includes('chest pain') ||
    lower.includes('heart attack') ||
    lower.includes('ಎದೆ ನೋವು') ||
    lower.includes('ಎದೆ ಕಟ್ಟಿದಂತಿದೆ') ||
    lower.includes('ಹೃದಯಾಘಾತ') ||
    lower.includes('छाती में दर्द') ||
    lower.includes('सांस नहीं') ||
    lower.includes('గుండె నొప్పి') ||
    lower.includes('நெஞ்சு வலி') ||
    lower.includes('ശ്വാസതടസ്സം') ||
    lower.includes('cannot breathe') ||
    lower.includes('severe bleeding') ||
    lower.includes('stroke') ||
    lower.includes('unconscious')

  if (isEmergency) {
    updated.emergencyAlert = true
    updated.triageLevel = 4
    updated.stage = 'advice'

    const emergencyResponses: Record<ConsultationLanguage, string> = {
      kn: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ: ಇದು ಗಂಭೀರವಾದ ಹೃದಯ ಅಥವಾ ಉಸಿರಾಟದ ತುರ್ತು ಲಕ್ಷಣವಾಗಿರಬಹುದು. ದಯವಿಟ್ಟು ವಿಳಂಬ ಮಾಡದೆ ತಕ್ಷಣವೇ 112 ಅಥವಾ 108 (ಆರೋಗ್ಯ ಕವಚ) ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ, ಅಥವಾ ಚಿಕ್ಕಮಗಳೂರು ಜಿಲ್ಲಾಸ್ಪತ್ರೆಗೆ ತಕ್ಷಣ ಭೇಟಿ ನೀಡಿ.',
      hi: 'आपातकालीन चेतावनी: यह एक गंभीर चिकित्सीय आपातकाल हो सकता है। कृपया तुरंत 112 या 108 (एम्बुलेंस) पर कॉल करें या तुरंत नजदीकी जिला अस्पताल के आपातकालीन कक्ष में जाएं।',
      en: 'EMERGENCY ALERT: These symptoms indicate an acute clinical emergency. Please call 112 immediately or reach District Hospital Chikkamagaluru emergency ward without delay.',
    }

    return {
      response: emergencyResponses[lang] || emergencyResponses.en,
      triage: 4,
      warningSign: 'Critical emergency red-flag detected. Immediate 112 medical response needed.',
      updatedMemory: updated,
    }
  }

  // ─────────────────────────────────────────────
  // 2. Extract Duration (e.g., 10 days, ಹತ್ತು ದಿನ, 2 weeks, etc.)
  // ─────────────────────────────────────────────
  const durationMatch =
    text.match(/(\d+|ಹತ್ತು|ಒಂದು|ಎರಡು|ಮೂರು|ನಾಲ್ಕು|ಐದು|दस|दो|तीन|चार|पाँच|ten|two|three|four|five|several|few)\s*(ದಿನ|ದಿನಗಳಿಂದ|days|day|weeks|ವಾರ|महीने|दिन)/i)

  if (durationMatch && !updated.duration) {
    updated.duration = durationMatch[0]
  }

  // ─────────────────────────────────────────────
  // 3. Clinical Symptom Entity Extraction
  // ─────────────────────────────────────────────
  const hasCough =
    lower.includes('cough') ||
    lower.includes('ಕೆಮ್ಮು') ||
    lower.includes('ಕಮ್ಮು') ||
    lower.includes('खांसी') ||
    lower.includes('దగ్గు') ||
    lower.includes('இருமல்') ||
    lower.includes('ചുമ')

  const hasFever =
    lower.includes('fever') ||
    lower.includes('ಜ್ವರ') ||
    lower.includes('ತಾಪಮಾನ') ||
    lower.includes('बुखार') ||
    lower.includes('జ్వరం') ||
    lower.includes('காய்ச்சல்') ||
    lower.includes('പനി')

  const hasHeadache =
    lower.includes('headache') ||
    lower.includes('ತಲೆನೋವು') ||
    lower.includes('ಮೈಗ್ರೇನ್') ||
    lower.includes('सिरदर्द') ||
    lower.includes('తలనొప్పి') ||
    lower.includes('தலைவலி') ||
    lower.includes('തലവേദന')

  const hasPhlegm =
    lower.includes('phlegm') ||
    lower.includes('mucus') ||
    lower.includes('ಕಫ') ||
    lower.includes('ಬರುತ್ತದೆ') ||
    lower.includes('कफ') ||
    lower.includes('बलगम')

  const isDryCough =
    lower.includes('dry') ||
    lower.includes('ಒಣ') ||
    lower.includes('ಒಣ ಕೆಮ್ಮು') ||
    lower.includes('सूखी') ||
    lower.includes('dry cough')

  const hasBreathlessness =
    lower.includes('breath') ||
    lower.includes('ಉಸಿರಾಟ') ||
    lower.includes('ಉಸಿರಾಟದ ತೊಂದರೆ') ||
    lower.includes('दम फूलना') ||
    lower.includes('శ్వాస') ||
    lower.includes('மூச்சு')

  // Register complaints
  if (hasCough && !updated.chiefComplaints.includes('cough')) updated.chiefComplaints.push('cough')
  if (hasFever && !updated.chiefComplaints.includes('fever')) updated.chiefComplaints.push('fever')
  if (hasHeadache && !updated.chiefComplaints.includes('headache')) updated.chiefComplaints.push('headache')

  // Register character
  if (isDryCough) updated.character = 'dry'
  if (hasPhlegm) updated.character = 'productive'

  // Register risks
  if (hasBreathlessness && !updated.associatedSymptoms.includes('breathlessness')) {
    updated.associatedSymptoms.push('breathlessness')
  }

  // ─────────────────────────────────────────────
  // 4. Conversational Progress State Machine
  // ─────────────────────────────────────────────

  // Case A: Patient mentions cough for the first time
  if (
    hasCough &&
    !updated.askedQuestionKeys.includes('cough_character') &&
    updated.stage === 'intake'
  ) {
    updated.stage = 'characterize'
    updated.askedQuestionKeys.push('cough_character')
    updated.triageLevel = 2

    const durText = updated.duration ? ` ${updated.duration}` : ''

    const responses: Record<ConsultationLanguage, string> = {
      kn: `ಸರಿ, ನಿಮಗೆ${durText ? durText + 'ಗಳಿಂದ' : ''} ಕೆಮ್ಮು ಇದೆ ಎಂದು ತಿಳಿಸಿದ್ದೀರಿ. ಈ ಕೆಮ್ಮು ಒಣ ಕೆಮ್ಮಾಗಿದೆಯೇ ಅಥವಾ ಕಫ ಬರುತ್ತಿದೆಯೇ?`,
      hi: `समझ गया, आपको${durText ? durText + ' से' : ''} खांसी हो रही है। क्या यह सूखी खांसी है या बलगम/कफ आ रहा है?`,
      en: `I understand, you've had a cough${durText ? ' for ' + durText : ''}. Is this a dry cough, or are you bringing up any phlegm or mucus?`,
    }

    return {
      response: responses[lang] || responses.en,
      triage: 2,
      updatedMemory: updated,
    }
  }

  // Case B: Patient answers about cough character (Dry or Phlegm)
  if (
    (isDryCough || hasPhlegm || lower.includes('no phlegm') || lower.includes('ಇಲ್ಲ')) &&
    updated.askedQuestionKeys.includes('cough_character') &&
    !updated.askedQuestionKeys.includes('check_fever_breath')
  ) {
    updated.stage = 'check_risks'
    updated.askedQuestionKeys.push('check_fever_breath')
    updated.triageLevel = 2

    const responses: Record<ConsultationLanguage, string> = {
      kn: 'ಅರ್ಥವಾಯಿತು. ಇದರ ಜೊತೆಗೆ ನಿಮಗೆ ಜ್ವರ ಅಥವಾ ಉಸಿರಾಟದಲ್ಲಿ ತೊಂದರೆ ಏನಾದರೂ ಇದೆಯೇ?',
      hi: 'ठीक है। इसके साथ क्या आपको बुखार महसूस हो रहा है या सांस लेने में कोई तकलीफ हो रही है?',
      en: 'Noted. Along with this, are you experiencing any fever or difficulty breathing?',
    }

    return {
      response: responses[lang] || responses.en,
      triage: 2,
      updatedMemory: updated,
    }
  }

  // Case C: Patient confirms breathlessness or fever
  if (
    (hasBreathlessness || lower.includes('ಸ್ವಲ್ಪ') || lower.includes('yes') || lower.includes('ಹಾ') || lower.includes('हाँ')) &&
    updated.askedQuestionKeys.includes('check_fever_breath') &&
    !updated.askedQuestionKeys.includes('breath_triage_given')
  ) {
    updated.stage = 'advice'
    updated.askedQuestionKeys.push('breath_triage_given')
    updated.triageLevel = 3

    const responses: Record<ConsultationLanguage, string> = {
      kn: 'ನಿಮ್ಮ ಉಸಿರಾಟದ ತೊಂದರೆಯನ್ನು ಸೂಕ್ಷ್ಮವಾಗಿ ಗಮನಿಸಬೇಕು. ಹತ್ತು ದಿನಗಳ ಕೆಮ್ಮಿನೊಂದಿಗೆ ಉಸಿರಾಟದ ಆಯಾಸವಿರುವುದು ಶ್ವಾಸಕೋಶದ ಸೋಂಕಿನ ಲಕ್ಷಣವಾಗಿರಬಹುದು. ಚಿಕ್ಕಮಗಳೂರು ಜಿಲ್ಲಾಸ್ಪತ್ರೆಯ ಶ್ವಾಸಕೋಶ ತಜ್ಞರನ್ನು ಅಥವಾ ಸಾಮಾನ್ಯ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ ಎದೆ ತಪಾಸಣೆ (Chest Auscultation) ಮಾಡಿಸುವುದು ಸೂಕ್ತ. ಆಮ್ಲಜನಕದ ಮಟ್ಟ (SpO2) 95ಕ್ಕಿಂತ ಕಡಿಮೆಯಾದರೆ ತಕ್ಷಣ 112 ಕರೆ ಮಾಡಿ.',
      hi: 'सांस लेने में तकलीफ को गंभीरता से देखना होगा। १० दिनों की खांसी के साथ सांस फूलना छाती के संक्रमण का संकेत हो सकता है। आपको जिला अस्पताल चिक्कमगलुरु के विशेषज्ञ चिकित्सक से मिलकर छाती की जांच करानी चाहिए। यदि सांस ज्यादा फूले तो तुरंत ११२ पर संपर्क करें।',
      en: 'Your reported breathlessness requires careful attention. A persistent cough accompanied by breathing difficulty may point to a lower respiratory tract infection. I recommend consulting an in-person physician or pulmonologist at District Hospital Chikkamagaluru for chest auscultation today. If oxygen saturation drops below 95%, seek urgent emergency care.',
    }

    return {
      response: responses[lang] || responses.en,
      triage: 3,
      warningSign: 'Breathlessness with persistent cough. Clinical evaluation advised today.',
      updatedMemory: updated,
    }
  }

  // Case D: Fever inquiries
  if (hasFever && !updated.askedQuestionKeys.includes('fever_intake')) {
    updated.askedQuestionKeys.push('fever_intake')
    updated.triageLevel = 2

    const responses: Record<ConsultationLanguage, string> = {
      kn: 'ಜ್ವರ ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ? ನಡುಕ, ತಲೆನೋವು ಅಥವಾ ದೇಹದ ನೋವು ಇದೆಯೇ? ದಯವಿಟ್ಟು ಸಾಕಷ್ಟು ನೀರು ಮತ್ತು ಎಳನೀರು ಕುಡಿಯಿರಿ.',
      hi: 'बुखार कितने दिनों से है? क्या ठंड लगकर कंपकंपी या बदन दर्द भी है? भरपूर पानी और तरल पदार्थ पिएं।',
      en: 'How long have you had this fever? Are you experiencing chills, headache, or body aches? Please stay well hydrated.',
    }

    return {
      response: responses[lang] || responses.en,
      triage: 2,
      updatedMemory: updated,
    }
  }

  // Case E: Lab Report Analysis
  if (lower.includes('report') || lower.includes('blood test') || lower.includes('cbc') || lower.includes('ವರದಿ')) {
    const responses: Record<ConsultationLanguage, string> = {
      kn: 'ಖಂಡಿತ. ಸೈಡ್‌ಬಾರ್‌ನ "Report" ಬಟನ್ ತೆರೆಯಿರಿ ಮತ್ತು ನಿಮ್ಮ ವರದಿಯ ಪಠ್ಯವನ್ನು ಅಂಟಿಸಿ. ವರದಿಯ ಅರ್ಥವನ್ನು ಚರ್ಚಿಸಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
      hi: 'जरूर! अपनी रक्त जांच या लैब रिपोर्ट को अपलोड करें। मैं सामान्य संदर्भ सीमाओं के आधार पर आपके परिणामों की व्याख्या करूँगा।',
      en: 'Certainly. Open the "Report" button in the conversation panel and paste your lab report text. I can help discuss the preliminary reference guidance with you.',
    }

    return {
      response: responses[lang] || responses.en,
      triage: 2,
      actionCard: { type: 'report_analysis', payload: {} },
      updatedMemory: updated,
    }
  }

  // Default natural clinical follow-up matching language without repetition
  const defaultResponses: Record<ConsultationLanguage, string> = {
    kn: 'ನಾನು ನಿಮ್ಮ ಮಾತನ್ನು ಗಮನಿಸುತ್ತಿದ್ದೇನೆ. ಈ ಲಕ್ಷಣಗಳು ದಿನದ ನಿರ್ದಿಷ್ಟ ಸಮಯದಲ್ಲಿ ಹೆಚ್ಚಾಗುತ್ತವೆಯೇ ಮತ್ತು ನೀವು ಯಾವುದೇ ಔಷಧಗಳನ್ನು ಈಗಾಗಲೇ ಸೇವಿಸುತ್ತಿದ್ದೀರಾ?',
    hi: 'मैं आपकी बात ध्यान से सुन रहा हूँ। क्या यह परेशानी दिन के किसी खास समय बढ़ जाती है, और क्या आप कोई दवा ले रहे हैं?',
    en: 'I am listening closely. Do these symptoms worsen at any particular time of day, and have you taken any medications so far?',
  }

  return {
    response: defaultResponses[lang] || defaultResponses.en,
    triage: updated.triageLevel,
    updatedMemory: updated,
  }
}
