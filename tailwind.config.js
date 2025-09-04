/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./Dashboard.html",
    "./src/**/*.{html,js}",
    "./**/*.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e40af',
        dark: '#1f2937'
      }
    },
  },
  plugins: [],
}
