import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sampled from the real Cocoa Dolce packaging photography
        ink: "#232A4D", // box navy
        gold: "#B8912D", // foil lettering
        amber: "#FAC905", // WSU AI Club primary — CTA only
        paper: "#FFFFFF",
      },
      fontFamily: {
        display: ['"Bodoni Moda"', "Didot", "Georgia", "serif"],
        ui: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
