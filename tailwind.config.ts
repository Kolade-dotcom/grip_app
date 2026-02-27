import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#6e56ff",
          hover: "#7f6aff",
          text: "#b4a4ff",
          subtle: "rgba(110,86,255,0.08)",
          mid: "rgba(110,86,255,0.14)",
          glow: "rgba(110,86,255,0.25)",
          border: "rgba(110,86,255,0.3)",
        },
        risk: {
          critical: "#ff4757",
          "critical-bg": "rgba(255,71,87,0.1)",
          "critical-border": "rgba(255,71,87,0.2)",
          high: "#ffa502",
          "high-bg": "rgba(255,165,2,0.1)",
          "high-border": "rgba(255,165,2,0.2)",
          medium: "#3b82f6",
          "medium-bg": "rgba(59,130,246,0.1)",
          low: "#2ed573",
          "low-bg": "rgba(46,213,115,0.1)",
        },
        surface: {
          bg: "var(--surface-bg)",
          raised: "var(--surface-raised)",
          card: "var(--surface-card)",
          "card-hover": "var(--surface-card-hover)",
          input: "var(--surface-input)",
        },
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        success: {
          DEFAULT: "#2ed573",
          bg: "rgba(46,213,115,0.1)",
        },
      },
      fontFamily: {
        heading: ["var(--font-outfit)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        pill: "6px",
      },
      maxWidth: {
        app: "1200px",
      },
      fontSize: {
        label: ["11px", { letterSpacing: "0.05em", lineHeight: "1.4" }],
      },
      letterSpacing: {
        heading: "-0.03em",
      },
      keyframes: {
        fadeSlideIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-slide-in": "fadeSlideIn 0.3s ease-out forwards",
        "fade-in": "fadeIn 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
