import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f5fa",
          100: "#dbe8f2",
          200: "#bad3e6",
          300: "#8bb6d4",
          400: "#5793bf",
          500: "#3676a6",
          600: "#275e89",
          700: "#204b6f",
          800: "#1d415f",
          900: "#12304A", // Primary Brand Navy
          950: "#0b1f30",
        },
        teal: {
          50: "#effafb",
          100: "#d6f2f4",
          200: "#b1e6eb",
          300: "#7cd3dd",
          400: "#41b6c5",
          500: "#249aab",
          600: "#167D8D", // Primary Brand Teal
          700: "#186371",
          800: "#1b515c",
          900: "#1a444d",
          950: "#0c2b33",
        },
        surface: {
          bg: "#F6F9FB",
          card: "#FFFFFF",
          border: "#E2E8F0",
          subtle: "#F1F5F9",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
