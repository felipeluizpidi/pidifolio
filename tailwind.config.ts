import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "480px", md: "768px", lg: "1024px", xl: "1440px", "2xl": "1800px" },
    extend: {
      colors: {
        ink: "#0B0B0B",
        red: "#EF2917",
        orange: "#FF6030",
        blue: "#138FE0",
        mint: "#A8F5E5",
        ivory: "#F4E9D6",
        smoke: "#1A1918",
        ash: "#8A847B",
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        heavy: ['"Archivo Black"', "Arial Black", "sans-serif"],
        sans: ['"Space Grotesk Variable"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: { crush: "-0.02em", meta: "0.14em" },
    },
  },
  plugins: [],
} satisfies Config;
