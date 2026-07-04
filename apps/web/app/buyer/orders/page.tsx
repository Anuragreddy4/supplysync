"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, Eye } from "lucide-react";

interface Order {
  id: string;
  material_name: string;
  supplier_name: string;
  quantity: number;
  total_price: number;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  created_at: string;
}

const demoOrders: Order[] = [
  { id: "ord-001", material_name: "Portland Cement (OPC 53)", supplier_name: "Shree Industries", quantity: 50, total_price: 18500, status: "in_transit", created_at: "2026-07-02T10:00:00Z" },
  { id: "ord-002", material_name: "TMT Steel Bars (12mm)", supplier_name: "Vizag Steel Traders", quantity: 100, total_price: 62000, status: "delivered", created_at: "2026-06-28T09:00:00Z" },
  { id: "ord-003", material_name: "River Sand (Fine)", supplier_name: "Godavari Sand Works", quantity: 200, total_price: 14000, status: "delivered", created_at: "2026-06-20T11:00:00Z" },
  { id: "ord-004", material_name: "Red Clay Bricks", supplier_name: "Lakshmi Bricks", quantity: 1000, total_price: 8000, status: "cancelled", created_at: "2026-06-15T08:00:00Z" },
];

const statusTabs = ["all", "pending", "confirmed", "in_transit", "delivered", "cancelled"] as const;
const tabLabels: Record<string, string> = {
  all: "All",
  pending: "Pending",
  confirmed: "Confirmed",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function BuyerOrdersPage() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredOrders = activeTab === "all"
    ? demoOrders
    : demoOrders.filter(o => o.status === activeTab);

  return (
    <div id="buyer-orders">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-jakarta font-bold text-heading text-2xl mb-6"
      >
        Order History
      </motion.h1>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statusTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-buyer text-white shadow-btn"
                : "bg-white text-muted border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={`No ${activeTab === "all" ? "" : tabLabels[activeTab].toLowerCase() + " "}orders`}
          description="Orders matching this filter will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ElevatedCard className="hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-muted">{order.material_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-heading text-sm truncate">{order.material_name}</p>
                    <p className="text-subtle text-xs">
                      {order.supplier_name} · Qty: {order.quantity} · {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className="price-tag text-sm text-heading">{formatINR(order.total_price)}</p>
                      <StatusPill status={order.status} />
                    </div>
                    <Link
                      href={`/buyer/order-tracking/${order.id}`}
                      className="p-2 rounded-lg bg-gray-50 hover:bg-buyer-soft text-muted hover:text-buyer transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </ElevatedCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
