"use client";

import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-muted border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand + Subscribe */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="SupplySync Logo" className="w-8 h-8 object-contain" />
              <span className="font-jakarta font-bold text-heading text-lg tracking-tight">
                Supply Sync
              </span>
            </Link>
            <p className="text-muted text-sm mb-4">Subscribe to our email alerts!</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-heading text-sm placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring outline-none transition-all"
              />
              <button className="w-10 h-10 rounded-xl bg-buyer text-white flex items-center justify-center hover:bg-buyer-hover transition-colors shrink-0">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Marketplace Links */}
          <div>
            <h4 className="font-jakarta font-semibold text-heading text-sm mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              <li><Link href="/buyer/marketplace" className="text-muted text-sm hover:text-buyer transition-colors">Browse Materials</Link></li>
              <li><Link href="/buyer/orders" className="text-muted text-sm hover:text-buyer transition-colors">Track Orders</Link></li>
              <li><Link href="/buyer/cart" className="text-muted text-sm hover:text-buyer transition-colors">Shopping Cart</Link></li>
              <li><Link href="/supplier/listings" className="text-muted text-sm hover:text-buyer transition-colors">Supplier Listings</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-jakarta font-semibold text-heading text-sm mb-4">Help</h4>
            <ul className="space-y-2.5">
              <li><Link href="/buyer/orders" className="text-muted text-sm hover:text-buyer transition-colors">Track Your Order</Link></li>
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">Warranty & Support</Link></li>
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">Return Policy</Link></li>
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">Bulk Orders</Link></li>
              <li><Link href="/supplier/pricing-alerts" className="text-muted text-sm hover:text-buyer transition-colors">Fair Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-jakarta font-semibold text-heading text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">About Supply Sync</Link></li>
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-muted text-sm hover:text-buyer transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-subtle text-xs">© {new Date().getFullYear()} Supply Sync. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-subtle text-xs hover:text-buyer transition-colors">Privacy</Link>
            <Link href="#" className="text-subtle text-xs hover:text-buyer transition-colors">Terms</Link>
            <Link href="#" className="text-subtle text-xs hover:text-buyer transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
