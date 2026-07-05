"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Bell, LogOut } from "lucide-react";
import { signOut } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/api-client";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";


interface TopBarProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export default function TopBar({ showSearch, onSearchClick }: TopBarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  // Determine dashboard link based on current route context
  const dashboardHref = pathname.startsWith("/supplier")
    ? "/supplier/dashboard"
    : "/buyer/dashboard";

  return (
    <header className="sticky top-0 z-40 backdrop-blur-3xl backdrop-saturate-[2.5] bg-gradient-to-b from-white/60 to-white/30 dark:from-slate-900/60 dark:to-slate-900/30 border-b border-white/40 dark:border-slate-700/50 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out" id="top-bar">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link href={dashboardHref} className="flex items-center gap-2.5">
          <img src="/logo.png" alt="SupplySync Logo" className="w-8 h-8 object-contain dark:hidden" />
          <img src="/logo-dark.png" alt="SupplySync Logo" className="w-8 h-8 object-contain hidden dark:block" />
          <span className="font-jakarta font-bold text-heading text-lg tracking-tight">
            Supply Sync
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <button className="relative p-2 text-muted hover:text-heading transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800" id="notifications-btn">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          
          {/* Profile Group */}
          <div className="relative">
            {/* Profile avatar button */}
            <button id="profile-btn" className="focus:outline-none transition-transform hover:scale-105 active:scale-95" onClick={() => setProfileOpen(prev => !prev)}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-buyer-soft border border-buyer/20 flex items-center justify-center text-buyer text-sm font-semibold shadow-sm">
                  {user?.displayName?.charAt(0) || "U"}
                </div>
              )}
            </button>
            
            {/* Dropdown menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/50 dark:border-slate-700/50 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200" id="profile-menu">
                <button
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-3"
                  onClick={async () => {
                    try {
                      await signOut();
                      // Optional backend logout call
                      await apiFetch('/auth/logout', { method: 'POST' });
                      // Redirect to login page
                      router.push('/login');
                    } catch (e) {
                      console.error('Logout failed', e);
                    }
                  }}
                  id="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
