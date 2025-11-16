/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0f172a',
        slate: '#1e293b',
        accent: '#38bdf8',
        accentMuted: '#0ea5e9',
        card: 'rgba(15,23,42,0.75)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 20px 45px rgba(2, 6, 23, 0.55)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
      animation: {
        fade: 'fade 200ms ease-in-out',
      },
      keyframes: {
        fade: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

