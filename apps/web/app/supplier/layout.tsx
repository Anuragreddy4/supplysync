"use client";

import TopBar from "@/components/shared/TopBar";
import BottomDock from "@/components/shared/BottomDock";
import ToastContainer from "@/components/shared/Toast";
import Footer from "@/components/shared/Footer";
import { Home, Package, ClipboardList, AlertTriangle, User } from "lucide-react";

const supplierNavItems = [
  { name: "Home", href: "/supplier/dashboard", icon: Home },
  { name: "Listings", href: "/supplier/listings", icon: Package },
  { name: "Orders", href: "/supplier/orders-incoming", icon: ClipboardList },
  { name: "Pricing", href: "/supplier/pricing-alerts", icon: AlertTriangle },
  { name: "Profile", href: "/supplier/profile", icon: User },
];

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base">
      <TopBar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-28">
        {children}
      </main>
      <Footer />
      <BottomDock items={supplierNavItems} accentColor="supplier" />
      <ToastContainer />
    </div>
  );
}
