/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#A100FF',
          light:   '#BE82FF',
          dark:    '#460073',
        },
        surface: {
          DEFAULT: '#050008',
          panel:   'rgba(255,255,255,0.03)',
        },
        rose: '#FF50A0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #BE82FF, #A100FF)',
      },
      borderColor: {
        line: 'rgba(255,255,255,0.12)',
      },
    },
  },
  plugins: [],
};
