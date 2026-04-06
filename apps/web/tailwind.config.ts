import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8ff",
          100: "#d9efff",
          200: "#b8e4ff",
          300: "#7bd2ff",
          400: "#36b8f2",
          500: "#0b98d1",
          600: "#087aa9",
          700: "#0a6288",
          800: "#0f526f",
          900: "#11455c"
        },
        accent: {
          50: "#effdfb",
          100: "#cff9f4",
          200: "#a2f0e7",
          300: "#68e2d8",
          400: "#2ec9c1",
          500: "#16a6a5",
          600: "#138788",
          700: "#146d70",
          800: "#16575b",
          900: "#16484a"
        }
      },
      boxShadow: {
        soft: "0 14px 36px rgba(11, 152, 209, 0.16)",
        panel: "0 10px 28px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
