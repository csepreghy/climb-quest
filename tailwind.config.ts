import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        display: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        pixel: ['"Press Start 2P"', "system-ui", "monospace"],
        hud: ['"VT323"', "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        chalk: { DEFAULT: "hsl(var(--chalk))", glow: "hsl(var(--chalk-glow))" },
        xp: "hsl(var(--xp))",
        boss: "hsl(var(--boss))",
        legendary: "hsl(var(--legendary))",
        epic: "hsl(var(--epic))",
        uncommon: "hsl(var(--uncommon))",
        rare: "hsl(var(--rare))",
        common: "hsl(var(--common))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "chalk-bounce": {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "50%": { transform: "translateY(-12%) rotate(3deg)" },
        },
        "rarity-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 var(--glow-color, hsl(var(--primary))), 0 0 22px 2px var(--glow-color, hsl(var(--primary)))" },
          "50%":      { boxShadow: "0 0 0 4px var(--glow-color, hsl(var(--primary))), 0 0 48px 10px var(--glow-color, hsl(var(--primary)))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "chalk-bounce": "chalk-bounce 1.1s ease-in-out infinite",
        "rarity-glow": "rarity-glow 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
