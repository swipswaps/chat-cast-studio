/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1e40af',
        'brand-secondary': '#3b82f6',
        'brand-accent': '#60a5fa',
        'dark-bg': '#111827',
        'dark-card': '#1f2937',
        'dark-border': '#374151',
        'dark-text': '#d1d5db',
        'dark-text-secondary': '#9ca3af',
      },
    },
  },
  plugins: [],
}
