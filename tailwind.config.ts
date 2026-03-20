import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
        },
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        accent: {
          flight: "#38bdf8",
          compliance: "#f59e0b",
          software: "#a78bfa",
          hardware: "#94a3b8",
          maintenance: "#34d399",
          experimental: "#fb923c",
        },
        status: {
          passed: "#22c55e",
          failed: "#ef4444",
          "in-progress": "#3b82f6",
          blocked: "#f97316",
          concluded: "#8b5cf6",
          planned: "#6b7280",
          draft: "#374151",
        },
        severity: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#f59e0b",
          low: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
