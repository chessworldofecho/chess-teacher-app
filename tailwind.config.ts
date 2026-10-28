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
        chess: {
          light: "#f0d9b5",
          dark: "#b58863",
          highlight: "#aacc00",
        },
      },
    },
  },
  plugins: [],
};
export default config;
