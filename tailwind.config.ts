import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18212F",
        purple: "#6857E5",
        cream: "#F7F7F3"
      },
      boxShadow: {
        card: "0 14px 35px rgba(24, 33, 47, 0.07)",
        soft: "0 5px 18px rgba(24, 33, 47, 0.06)"
      }
    }
  },
  plugins: []
};
export default config;
