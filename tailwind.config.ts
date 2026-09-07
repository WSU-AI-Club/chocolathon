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
