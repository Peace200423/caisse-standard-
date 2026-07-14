/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12241D',       // encre profonde — chrome, texte principal
        paper: '#F5F3ED',     // fond neutre chaud, pas crème pur
        surface: '#FFFFFF',
        gold: '#D9A441',      // accent principal — actions, montants
        'gold-dark': '#B8842A',
        cash: '#2E7A56',      // vert caisse — entrées, succès
        credit: '#B4482F',    // rouge brique — dettes, sorties
        line: '#E4E0D6',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        ticket: '4px',
      },
    },
  },
  plugins: [],
};
