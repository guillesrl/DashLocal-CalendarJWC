/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/Dashboard.html",
    "./src/**/*.{html,js}",
    "./**/*.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#1a56db",
        secondary: "#1e429f",
        accent: "#e53e3e",
        dark: "#111827",
        light: "#f9fafb"
      }
    },
  },
  plugins: [],
}
