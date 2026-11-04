/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            50: '#f0f8fa',
            100: '#daf0f5',
            200: '#bae1ec',
            300: '#8ccbe0',
            400: '#4da7c5',
            500: '#1b86a8',
            600: '#136b89',
            700: '#105670',
            800: '#0c4a60', // Primary Logo Teal
            900: '#083747',
            950: '#04222d',
          },
          olive: {
            50: '#f7faee',
            100: '#ecf3d9',
            200: '#dce8b6',
            300: '#c5d889',
            400: '#abc55f',
            500: '#8ea53d', // Primary Logo Olive
            600: '#758c2e',
            700: '#5a6d25',
            800: '#485721',
            900: '#3c491e',
            950: '#1f270d',
          },
        },
        primary: {
          50: '#f0f8fa',
          100: '#daf0f5',
          200: '#bae1ec',
          300: '#8ccbe0',
          400: '#4da7c5',
          500: '#1b86a8',
          600: '#136b89',
          700: '#105670',
          800: '#0c4a60',
          900: '#083747',
          950: '#04222d',
        },
        accent: {
          50: '#f7faee',
          100: '#ecf3d9',
          200: '#dce8b6',
          300: '#c5d889',
          400: '#abc55f',
          500: '#8ea53d',
          600: '#758c2e',
          700: '#5a6d25',
          800: '#485721',
          900: '#3c491e',
          950: '#1f270d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        hebrew: ['Heebo', 'Rubik', 'Assistant', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
};
