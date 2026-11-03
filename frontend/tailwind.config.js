/** @type {import('tailwindcss').Config} */
//
// MediCare's palette uses warm neutral surfaces, deep botanical text, and a
// restrained evergreen accent. Keep interaction states high-contrast.
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './store/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep green-tinged ink is used for high-contrast text and hero panels.
        ink: '#153b35',
        gray: {
          25: '#f5f8f6', // page canvas
          50: '#f8fbf9',
          100: '#eef4f0',
          200: '#e1e9e4',
          300: '#d0d5dd',
          400: '#98a2b3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1d2939',
          900: '#101828',
        },
        primary: {
          50: '#eff7f2',
          100: '#dceee3',
          200: '#c5e2d1',
          300: '#9dceb7',
          400: '#6fb296',
          500: '#378c73',
          600: '#0f7565', // the brand accent
          700: '#0e6257',
          800: '#124d46',
          900: '#163b37',
        },
        success: { 50: '#ecfdf3', 500: '#12b76a', 600: '#039855', 700: '#027a48' },
        warning: { 50: '#fffaeb', 500: '#f79009', 600: '#dc6803', 700: '#b54708' },
        error: { 50: '#fef3f2', 400: '#f97066', 500: '#f04438', 600: '#d92d20', 700: '#b42318' },
      },

      fontFamily: {
        // var(--font-*) are injected by next/font in app/layout.tsx; the
        // literal names are the fallback if a face fails to load.
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-urbanist)', 'Urbanist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        // A gentle editorial accent for occasional headings.
        accent: ['var(--font-playfair)', '"Playfair Display"', 'Georgia', 'serif'],
      },

      fontSize: {
        // Body is 15px, not Tailwind's 16px default — the system is set
        // slightly tighter than stock and it shows across dense UI.
        base: ['15px', { lineHeight: '1.55' }],
        eyebrow: ['11px', { lineHeight: '1.5', letterSpacing: '0.15em', fontWeight: '500' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
      },

      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px', // buttons and inputs
        lg: '12px',
        xl: '16px', // standard card
        '2xl': '20px', // hero / featured panel
      },

      boxShadow: {
        // Subtle by default. Nothing heavier than sm in ordinary UI; lg is for
        // modals and floating menus only.
        xs: '0 1px 2px 0 rgba(16,24,40,.05)',
        sm: '0 1px 3px 0 rgba(16,24,40,.1), 0 1px 2px -1px rgba(16,24,40,.1)',
        md: '0 4px 8px -2px rgba(16,24,40,.1), 0 2px 4px -2px rgba(16,24,40,.06)',
        lg: '0 12px 16px -4px rgba(16,24,40,.08), 0 4px 6px -2px rgba(16,24,40,.03)',
        xl: '0 20px 24px -4px rgba(16,24,40,.08), 0 8px 8px -4px rgba(16,24,40,.03)',
        ring: '0 0 0 4px rgba(68,76,231,.12)',
      },

      letterSpacing: {
        heading: '-0.015em',
        eyebrow: '0.15em',
      },

      animation: {
        'fade-up': 'fadeUp .4s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fadeIn .3s ease both',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(.4,0,.6,1) infinite',
      },
      keyframes: {
        // Short and eased rather than bouncy. The system is restrained; motion
        // should confirm an action, not perform.
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.5' } },
      },
    },
  },
  plugins: [],
}
