import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sampled from the real Cocoa Dolce packaging photography
        ink: "#232A4D", // box navy
        gold: "#B8912D", // foil lettering — rules and large accents only
        goldink: "#8A6A16", // gold dark enough for small text (5.1:1)
        // Second and third place (2026-09-20). Same rule as gold: the
        // bright metal is for rings and rules, the -ink tone for text.
        silver: "#8C8C96",
        silverink: "#63636D", // 5.9:1
        bronze: "#B07440",
        bronzeink: "#8A5A2B", // 5.9:1
        amber: "#FAC905", // WSU AI Club primary — CTA only
        paper: "#FFFFFF",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        ui: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
