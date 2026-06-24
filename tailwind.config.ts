import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
const { nextui } = require("@nextui-org/react");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",

  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "rgb(var(--brand-pink) / <alpha-value>)",
          pinkDark: "rgb(var(--brand-pink-dark) / <alpha-value>)",
          cyan: "rgb(var(--brand-cyan) / <alpha-value>)",
          orange: "rgb(var(--brand-orange) / <alpha-value>)",
          purple: "rgb(var(--brand-purple) / <alpha-value>)",
          purpleDark: "rgb(var(--brand-purple-dark) / <alpha-value>)",
          'toxic-green': "#39FF14",  // Verde tóxico neón para acentos contrastantes
        },
        surface: {
          base: "rgb(var(--surface-base) / <alpha-value>)",
          card: "rgb(var(--surface-card) / <alpha-value>)",
          shell: "rgb(var(--surface-shell) / <alpha-value>)",
          deep: "rgb(var(--surface-deep) / <alpha-value>)",
          panel: "rgb(var(--surface-panel) / <alpha-value>)",
          border: "rgb(var(--surface-border) / <alpha-value>)",
          light: "rgb(var(--surface-light) / <alpha-value>)",
        },
        ink: {
          inverse: "rgb(var(--ink-inverse) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--ink-subtle) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
        },
        neutral: colors.slate,
        accent: {
          cyan: colors.cyan,
          purple: colors.purple,
          pink: colors.pink,
          yellow: colors.yellow,
          orange: colors.orange,
          teal: colors.teal,
          blue: colors.blue,
          rose: colors.rose,
        },
        success: colors.green,
        danger: colors.red,
        warning: colors.amber,
        info: colors.blue,
      },
      backgroundImage: {
        "gradient-cover":
          "linear-gradient(90.21deg, rgba(170, 54, 124, 0.5) -5.91%, rgba(74, 47, 189, 0.5) 111.58%)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background: "hsl(0, 0%, 4%)",         // --surface-base
            foreground: "hsl(0, 0%, 100%)",       // --ink-inverse
            content1:   "hsl(225, 50%, 8%)",      // --surface-card
            content2:   "hsl(224, 37%, 16%)",     // --surface-shell
            primary: {
              DEFAULT:    "hsl(341, 87%, 64%)",   // --brand-pink
              foreground: "hsl(0, 0%, 100%)",     // --ink-inverse
            },
            secondary: {
              DEFAULT:    "hsl(189, 100%, 50%)",  // --brand-cyan
              foreground: "hsl(0, 0%, 4%)",       // --surface-base
            },
            success: "hsl(142, 71%, 45%)",        // --color-success
            warning: "hsl(14, 100%, 62%)",        // --brand-orange
            danger:  "hsl(0, 84%, 60%)",
          },
        },
        light: {
          colors: {
            background: "hsl(210, 38%, 95%)",     // --surface-light
            foreground: "hsl(0, 0%, 4%)",         // --surface-base
            content1:   "hsl(0, 0%, 100%)",       // --ink-inverse
            content2:   "hsl(210, 38%, 95%)",     // --surface-light
            primary: {
              DEFAULT:    "hsl(341, 87%, 64%)",   // --brand-pink
              foreground: "hsl(0, 0%, 100%)",     // --ink-inverse
            },
            secondary: {
              DEFAULT:    "hsl(189, 100%, 50%)",  // --brand-cyan
              foreground: "hsl(0, 0%, 4%)",       // --surface-base
            },
            success: "hsl(142, 71%, 45%)",        // --color-success
            warning: "hsl(14, 100%, 62%)",        // --brand-orange
            danger:  "hsl(0, 84%, 60%)",
          },
        },
      },
    }),
  ],
};
export default config;
