"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
];

/**
 * Drives the hidden Google Translate <select> element directly.
 * This is far more reliable than manipulating cookies because Google
 * Translate itself handles all cookie scoping internally.
 */
function triggerGoogleTranslate(langCode: string) {
  const select = document.querySelector<HTMLSelectElement>(
    ".goog-te-combo, #google_translate_element select"
  );

  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return false;
}

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);

  // Detect current language from the cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
    if (match) {
      const found = languages.find((l) => l.code === match[1]);
      if (found) setCurrentLang(found);
    }
  }, []);

  const changeLanguage = useCallback((langCode: string) => {
    if (langCode === "en") {
      // Clear all googtrans cookies across every domain scope
      const hostname = window.location.hostname;
      const expiry = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
      document.cookie = `googtrans=; ${expiry}; path=/;`;
      document.cookie = `googtrans=; ${expiry}; domain=${hostname}; path=/;`;
      document.cookie = `googtrans=; ${expiry}; domain=.${hostname}; path=/;`;
      // Also try parent domain (e.g. .vercel.app)
      const parts = hostname.split(".");
      if (parts.length > 2) {
        const parent = "." + parts.slice(-2).join(".");
        document.cookie = `googtrans=; ${expiry}; domain=${parent}; path=/;`;
      }
      window.location.reload();
      return;
    }

    // Try to drive the hidden select first (instant, no reload needed)
    const driven = triggerGoogleTranslate(langCode);
    if (!driven) {
      // Fallback: set cookie and reload
      const hostname = window.location.hostname;
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; domain=${hostname}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; domain=.${hostname}; path=/`;
      window.location.reload();
    }
  }, []);

  return (
    <div className="relative z-50 notranslate">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1.5 md:px-3 md:py-2 rounded-full md:rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-heading focus:outline-none"
      >
        <Globe className="w-4 h-4 text-muted" />
        <span className="hidden md:inline-block">{currentLang.name}</span>
        <ChevronDown className="w-3 h-3 text-muted hidden md:block" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-card border border-gray-100 dark:border-slate-800 py-1.5 z-50 overflow-hidden"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLang(lang);
                    setIsOpen(false);
                    changeLanguage(lang.code);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                    currentLang.code === lang.code ? "bg-gray-50 dark:bg-slate-800 font-semibold text-buyer" : "text-heading"
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  {lang.name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
