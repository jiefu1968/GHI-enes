import type { Config } from "tailwindcss";

// Palette ported from harvest_ui_theme.py: warm gold/amber accent on a
// deep slate-blue "night sky" background — evokes both "harvest" (gold)
// and the original app's dark theme.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        harvest: {
          bg: "#0D1117",
          panel: "#161B22",
          panel2: "#1C2230",
          border: "rgba(200,134,10,0.2)",
          gold: "#E8A020",
          goldDeep: "#C8860A",
          text: "#E6EDF3",
          textDim: "#8898A8",
          blue: "#2D5A8E",
          green: "#1D9E75",
          red: "#9E3020",
        },
      },
      fontFamily: {
        serif: ["Cinzel", "serif"],
        sans: ["Lato", "Noto Sans SC", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(200,134,10,0.35), 0 8px 24px -8px rgba(200,134,10,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
