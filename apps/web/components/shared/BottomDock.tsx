"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { LucideIcon } from "lucide-react";

interface DockItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomDockProps {
  items: DockItem[];
  accentColor?: "buyer" | "supplier";
}

export default function BottomDock({ items, accentColor = "buyer" }: BottomDockProps) {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const activeClasses = accentColor === "buyer"
    ? "text-buyer bg-buyer-soft"
    : "text-supplier bg-supplier-soft";

  const inactiveClasses = "text-muted hover:text-heading";

  return (
    <nav className="bottom-dock" id="bottom-dock-nav">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          // Show cart badge count for cart item
          const badgeCount = item.name === "Cart" ? itemCount : item.badge;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all duration-200 ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badgeCount !== undefined && badgeCount > 0 && (
                  <motion.span
                    key={badgeCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </motion.span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
