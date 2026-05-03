/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: { DEFAULT: "#0a0f14", dark: "#05080c", light: "#0d1520" },
        cyan: { DEFAULT: "#00f0ff", dim: "rgba(0,240,255,0.15)", glow: "rgba(0,240,255,0.06)" },
        purple: { DEFAULT: "#7b2fff" },
        ink: { DEFAULT: "#c8d8e8", muted: "#6a8fa8" },
        ok: "#58c58a",
        warn: "#f0b65a",
        bad: "#ef7a7a",
      },
      fontFamily: {
        heading: ["Orbitron", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "scan-line": "scan-line 6s linear infinite",
        "float": "float 5s ease-in-out infinite",
        "flicker": "flicker 4s steps(3) infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(0,240,255,0.05)" },
          "50%": { boxShadow: "0 0 25px rgba(0,240,255,0.15)" },
        },
        "scan-line": {
          "0%": { backgroundPosition: "-100% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "33%": { opacity: "0.92" },
          "66%": { opacity: "0.97" },
        },
      },
    },
  },
  plugins: [],
};
