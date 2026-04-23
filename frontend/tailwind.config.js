/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        panel: "#111827",
        panelBorder: "#1F2937",
        primary: "#F97316", // Orange
        success: "#10B981", // Green
        info: "#3B82F6",    // Blue
        warning: "#F59E0B", // Yellow/Orange
        danger: "#EF4444",  // Red
        textMain: "#F3F4F6",
        textMuted: "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
