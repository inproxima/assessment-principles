import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"]
      }
    }
  },
  plugins: [typography]
} satisfies Config;

export default config;

