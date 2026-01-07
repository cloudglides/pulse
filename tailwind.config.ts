import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f0812",
        "bg-light": "#191825",
        card: "#191825",
        "card-light": "#22152f",
        border: "#2a1f3d",
        text: "#e6e6e6",
        muted: "#9aa0aa",
        "status-ok": "#6ee7a8",
        "status-error": "#f87171",
        "status-warn": "#facc15",
        accent: "#865DFF",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', '"Menlo"', 'monospace'],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
} satisfies Config;
