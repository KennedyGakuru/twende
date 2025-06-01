/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', 
    "./app/**/*.{js,jsx,ts,tsx}",
    './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        secondary: {
          50: '#e6fff9',
          100: '#ccfff2',
          200: '#99ffe6',
          300: '#66ffd9',
          400: '#33ffcc',
          500: '#00ffc0',
          600: '#00cc99',
          700: '#009973',
          800: '#00664d',
          900: '#003326',
        },
        accent: {
          50: '#fff0e6',
          100: '#ffe0cc',
          200: '#ffc299',
          300: '#ffa366',
          400: '#ff8533',
          500: '#ff6600',
          600: '#cc5200',
          700: '#993d00',
          800: '#662900',
          900: '#331400',
        },
        success: {
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter-Regular', 'sans-serif'],
        'sans-medium': ['Inter-Medium', 'sans-serif'],
        'sans-bold': ['Inter-Bold', 'sans-serif'],
        heading: ['Poppins-SemiBold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
