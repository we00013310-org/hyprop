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
          background: "#0F1A1E",
        },
        btnBorder: "rgba(255, 255, 255, 0.1)",
        textBtn: "#A5BDB7",
        textDark: "#005128",
        sectionBg: "#1D272B",
        subtitle: "#C0C0C0",
        // Card
        cardBg: "#1D272B",
        cardBorder: "#2AD0AA",
        cardTypeText: "#0F1A1E",
        cardBgDark: "rgba(255, 255, 255, 0.06)",
        // Tag:
        active: "#65C1AC",
        tagGreenText: "#00B67A",
        tagDarkBg: "#064639",
        tagNormalBg: "#2AD0AA",
        // Border:
        lightBorder: "#2A3437",
      },
      borderRadius: {
        sm: "6px",
      },
    },
  },
  plugins: [],
};
