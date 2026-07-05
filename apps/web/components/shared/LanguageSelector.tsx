"use client";

import { useState, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
];

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);

  // Read current language from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const googtrans = cookies.find((row) => row.startsWith("googtrans="));
    if (googtrans) {
      const val = googtrans.split("=")[1];
      const langCode = val.split("/").pop(); // e.g. /en/hi -> hi
      const matched = languages.find((l) => l.code === langCode);
      if (matched) setCurrentLang(matched);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    if (langCode === "en") {
      // Clear the cookie to revert to original English
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
    } else {
      // Set the translation cookie (translating from 'en' to 'langCode')
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; domain=${window.location.hostname}; path=/`;
    }
    
    // Reload to apply the translation script changes
    window.location.reload();
  };

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
