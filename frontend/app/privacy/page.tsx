import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/site/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What MediCare collects, why, who it is shared with, and the choices you have.',
  alternates: { canonical: '/privacy' },
}

const sections: LegalSection[] = [
  {
    id: 'summary',
    title: 'The short version',
    body: (
      <ul>
        <li>We collect only what is needed to hold a consultation with you.</li>
        <li>We do not sell your data and we do not show ads.</li>
        <li>Guest sessions are deleted automatically after a short time.</li>
        <li>Health information is sensitive. Share only what you are comfortable sharing.</li>
      </ul>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    body: (
      <ul>
        <li><strong>What you say and type:</strong> your messages. When you speak, your browser&apos;s speech recognition turns your voice into text and we receive that transcript, not a recording.</li>
        <li><strong>Reports you upload:</strong> lab reports and similar files, and the text read from them.</li>
        <li><strong>Consultation records:</strong> conversation history, notes and summaries so you can return to them.</li>
        <li><strong>Settings:</strong> your chosen language and doctor.</li>
        <li><strong>Account details,</strong> only if you sign up, such as name and email.</li>
        <li><strong>Technical data:</strong> basic logs such as time, errors and device type, used to keep the service working.</li>
      </ul>
    ),
  },
  {
    id: 'camera-microphone',
    title: 'Camera and microphone',
    body: (
      <p>Your microphone is used only during a consultation, for speech recognition built into your browser. Depending on your browser, its maker may process the audio under its own policy. Your camera preview is optional and stays on your device; it is shown to you as a small self-view and is not sent to us. You can turn either off at any time on the call screen or in your browser settings.</p>
    ),
  },
  {
    id: 'how-we-use-it',
    title: 'How we use it',
    body: (
      <ul>
        <li>to understand you and write the doctor&apos;s replies, in your language;</li>
        <li>to find relevant medical references to ground an answer;</li>
        <li>to show your history, notes and consultation summaries;</li>
        <li>to keep the service secure, fix faults and prevent misuse.</li>
      </ul>
    ),
  },
  {
    id: 'service-providers',
    title: 'Who processes it for us',
    body: (
      <>
        <p>To give you a reply, parts of your conversation are sent to services that run the language model, speech and voice features, and to public medical literature search. These providers process the data only to return a result to us. Which provider is used depends on how the service is set up and can change.</p>
        <p>We do not sell personal data and we do not use your consultations to advertise to you. We may disclose information if the law requires it.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <ul>
        <li><strong>Guest sessions</strong> are temporary and are deleted automatically, currently after about 48 hours.</li>
        <li><strong>Accounts:</strong> history and notes are kept until you delete them or close your account.</li>
        <li><strong>Logs</strong> are kept for a limited period for security and debugging.</li>
      </ul>
    ),
  },
  {
    id: 'your-choices',
    title: 'Your choices',
    body: (
      <>
        <p>You can ask to see, correct or delete your data, to withdraw consent, or to close your account. Where the app offers it, you can delete conversations yourself from Settings and History. For anything else, use the contact details below.</p>
        <p>Under India&apos;s Digital Personal Data Protection Act, 2023, you have rights to access, correction, erasure and grievance redress, and we will honour them.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>We use access controls and encrypted connections to protect your data. No system is perfectly secure, so please avoid sharing more than a consultation needs, such as government ID numbers or payment details.</p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>MediCare is for adults. If you are under 18, use it only together with a parent or guardian. We do not knowingly collect data from children without that involvement.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <p>If we change how we handle data, we will update this page and its date. Material changes will be shown in the app.</p>,
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="What MediCare collects, why, who helps us process it, and the choices you have. Written to be read."
      updated="8 November 2026"
      sections={sections}
    />
  )
}
