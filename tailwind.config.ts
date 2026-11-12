import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "var(--fg)", mist: "var(--bg)", card: "var(--card)", line: "var(--line)", slate2: "var(--mut)", tide: "rgb(var(--accent-rgb) / <alpha-value>)" }, fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] } } },
} satisfies Config;
