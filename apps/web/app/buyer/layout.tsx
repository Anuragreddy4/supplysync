"use client";

import TopBar from "@/components/shared/TopBar";
import BottomDock from "@/components/shared/BottomDock";
import ToastContainer from "@/components/shared/Toast";
import Footer from "@/components/shared/Footer";
import { Home, Store, ShoppingCart, ClipboardList, User } from "lucide-react";

const buyerNavItems = [
  { name: "Home", href: "/buyer/dashboard", icon: Home },
  { name: "Marketplace", href: "/buyer/marketplace", icon: Store },
  { name: "Cart", href: "/buyer/cart", icon: ShoppingCart },
  { name: "Orders", href: "/buyer/orders", icon: ClipboardList },
  { name: "Profile", href: "/buyer/profile", icon: User },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base">
      <TopBar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-28">
        {children}
      </main>
      <Footer />
      <BottomDock items={buyerNavItems} accentColor="buyer" />
      <ToastContainer />
    </div>
  );
}
