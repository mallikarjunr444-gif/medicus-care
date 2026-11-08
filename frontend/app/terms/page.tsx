import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/site/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms that apply when you use MediCare by Medicus Labs.',
  alternates: { canonical: '/terms' },
}

const sections: LegalSection[] = [
  {
    id: 'what-this-is',
    title: 'What MediCare is',
    body: (
      <>
        <p>MediCare lets you talk or type with AI doctors, Dr. Ananya and Dr. Smit, in Kannada, Hindi or English. It gives general health information and preliminary guidance, and can help you understand a report you share.</p>
        <p>The doctors you see and hear are AI characters. They are not real people and they are not licensed physicians.</p>
      </>
    ),
  },
  {
    id: 'not-medical-advice',
    title: 'Not medical advice',
    body: (
      <>
        <p>MediCare does not diagnose, treat or prescribe, and it does not replace an examination by a qualified clinician. Answers can be incomplete or wrong. Use them to prepare for a real consultation, not to decide on your own to start, stop or change treatment.</p>
        <p>Never delay or skip professional care because of something MediCare said.</p>
      </>
    ),
  },
  {
    id: 'emergencies',
    title: 'Emergencies',
    body: (
      <p>MediCare is not an emergency service. If you or someone else may be in danger, for example chest pain, trouble breathing, heavy bleeding, stroke signs or thoughts of self-harm, call <a href="tel:112">112</a> or go to the nearest hospital straight away.</p>
    ),
  },
  {
    id: 'using-the-service',
    title: 'Using the service',
    body: (
      <>
        <p>You agree to:</p>
        <ul>
          <li>give information that is true to the best of your knowledge;</li>
          <li>use MediCare only for yourself, or for someone who has asked you to help them;</li>
          <li>not try to break, overload or reverse-engineer the service, or use it to harm others;</li>
          <li>not upload content you have no right to share, or anything unlawful.</li>
        </ul>
        <p>You must be 18 or older, or use MediCare with a parent or guardian.</p>
      </>
    ),
  },
  {
    id: 'your-content',
    title: 'Your content',
    body: (
      <p>What you say, type and upload stays yours. You allow us to process it so that MediCare can reply, show your history and produce summaries for you. How we handle it is described in the <a href="/privacy">Privacy Policy</a>.</p>
    ),
  },
  {
    id: 'accounts-guests',
    title: 'Guest sessions and accounts',
    body: (
      <p>You can start without signing up. Guest sessions are temporary and are cleared automatically after a short time, so save anything you want to keep. If you create an account, keep your sign-in details to yourself; you are responsible for activity under your account.</p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes',
    body: (
      <p>We work to keep MediCare running, but it may be unavailable, slow or change without notice. Voice, video and language features depend on your device, your connection and third-party services. We may update the service and these terms; the date above shows the latest version, and continuing to use MediCare means you accept it.</p>
    ),
  },
  {
    id: 'liability',
    title: 'Limits of liability',
    body: (
      <p>MediCare is provided as is, without promises that it is accurate, complete or fit for a particular purpose. To the extent the law allows, Medicus Labs is not liable for loss or harm that comes from relying on the service. Nothing here limits rights you have under law that cannot be excluded.</p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    body: <p>These terms are governed by the laws of India. Disputes fall under the courts of Bengaluru, Karnataka, unless the law gives you a right to go elsewhere.</p>,
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      summary="Plain rules for using MediCare. The short version: it is an AI helper, not a doctor, and not for emergencies."
      updated="8 November 2026"
      sections={sections}
    />
  )
}
