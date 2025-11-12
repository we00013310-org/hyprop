/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#0E5B4B",
          hover: "#0A4A3D",
          light: "#10705D",
        },
        btnBorder: "rgba(255, 255, 255, 0.1)",
        textBtn: "#A5BDB7",
      },
      borderRadius: {
        sm: "6px",
      },
    },
  },
  plugins: [],
};
