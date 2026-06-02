/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4ade80',
          foreground: '#052e16',
        },
        secondary: '#86efac',
        background: '#0a0f0a',
        foreground: '#f0fdf4',
        muted: {
          DEFAULT: '#16261a',
          foreground: '#94a3b8',
        },
        border: '#1e3a24',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%':   { transform: 'translateY(0px) rotate(0deg)',    opacity: '0.18' },
          '50%':  { opacity: '0.12' },
          '100%': { transform: 'translateY(-110vh) rotate(720deg)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 14s linear infinite',
      },
    },
  },
  plugins: [],
};
