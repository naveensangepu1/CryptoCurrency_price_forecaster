/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crypto: {
          dark: '#0B0E14',
          card: '#151922',
          cardBorder: '#232A3B',
          accent: '#3B82F6',
          emerald: '#10B981',
          rose: '#EF4444',
          gold: '#F59E0B',
          purple: '#8B5CF6'
        }
      }
    },
  },
  plugins: [],
}
