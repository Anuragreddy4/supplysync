"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import { motion } from "framer-motion";
import { ClipboardList, Loader2 } from "lucide-react";

interface IncomingOrder {
  id: string;
  buyer_name: string;
  material_name: string;
  quantity: number;
  unit: string;
  total_price: number;
  status: "pending" | "confirmed" | "in_transit" | "delivered";
  created_at: string;
}

const demoOrders: IncomingOrder[] = [
  { id: "o-1", buyer_name: "Ravi Constructions", material_name: "Portland Cement (OPC 53)", quantity: 50, unit: "bags", total_price: 18500, status: "pending", created_at: "2026-07-04T08:00:00Z" },
  { id: "o-2", buyer_name: "Krishna Builders", material_name: "TMT Steel Bars (12mm)", quantity: 30, unit: "kg", total_price: 18600, status: "confirmed", created_at: "2026-07-03T14:00:00Z" },
  { id: "o-3", buyer_name: "Hyderabad Projects", material_name: "River Sand (Fine)", quantity: 500, unit: "cft", total_price: 35000, status: "in_transit", created_at: "2026-07-02T10:00:00Z" },
];

const nextStatusMap: Record<string, { next: string; label: string }> = {
  pending: { next: "confirmed", label: "Confirm" },
  confirmed: { next: "in_transit", label: "Mark In Transit" },
  in_transit: { next: "delivered", label: "Mark Delivered" },
};

export default function SupplierOrdersIncomingPage() {
  const [orders, setOrders] = useState(demoOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
    setLoadingId(orderId);
    await new Promise(r => setTimeout(r, 800));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o));
    showToast(`Order updated to ${nextStatus.replace("_", " ")}`, "success");
    setLoadingId(null);
  };

  const handleCancel = async (orderId: string) => {
    setLoadingId(orderId);
    await new Promise(r => setTimeout(r, 500));
    setOrders(prev => prev.filter(o => o.id !== orderId));
    showToast("Order cancelled", "info");
    setLoadingId(null);
  };

  return (
    <div id="supplier-orders-incoming">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-jakarta font-bold text-heading text-2xl mb-6"
      >
        Incoming Orders
      </motion.h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No incoming orders"
          description="Orders will appear here when buyers purchase your listings."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const transition = nextStatusMap[order.status];
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ElevatedCard>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-supplier-soft flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-supplier">{order.buyer_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-heading text-sm truncate">{order.material_name}</p>
                      <p className="text-subtle text-xs">
                        {order.buyer_name} · {order.quantity} {order.unit} · {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="price-tag text-sm text-heading">{formatINR(order.total_price)}</p>
                      <StatusPill status={order.status} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {transition && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, transition.next)}
                          disabled={loadingId === order.id}
                          className="btn-primary-supplier text-xs py-2 px-3 flex items-center gap-1"
                        >
                          {loadingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : transition.label}
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={loadingId === order.id}
                          className="text-xs py-2 px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </ElevatedCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
