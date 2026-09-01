import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        uin: {
          primary: "#9d5f2f", // Brown requested by user
          50: "#fbf8f5",
          100: "#f5eee7",
          200: "#eddcd0",
          300: "#dfc2b0",
          400: "#c89a7c",
          500: "#9d5f2f",
          600: "#8c4e24",
          700: "#753e1f",
          800: "#61331d",
          900: "#502c1b",
          950: "#2c150c",
          accent: "#d97706",
          cream: "#fcfaf7",
          sand: "#f7f1eb",
          card: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
