/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0A0A0B",
        surface: "#131316",
        raised: "#1B1B1E",
        hairline: "#2A2A2E",
        ink: "#F2F0EC",
        muted: "#9B9894",
        faint: "#5C5A57",
        amber: {
          DEFAULT: "#E8A840",
          deep: "#C8731A",
        },
        clay: "#C4694F",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
