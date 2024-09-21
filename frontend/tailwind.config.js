/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts}"],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#3730a3",
          "secondary": "#a78bfa",
          "accent": "#dbeafe",
          "neutral": "#a5b4fc",
          "base-100": "#1f2937",
          "info": "#93c5fd",
          "success": "#4ade80",
          "warning": "#fde047",
          "error": "#ff0000",
        },
      },
    ],
  },
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
}
