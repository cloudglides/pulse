import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        "bg-light": "#0e1116",
        card: "#12151c",
        "card-light": "#161a22",
        border: "#1f2430",
        text: "#e6e6e6",
        muted: "#9aa0aa",
        "status-ok": "#6ee7a8",
        "status-error": "#f87171",
        "status-warn": "#facc15",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "menlo", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
} satisfies Config;
