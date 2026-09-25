import type { Config } from "tailwindcss";

// "SaaS Moderno" theme — light, neutral app surface with an indigo
// accent and a dark fixed sidebar, matching the chosen design
// direction (see the design exploration canvas). Class names are kept
// as "harvest-*" so every component that already references them
// (ChatApp, Sidebar, MessageList, QuizPanel, CaseStudyPanel,
// MentorDashboard, login pages, pdfExport) picks up the new palette
// automatically — only the VALUES changed, not the token names.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        harvest: {
          bg: "#FAFAFC",
          panel: "#FFFFFF",
          panel2: "#F4F4F8",
          border: "#E2E2E9",
          gold: "#4F46E5",       // primary accent (indigo) — kept the "gold" key so every existing bg-harvest-gold / text-harvest-gold / border-harvest-gold class updates automatically
          goldDeep: "#4338CA",   // deeper accent for hover/active states
          text: "#14141C",
          textDim: "#6B6B7A",
          blue: "#4F46E5",
          green: "#16A34A",
          red: "#DC2626",
          // Sidebar is the one intentionally dark surface in this
          // otherwise light theme (see Sidebar.tsx) — its own tokens,
          // not reused elsewhere, so light-theme text/border tokens
          // above are never accidentally applied against a dark bg.
          sidebar: "#14141C",
          sidebarPanel: "#1E1E29",
          sidebarBorder: "#2A2A38",
          sidebarText: "#FFFFFF",
          sidebarTextDim: "#B4B4C2",
          sidebarActive: "#4F46E522",
          sidebarActiveText: "#A5B4FC",
        },
      },
      fontFamily: {
        serif: ["\"Space Grotesk\"", "system-ui", "sans-serif"],
        sans: ["\"IBM Plex Sans\"", "\"Noto Sans SC\"", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 1px 2px rgba(20,20,28,0.04), 0 8px 24px -8px rgba(79,70,229,0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
