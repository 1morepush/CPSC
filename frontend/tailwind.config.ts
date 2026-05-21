import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#050508",
        cyber: {
          cyan: "#00f0ff",
          pink: "#ff006e",
          purple: "#7b2fff",
          green: "#00d4aa",
          amber: "#ffb700",
          red: "#ff3366",
        },
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "monospace"],
        mono: ["var(--font-jetbrains)", "monospace"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan": "scan 8s linear infinite",
        "flicker": "flicker 0.15s infinite",
        "stream-in": "stream-in 0.4s ease-out",
        "typewriter": "typewriter 0.05s steps(1) forwards",
        "orbit": "orbit 20s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.8", filter: "brightness(1.3)" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "stream-in": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "orbit": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 240, 255, 0.4), 0 0 60px rgba(0, 240, 255, 0.1)",
        "glow-pink": "0 0 20px rgba(255, 0, 110, 0.4), 0 0 60px rgba(255, 0, 110, 0.1)",
        "glow-purple": "0 0 20px rgba(123, 47, 255, 0.4), 0 0 60px rgba(123, 47, 255, 0.1)",
        "glow-green": "0 0 20px rgba(0, 212, 170, 0.4), 0 0 60px rgba(0, 212, 170, 0.1)",
        "glow-amber": "0 0 20px rgba(255, 183, 0, 0.4), 0 0 60px rgba(255, 183, 0, 0.1)",
        "glow-red": "0 0 20px rgba(255, 51, 102, 0.4), 0 0 60px rgba(255, 51, 102, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
