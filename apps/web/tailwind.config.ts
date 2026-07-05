import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        /* Base surfaces */
        surface: {
          DEFAULT: "var(--color-surface)",
          base: "var(--color-surface-base)",
          elevated: "var(--color-surface-elevated)",
          muted: "var(--color-surface-muted)",
        },
        /* Overrides for standard Tailwind colors to support global dark mode */
        white: "var(--color-white)",
        gray: {
          50: "var(--color-gray-50)",
          100: "var(--color-gray-100)",
          200: "var(--color-gray-200)",
          300: "var(--color-gray-300)",
          400: "var(--color-gray-400)",
        },
        /* Buyer accent: emerald/teal */
        buyer: {
          DEFAULT: "#0D9488",
          light: "#CCFBF1",
          soft: "rgba(13, 148, 136, 0.08)",
          hover: "#0F766E",
          ring: "rgba(13, 148, 136, 0.25)",
        },
        /* Supplier accent: deep indigo */
        supplier: {
          DEFAULT: "#4F46E5",
          light: "#E0E7FF",
          soft: "rgba(79, 70, 229, 0.08)",
          hover: "#4338CA",
          ring: "rgba(79, 70, 229, 0.25)",
        },
        /* Semantic status */
        status: {
          pending: "#F59E0B",
          "pending-bg": "rgba(245, 158, 11, 0.10)",
          confirmed: "#3B82F6",
          "confirmed-bg": "rgba(59, 130, 246, 0.10)",
          in_transit: "#8B5CF6",
          "in_transit-bg": "rgba(139, 92, 246, 0.10)",
          delivered: "#10B981",
          "delivered-bg": "rgba(16, 185, 129, 0.10)",
          cancelled: "#EF4444",
          "cancelled-bg": "rgba(239, 68, 68, 0.10)",
        },
        /* Text hierarchy */
        heading: "var(--color-heading)",
        body: "var(--color-body)",
        muted: "var(--color-muted)",
        subtle: "var(--color-subtle)",
        /* shadcn compatibility */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        "card": "0 4px 20px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.10)",
        "dock": "0 -4px 30px rgba(0, 0, 0, 0.08)",
        "btn": "0 2px 8px rgba(0, 0, 0, 0.08)",
        "btn-hover": "0 4px 16px rgba(0, 0, 0, 0.12)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "badge-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "badge-pop": "badge-pop 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
