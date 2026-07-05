"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Bell } from "lucide-react";
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
    <header className="sticky top-0 z-40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-white/20 dark:border-slate-700/50 shadow-sm" id="top-bar">
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
        <div className="flex items-center gap-2 relative">
          <LanguageSelector />
          <ThemeToggle />
          <button className="relative p-2 text-muted hover:text-heading transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800" id="notifications-btn">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {/* Profile avatar with dropdown */}
          <button id="profile-btn" className="focus:outline-none" onClick={() => setProfileOpen(prev => !prev)}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border-2 border-gray-100 object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-buyer-soft border border-buyer/20 flex items-center justify-center text-buyer text-sm font-semibold">
                {user?.displayName?.charAt(0) || "U"}
              </div>
            )}
          </button>
          {/* Dropdown menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-100 dark:border-slate-700" id="profile-menu">
              <button
                className="w-full text-left px-4 py-2 text-sm text-heading hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
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
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
