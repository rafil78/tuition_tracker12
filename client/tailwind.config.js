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
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c7d6fe',
          300: '#a3bdfd',
          400: '#7599fa',
          500: '#4f6ef7',
          600: '#3850ee',
          700: '#2b3adb',
          800: '#2631b1',
          900: '#232d8c',
        }
      }
    },
  },
  plugins: [],
}
