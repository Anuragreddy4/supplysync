"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/providers";
import { fetchApi } from "@/lib/api-client";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import SkeletonLoader from "@/components/shared/SkeletonLoader";
import { motion } from "framer-motion";
import Link from "next/link";
import { Package, ClipboardList, AlertTriangle, ArrowRight, Plus } from "lucide-react";

interface Listing {
  id: string;
  material_name: string;
  is_flagged_high: boolean;
}

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  created_at: string;
  listings: {
    material_name: string;
    unit: string;
  };
  users_buyer: {
    display_name: string | null;
    business_name: string | null;
  };
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [listingsData, ordersData] = await Promise.all([
        fetchApi<Listing[]>("/listings/mine"),
        fetchApi<Order[]>("/orders/mine"),
      ]);
      setListings(listingsData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeListingsCount = listings.length;
  const incomingOrdersCount = orders.filter(o => ["pending", "confirmed", "in_transit"].includes(o.status)).length;
  const pricingAlertsCount = listings.filter(l => l.is_flagged_high).length;
  const recentOrders = orders.slice(0, 3);

  const statCards = [
    { label: "Active Listings", value: activeListingsCount, icon: Package, color: "text-supplier", bg: "bg-supplier-soft", href: "/supplier/listings" },
    { label: "Incoming Orders", value: incomingOrdersCount, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50", href: "/supplier/orders-incoming" },
    { label: "Pricing Alerts", value: pricingAlertsCount, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", href: "/supplier/pricing-alerts" },
  ];

  const getBuyerName = (order: Order) =>
    order.users_buyer?.business_name || order.users_buyer?.display_name || "Unknown Buyer";

  if (isLoading) {
    return (
      <div id="supplier-dashboard">
        <div className="mb-6">
          <h1 className="font-jakarta font-bold text-heading text-2xl mb-1">
            Welcome back, {user?.displayName?.split(" ")[0] || "Supplier"} 👋
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SkeletonLoader count={3} type="stat" />
        </div>
        <SkeletonLoader count={3} type="row" />
      </div>
    );
  }

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

        {recentOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No incoming orders yet"
            description="Orders will appear here when buyers purchase your listings."
          />
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <ElevatedCard key={order.id}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-supplier-soft flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-supplier">{getBuyerName(order).charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-heading text-sm truncate">{order.listings.material_name}</p>
                    <p className="text-subtle text-xs">{getBuyerName(order)} · Qty: {order.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="price-tag text-sm text-heading">{formatINR(Number(order.total_price))}</p>
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
