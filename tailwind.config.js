/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enables dark mode via 'class'
  theme: {
    extend: {
      colors: {
        "dark-bg": "#1a1a1a",
        "dark-card": "#2a2a2a",
        "dark-border": "#3a3a3a",
        "dark-text-secondary": "#b0b0b0",
        "brand-primary": "#4f46e5",
        "brand-secondary": "#6366f1",
        "brand-accent": "#facc15",
      },
    },
  },
  plugins: [],
};
