"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers";
import { fetchApi } from "@/lib/api-client";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import SkeletonLoader from "@/components/shared/SkeletonLoader";
import { motion } from "framer-motion";
import Link from "next/link";
import { Package, ArrowRight, ShoppingBag, Clock } from "lucide-react";

interface Order {
  id: string;
  listing_id: string;
  material_name: string;
  supplier_name: string;
  quantity: number;
  total_price: number;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  created_at: string;
}

// Demo data for UI preview
const demoOrders: Order[] = [
  {
    id: "ord-001",
    listing_id: "l-1",
    material_name: "Portland Cement (OPC 53)",
    supplier_name: "Shree Industries",
    quantity: 50,
    total_price: 18500,
    status: "in_transit",
    created_at: "2026-07-02T10:00:00Z",
  },
  {
    id: "ord-002",
    listing_id: "l-2",
    material_name: "TMT Steel Bars (12mm)",
    supplier_name: "Vizag Steel Traders",
    quantity: 100,
    total_price: 62000,
    status: "delivered",
    created_at: "2026-06-28T09:00:00Z",
  },
  {
    id: "ord-003",
    listing_id: "l-3",
    material_name: "River Sand (Fine)",
    supplier_name: "Godavari Sand Works",
    quantity: 200,
    total_price: 14000,
    status: "delivered",
    created_at: "2026-06-20T11:00:00Z",
  },
];

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [isLoading, setIsLoading] = useState(false);

  // Derive active vs past orders
  const activeOrder = orders.find(o => ["pending", "confirmed", "in_transit"].includes(o.status)) || null;
  const pastOrders = orders.filter(o => ["delivered", "cancelled"].includes(o.status));

  const statusSteps = ["pending", "confirmed", "in_transit", "delivered"];
  const activeStepIndex = activeOrder ? statusSteps.indexOf(activeOrder.status) : -1;

  return (
    <div className="space-y-6" id="buyer-dashboard">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-jakarta font-bold text-heading text-2xl mb-1">
          Welcome back, {user?.displayName?.split(" ")[0] || "Buyer"} 👋
        </h1>
        <p className="text-muted text-sm">Here&apos;s what&apos;s happening with your orders.</p>
      </motion.div>

      {/* Live Order Status Block */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {isLoading ? (
          <SkeletonLoader count={1} type="row" />
        ) : activeOrder ? (
          <ElevatedCard className="border border-buyer/20 bg-gradient-to-r from-buyer-soft to-white" id="active-order-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-buyer uppercase tracking-wider mb-1">Active Order</p>
                <h3 className="font-jakarta font-bold text-heading text-lg">{activeOrder.material_name}</h3>
                <p className="text-muted text-sm">{activeOrder.supplier_name}</p>
              </div>
              <StatusPill status={activeOrder.status} />
            </div>

            {/* Mini Status Stepper */}
            <div className="flex items-center gap-1 mb-4">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i <= activeStepIndex
                        ? "bg-buyer text-white"
                        : "bg-gray-100 text-subtle"
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 rounded ${i < activeStepIndex ? "bg-buyer" : "bg-gray-100"}`} />
                  )}
                </div>
              ))}
            </div>

            <Link
              href={`/buyer/order-tracking/${activeOrder.id}`}
              className="btn-primary-buyer inline-flex items-center gap-2 text-sm py-2.5 px-5"
              id="track-order-btn"
            >
              Track Order
              <ArrowRight className="w-4 h-4" />
            </Link>
          </ElevatedCard>
        ) : (
          <ElevatedCard id="no-active-order-card">
            <div className="flex items-center gap-4 py-2">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-muted" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-heading text-sm">No active orders right now</h3>
                <p className="text-muted text-xs">Browse the marketplace to find what you need.</p>
              </div>
              <Link href="/buyer/marketplace" className="btn-primary-buyer text-sm py-2 px-4">
                Browse Marketplace
              </Link>
            </div>
          </ElevatedCard>
        )}
      </motion.div>

      {/* Previous Orders Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="font-jakarta font-semibold text-heading text-lg mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted" />
          Previous Orders
        </h2>

        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="You haven't ordered yet"
            description="Start by browsing the marketplace to find materials."
            actionLabel="Browse Marketplace"
            actionHref="/buyer/marketplace"
          />
        ) : pastOrders.length === 0 ? (
          <ElevatedCard>
            <p className="text-muted text-sm text-center py-4">No completed orders yet. Your first order is on the way!</p>
          </ElevatedCard>
        ) : (
          <div className="space-y-3">
            {pastOrders.map((order) => (
              <Link key={order.id} href={`/buyer/order-tracking/${order.id}`}>
                <ElevatedCard className="hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-muted">{order.material_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-heading text-sm truncate">{order.material_name}</p>
                      <p className="text-subtle text-xs">{order.supplier_name} · {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="price-tag text-sm text-heading">{formatINR(order.total_price)}</p>
                      <StatusPill status={order.status} />
                    </div>
                  </div>
                </ElevatedCard>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
