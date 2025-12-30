/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          500: '#0046FF',
          600: '#0046FF',
          700: '#003acc',
        },
        accent: {
          500: '#0046FF',
          600: '#0046FF',
        }
      },
    },
  },
  plugins: [],
};
