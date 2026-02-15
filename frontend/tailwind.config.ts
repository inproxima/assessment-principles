import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["var(--font-fraunces)", "Georgia", "Cambria", "serif"],
      },
      colors: {
        cream: {
          DEFAULT: "#F8F5EF",
          dark: "#EDE8DF",
        },
        burgundy: {
          50: "#FFF1F2",
          100: "#FFE4E6",
          200: "#FECDD3",
          300: "#FDA4AF",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#BE123C",
          800: "#9F1239",
          900: "#881337",
        },
      },
      boxShadow: {
        "warm-sm": "var(--shadow-warm-sm)",
        warm: "var(--shadow-warm)",
        "warm-lg": "var(--shadow-warm-lg)",
        "warm-xl": "var(--shadow-warm-xl)",
      },
      animation: {
        "fade-up": "fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "spin-slow": "spin-slow 3s linear infinite",
      },
    },
  },
  plugins: [typography],
} satisfies Config;

export default config;
