import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0D1F35",
          medium: "#1A3355",
          dark: "#070f1a",
          light: "#1E3F66",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E2C97E",
          dark: "#A8892A",
          muted: "rgba(201,168,76,0.15)",
        },
      },
      fontFamily: {
        sans:    ['"Noto Sans KR"', "system-ui", "sans-serif"],
        serif:   ['"Noto Serif KR"', "Georgia", "serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 4px 24px rgba(201,168,76,0.25)",
        navy: "0 4px 24px rgba(0,0,0,0.3)",
        card: "0 4px 24px rgba(0,0,0,0.3)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(160deg, #0D1F35 0%, #0a1628 100%)",
        "card-gradient": "linear-gradient(135deg, #1A3355 0%, #0D1F35 100%)",
        "gold-gradient": "linear-gradient(135deg, #E2C97E 0%, #C9A84C 50%, #A8892A 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
