/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "eb-navy": {
          950: "var(--eb-navy-950)",
          900: "var(--eb-navy-900)",
          800: "var(--eb-navy-800)",
        },
        "eb-blue": {
          600: "var(--eb-blue-600)",
        },
        "eb-gold": {
          300: "var(--eb-gold-300)",
          500: "var(--eb-gold-500)",
          700: "var(--eb-gold-700)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
};

export default config;
