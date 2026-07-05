"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-14 h-7" />; // placeholder to prevent layout shift

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-7 rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-buyer/40"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      }}
      aria-label="Toggle theme"
    >
      {/* Track decoration — stars (dark) or clouds (light) */}
      <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {isDark ? (
          <>
            <span className="absolute top-1.5 left-2 w-1 h-1 bg-slate-400 rounded-full animate-pulse" />
            <span className="absolute top-3.5 left-4 w-0.5 h-0.5 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
            <span className="absolute top-1 left-6 w-0.5 h-0.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
          </>
        ) : (
          <>
            <span className="absolute top-2 right-3 w-2 h-1 bg-white/60 rounded-full" />
            <span className="absolute top-3.5 right-5 w-1.5 h-0.5 bg-white/40 rounded-full" />
          </>
        )}
      </span>

      {/* Thumb (sun / moon) */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative w-6 h-6 rounded-full shadow-md flex items-center justify-center"
        style={{
          marginLeft: isDark ? "auto" : "0",
          background: isDark
            ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
            : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        }}
      >
        {isDark ? (
          // Moon icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // Sun icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </motion.div>
    </button>
  );
}
