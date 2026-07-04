"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers";
import { Bell } from "lucide-react";

interface TopBarProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export default function TopBar({ showSearch, onSearchClick }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100" id="top-bar">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-buyer to-teal-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-jakarta font-bold text-heading text-lg tracking-tight">
            Supply Sync
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-muted hover:text-heading transition-colors rounded-full hover:bg-gray-100" id="notifications-btn">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border-2 border-gray-100 object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-buyer-soft border border-buyer/20 flex items-center justify-center text-buyer text-sm font-semibold">
              {user?.displayName?.charAt(0) || "U"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
