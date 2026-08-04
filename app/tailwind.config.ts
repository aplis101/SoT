import type { Config } from "tailwindcss";

// Design tokens — المصدر: hadith-sot/12-design-system.md §3
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#047857", hover: "#065f46", active: "#064e3b", soft: "#d1fae5" },
        grade: { sahih: "#15803d", hasan: "#a16207", daif: "#b91c1c" },
        verified: "#047857",
        favorite: "#d97706",
        like: "#e11d48",
        app: "#fafaf9",
      },
      fontFamily: {
        hadith: ["var(--font-amiri)", "serif"],
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
      fontSize: {
        matn: ["1.5rem", { lineHeight: "2" }],
        isnad: ["1.125rem", { lineHeight: "1.9" }],
      },
    },
  },
  plugins: [],
};
export default config;
