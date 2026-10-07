/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ps: {
          green: "#1a5242",
          "green-light": "#355847",
          dark: "#0f2a1e",
          mid: "#3f9973",
          pastel: "#FFF3B0",
          gold: "#D4AF37",
          cream: "#f9f5eb",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
