import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#16231C",
        panel: "#1E2E24",
        paper: "#F4EFE3",
        ink: "#ECE7D9",
        inksoft: "#A9B7AC",
        ochre: "#D69A45",
        teal: "#4FA184",
        rust: "#C0563A",
        navy: "#1B3A57",
      },
      backdropBlur: {
        glass: "18px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      fontFamily: {
        serif: ["Georgia", "Iowan Old Style", "Times New Roman", "serif"],
        mono: ["SFMono-Regular", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
