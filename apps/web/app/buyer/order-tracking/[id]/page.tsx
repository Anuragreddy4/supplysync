"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import StatusPill from "@/components/shared/StatusPill";
import { motion } from "framer-motion";
import { ArrowLeft, Package, CheckCircle2, Truck, Clock, XCircle } from "lucide-react";
import Link from "next/link";

const statusSteps = [
  { key: "pending", label: "Pending", icon: Clock, description: "Order placed, awaiting confirmation" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, description: "Supplier confirmed your order" },
  { key: "in_transit", label: "In Transit", icon: Truck, description: "Your order is on the way" },
  { key: "delivered", label: "Delivered", icon: Package, description: "Order delivered successfully" },
];

type OrderStatus = "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";

// Demo order data
const demoOrder: {
  id: string;
  material_name: string;
  supplier_name: string;
  quantity: number;
  unit: string;
  total_price: number;
  status: OrderStatus;
  created_at: string;
} = {
  id: "ord-001",
  material_name: "Portland Cement (OPC 53)",
  supplier_name: "Shree Industries",
  quantity: 50,
  unit: "bags",
  total_price: 18500,
  status: "in_transit" as const,
  created_at: "2026-07-02T10:00:00Z",
};

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(demoOrder);
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="max-w-2xl mx-auto" id="order-tracking">
      {/* Back button */}
      <Link
        href="/buyer/dashboard"
        className="inline-flex items-center gap-2 text-muted hover:text-heading text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-jakarta font-bold text-heading text-2xl mb-2">Order Tracking</h1>
        <p className="text-muted text-sm mb-8">Order #{params.id}</p>

        {/* Status Stepper */}
        <ElevatedCard className="mb-6" id="status-stepper">
          {isCancelled ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-jakarta font-bold text-heading text-lg mb-1">Order Cancelled</h3>
              <p className="text-muted text-sm">This order has been cancelled.</p>
            </div>
          ) : (
            <div className="py-4">
              {statusSteps.map((step, i) => {
                const Icon = step.icon;
                const isCompleted = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isFuture = i > currentStepIndex;

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Connector + Icon */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={isCurrent ? { scale: 0.8 } : {}}
                        animate={isCurrent ? { scale: [0.8, 1.1, 1] } : {}}
                        transition={{ duration: 0.5 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? "bg-buyer text-white"
                            : isCurrent
                            ? "bg-buyer text-white ring-4 ring-buyer-ring"
                            : "bg-gray-100 text-subtle"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      {i < statusSteps.length - 1 && (
                        <div className={`w-0.5 h-12 my-1 ${
                          isCompleted ? "bg-buyer" : "bg-gray-200"
                        }`} />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pt-2 pb-6">
                      <h4 className={`font-semibold text-sm ${
                        isFuture ? "text-subtle" : "text-heading"
                      }`}>
                        {step.label}
                      </h4>
                      <p className={`text-xs ${isFuture ? "text-subtle" : "text-muted"}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ElevatedCard>

        {/* Order Summary */}
        <ElevatedCard id="order-summary-tracking">
          <h3 className="font-jakarta font-semibold text-heading mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Material</span>
              <span className="font-medium text-heading">{order.material_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Supplier</span>
              <span className="font-medium text-heading">{order.supplier_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Quantity</span>
              <span className="font-medium text-heading">{order.quantity} {order.unit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order Date</span>
              <span className="font-medium text-heading">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between">
              <span className="font-semibold text-heading">Total</span>
              <span className="price-tag text-xl text-buyer">{formatINR(order.total_price)}</span>
            </div>
          </div>
        </ElevatedCard>
      </motion.div>
    </div>
  );
}
