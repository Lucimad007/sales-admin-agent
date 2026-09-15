import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#DCC9B0",
        ink: {
          DEFAULT: "#16120F",
          muted: "#4A4139",
        },
        line: "#C3AD91",
        panel: "#FFF9F0",
        copper: {
          DEFAULT: "#C44E1F",
          hover: "#A33E18",
        },
        new: "#1E5C7A",
        progress: "#B56A0C",
        done: "#1F5236",
        cancelled: "#6A5648",
        danger: {
          DEFAULT: "#B12C28",
          hover: "#8E221F",
        },
        success: {
          DEFAULT: "#1F5236",
          hover: "#18422B",
        },
        warn: {
          DEFAULT: "#B56A0C",
          hover: "#934F08",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        paper:
          "inset 0 1px 0 rgba(255,249,240,0.92), 0 1px 2px rgba(40,24,12,0.08)",
        lift:
          "inset 0 1px 0 rgba(255,249,240,0.95), 0 1px 2px rgba(40,24,12,0.07), 0 16px 36px -14px rgba(40,24,12,0.28)",
        float:
          "inset 0 1px 0 rgba(255,249,240,1), 0 24px 54px -18px rgba(40,24,12,0.38), 0 10px 20px rgba(40,24,12,0.12)",
        glow: "0 14px 34px -12px rgba(196,78,31,0.58)",
        inset: "inset 0 1px 2px rgba(40,24,12,0.1)",
      },
      transitionTimingFunction: {
        ledger: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
