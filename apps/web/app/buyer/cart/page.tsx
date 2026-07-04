"use client";

import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import EmptyState from "@/components/shared/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, Loader2, Store } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);

    try {
      // Group items by supplier
      const supplierGroups = items.reduce((acc, item) => {
        if (!acc[item.supplierId]) acc[item.supplierId] = [];
        acc[item.supplierId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      // In production: fire one POST /orders per supplier group
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));

      clearCart();
      showToast("Order placed successfully! 🎉", "success");
      router.push("/buyer/orders");
    } catch (error) {
      showToast("Checkout failed. Please try again.", "error");
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse the marketplace to find materials for your business."
        actionLabel="Browse Marketplace"
        actionHref="/buyer/marketplace"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto" id="buyer-cart">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-jakarta font-bold text-heading text-2xl mb-6"
      >
        Your Cart ({items.length} {items.length === 1 ? "item" : "items"})
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.listingId}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
              >
                <ElevatedCard>
                  <div className="flex items-center gap-4">
                    {/* Item icon */}
                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-muted">{item.materialName.charAt(0)}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-heading text-sm truncate">{item.materialName}</h3>
                      <p className="text-subtle text-xs">{item.supplierName}</p>
                      <p className="price-tag text-sm text-buyer mt-1">{formatINR(item.unitPrice)}<span className="text-subtle font-normal">/{item.unit}</span></p>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.listingId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-body hover:bg-gray-200 disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-semibold text-heading tabular-nums text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.listingId, item.quantity + 1)}
                        disabled={item.quantity >= item.availableStock}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-body hover:bg-gray-200 disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right shrink-0 w-24">
                      <p className="price-tag text-sm text-heading">{formatINR(item.unitPrice * item.quantity)}</p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => {
                        removeItem(item.listingId);
                        showToast(`${item.materialName} removed from cart`, "info");
                      }}
                      className="p-2 text-subtle hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </ElevatedCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <ElevatedCard className="sticky top-24" id="order-summary">
            <h3 className="font-jakarta font-semibold text-heading text-lg mb-4">Order Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal ({items.length} items)</span>
                <span className="font-semibold text-heading tabular-nums">{formatINR(subtotal)}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between">
                <span className="font-semibold text-heading">Total</span>
                <span className="price-tag text-xl text-buyer">{formatINR(subtotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full btn-primary-buyer py-3 text-sm flex items-center justify-center gap-2"
              id="checkout-btn"
            >
              {isCheckingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  Checkout
                </>
              )}
            </button>
          </ElevatedCard>
        </div>
      </div>
    </div>
  );
}
