/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E6F5C',
        secondary: '#289672',
        accent: '#29BB89',
        light: '#E6DD3B',
        dark: '#1A5653',
      },
    },
  },
  plugins: [],
}
