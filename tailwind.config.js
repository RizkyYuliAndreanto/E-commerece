/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Ini penting untuk file Vue Anda
  ],
  theme: {
    extend: {
      // *** Bagian ini sangat penting untuk warna Foodiez Anda ***
      colors: {
        "foodiez-red": "#e63946",
        "foodiez-dark-red": "#d62828",
        "foodiez-yellow": "#ffd166",
        "foodiez-accent-yellow": "#ffb703",
        "foodiez-text-dark": "#2b2d42",
        "foodiez-text-light": "#fdfffc",
        "foodiez-light-gray": "#f8f8f8",
      },
    },
  },
  plugins: [],
};
