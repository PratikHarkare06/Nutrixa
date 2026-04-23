/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#0a0f16",
        panel: "#191f2b",
        panelSoft: "#1b2130",
        border: "#223150",
        copy: "#f4f6fb",
        muted: "#98a7c3",
        orange: "#ff7a12",
        mint: "#36d69b",
      },
      boxShadow: {
        upload: "0 24px 40px rgba(0, 0, 0, 0.24)",
      },
      borderRadius: {
        card: "32px",
        pill: "22px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
