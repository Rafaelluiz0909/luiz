/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        roulette: {
          red: '#dc2626',
          black: '#18181b',
        },
      },
    },
  },
  plugins: [],
};