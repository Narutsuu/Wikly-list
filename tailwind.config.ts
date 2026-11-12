import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#10202B", mist: "#F2F5F7", tide: "#1E6FD9", slate2: "#6B7C88" }, fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] } } },
} satisfies Config;
