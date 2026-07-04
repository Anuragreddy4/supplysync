"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import { motion } from "framer-motion";
import Link from "next/link";
import { Package, ClipboardList, AlertTriangle, ArrowRight, Plus } from "lucide-react";

// Demo data
const demoStats = {
  activeListings: 8,
  incomingOrders: 3,
  pricingAlerts: 2,
};

const demoRecentOrders = [
  { id: "o-1", buyer_name: "Ravi Constructions", material_name: "Portland Cement (OPC 53)", quantity: 50, total_price: 18500, status: "pending" as const, created_at: "2026-07-04T08:00:00Z" },
  { id: "o-2", buyer_name: "Krishna Builders", material_name: "TMT Steel Bars (12mm)", quantity: 30, total_price: 18600, status: "confirmed" as const, created_at: "2026-07-03T14:00:00Z" },
  { id: "o-3", buyer_name: "Hyderabad Projects", material_name: "River Sand (Fine)", quantity: 500, total_price: 35000, status: "in_transit" as const, created_at: "2026-07-02T10:00:00Z" },
];

export default function SupplierDashboard() {
  const { user } = useAuth();

  const statCards = [
    { label: "Active Listings", value: demoStats.activeListings, icon: Package, color: "text-supplier", bg: "bg-supplier-soft", href: "/supplier/listings" },
    { label: "Incoming Orders", value: demoStats.incomingOrders, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50", href: "/supplier/orders-incoming" },
    { label: "Pricing Alerts", value: demoStats.pricingAlerts, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", href: "/supplier/pricing-alerts" },
  ];

  return (
    <div id="supplier-dashboard">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-jakarta font-bold text-heading text-2xl mb-1">
          Welcome back, {user?.displayName?.split(" ")[0] || "Supplier"} 👋
        </h1>
        <p className="text-muted text-sm">Here&apos;s your business overview.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link href={stat.href}>
              <ElevatedCard className="hover:shadow-card-hover transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-subtle group-hover:text-heading transition-colors" />
                </div>
                <p className="text-muted text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="font-jakarta font-bold text-heading text-3xl tabular-nums">{stat.value}</p>
              </ElevatedCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Action */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
        <Link
          href="/supplier/listings"
          className="btn-primary-supplier inline-flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Listing
        </Link>
      </motion.div>

      {/* Recent Incoming Orders */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-jakarta font-semibold text-heading text-lg">Recent Incoming Orders</h2>
          <Link href="/supplier/orders-incoming" className="text-sm text-supplier font-medium hover:underline">View All</Link>
        </div>

        {demoRecentOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No incoming orders yet"
            description="Orders will appear here when buyers purchase your listings."
          />
        ) : (
          <div className="space-y-3">
            {demoRecentOrders.map(order => (
              <ElevatedCard key={order.id}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-supplier-soft flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-supplier">{order.buyer_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-heading text-sm truncate">{order.material_name}</p>
                    <p className="text-subtle text-xs">{order.buyer_name} · Qty: {order.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="price-tag text-sm text-heading">{formatINR(order.total_price)}</p>
                    <StatusPill status={order.status} />
                  </div>
                </div>
              </ElevatedCard>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
