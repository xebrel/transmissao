/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hoop: {
          orange: '#FF5722',
          darkOrange: '#E64A19',
          dark: '#0f172a',
          card: 'rgba(15, 23, 42, 0.85)',
        }
      }
    },
  },
  plugins: [],
}
