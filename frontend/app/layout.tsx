import '@fontsource-variable/inter'
import '@fontsource-variable/urbanist'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Font variables with standard fallbacks ensuring offline compilation and robust loading
const FONT_VARS = 'font-sans'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://care.medicuslabs.app'
const SITE_TITLE = 'Medicus Care — Voice and Text Health Consultations | Medicus Labs™'
const SITE_DESCRIPTION =
  'Share health concerns by voice or text, review medical reports, and access preliminary triage ' +
  'guidance with Dr. Smit or Dr. Ananya in your selected language.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f8f6',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · Medicus Care',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'Medicus Care',
  keywords: [
    'Medicus Care', 'Doctor consultation', 'Dr. Smit', 'Dr. Ananya',
    'telemedicine', 'medical triage', 'symptom checker', 'digital healthcare',
    'multilingual healthcare', 'Kannada doctor', 'Hindi doctor', 'Medicus Labs',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Medicus Care',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

// Structured data (schema.org SoftwareApplication) — lets search engines show
// a rich result card instead of a bare blue link.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Medicus Care',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web browser on iOS, iPadOS, Android, Windows, macOS, and Linux',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  softwareHelp: 'https://github.com/PunithVT/ai-avatar-system',
  sameAs: ['https://github.com/PunithVT/ai-avatar-system'],
  featureList: [
    'Voice and text symptom sharing',
    'Multilingual consultation options',
    'Medical report review',
    'Preliminary triage guidance',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className={`${FONT_VARS} font-sans antialiased`}>
        {/* Skip link — appears only on keyboard focus, lets users bypass the nav */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]
 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-600 focus:text-gray-900
 focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <ErrorBoundary>
            <div id="main-content">{children}</div>
          </ErrorBoundary>
          <Toaster
            position="bottom-center"
            containerStyle={{ bottom: 88 }}
            toastOptions={{
              className: ' ',
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
