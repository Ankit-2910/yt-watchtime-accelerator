import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0c10",
          soft: "#0f131a",
          card: "#141922",
          hover: "#1b212c",
        },
        line: "#232b38",
        brand: {
          DEFAULT: "#ff2d55",
          soft: "#ff5c7a",
        },
        accent: {
          DEFAULT: "#38bdf8",
          green: "#22c55e",
          amber: "#f59e0b",
          violet: "#a78bfa",
        },
        ink: {
          DEFAULT: "#e6edf6",
          soft: "#9aa7b8",
          dim: "#5f6b7c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,45,85,0.15), 0 8px 40px -12px rgba(255,45,85,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -20px rgba(0,0,0,0.8)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
