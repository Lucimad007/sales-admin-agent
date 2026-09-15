import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F1E8",
        ink: {
          DEFAULT: "#1C1915",
          muted: "#6B645B",
        },
        line: "#E4D9C8",
        panel: "#FFFBF5",
        copper: {
          DEFAULT: "#B4572A",
          hover: "#9A4923",
        },
        new: "#3F6F8C",
        progress: "#C4892A",
        done: "#3F6B4D",
        cancelled: "#8A7060",
        danger: {
          DEFAULT: "#9B2E2E",
          hover: "#7F2424",
        },
        success: {
          DEFAULT: "#3F6B4D",
          hover: "#335740",
        },
        warn: {
          DEFAULT: "#C4892A",
          hover: "#A67424",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        paper: "0 1px 0 rgba(28,25,21,0.04)",
      },
      transitionTimingFunction: {
        ledger: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
