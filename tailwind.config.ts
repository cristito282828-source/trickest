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
            background: "rgb(var(--surface-base) / 1)",
            foreground: "rgb(var(--ink-inverse) / 1)",
            content1: "rgb(var(--surface-card) / 1)",
            content2: "rgb(var(--surface-shell) / 1)",
            primary: {
              DEFAULT: "rgb(var(--brand-pink) / 1)",
              foreground: "rgb(var(--ink-inverse) / 1)",
            },
            secondary: {
              DEFAULT: "rgb(var(--brand-cyan) / 1)",
              foreground: "rgb(var(--surface-base) / 1)",
            },
            success: "rgb(var(--color-success) / 1)",
            warning: "rgb(var(--brand-orange) / 1)",
            danger: "rgb(239 68 68 / 1)",
          },
        },
        light: {
          colors: {
            background: "rgb(var(--surface-light) / 1)",
            foreground: "rgb(var(--surface-base) / 1)",
            content1: "rgb(var(--ink-inverse) / 1)",
            content2: "rgb(var(--surface-light) / 1)",
            primary: {
              DEFAULT: "rgb(var(--brand-pink) / 1)",
              foreground: "rgb(var(--ink-inverse) / 1)",
            },
            secondary: {
              DEFAULT: "rgb(var(--brand-cyan) / 1)",
              foreground: "rgb(var(--surface-base) / 1)",
            },
            success: "rgb(var(--color-success) / 1)",
            warning: "rgb(var(--brand-orange) / 1)",
            danger: "rgb(239 68 68 / 1)",
          },
        },
      },
    }),
  ],
};
export default config;
