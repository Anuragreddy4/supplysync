"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import EmptyState from "@/components/shared/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, Package, AlertTriangle } from "lucide-react";

interface Listing {
  id: string;
  material_name: string;
  category: string;
  stock_qty: number;
  unit: string;
  price_per_unit: number;
  is_flagged_high: boolean;
  fair_price_min?: number;
  fair_price_max?: number;
}

const demoListings: Listing[] = [
  { id: "l-1", material_name: "Portland Cement (OPC 53)", category: "Cement", stock_qty: 500, unit: "bags", price_per_unit: 370, is_flagged_high: false },
  { id: "l-2", material_name: "TMT Steel Bars (12mm)", category: "Steel", stock_qty: 240, unit: "kg", price_per_unit: 620, is_flagged_high: true, fair_price_min: 480, fair_price_max: 560 },
  { id: "l-3", material_name: "River Sand (Fine)", category: "Sand", stock_qty: 1000, unit: "cft", price_per_unit: 70, is_flagged_high: false },
  { id: "l-4", material_name: "Red Clay Bricks (Standard)", category: "Bricks", stock_qty: 0, unit: "pcs", price_per_unit: 8, is_flagged_high: false },
];

export default function SupplierListingsPage() {
  const [listings, setListings] = useState(demoListings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ material_name: "", category: "", stock_qty: "", unit: "kg", price_per_unit: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const openNewModal = () => {
    setFormData({ material_name: "", category: "", stock_qty: "", unit: "kg", price_per_unit: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (listing: Listing) => {
    setFormData({
      material_name: listing.material_name,
      category: listing.category,
      stock_qty: listing.stock_qty.toString(),
      unit: listing.unit,
      price_per_unit: listing.price_per_unit.toString(),
    });
    setEditingId(listing.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));

    if (editingId) {
      setListings(prev => prev.map(l => l.id === editingId ? {
        ...l,
        material_name: formData.material_name,
        category: formData.category,
        stock_qty: Number(formData.stock_qty),
        unit: formData.unit,
        price_per_unit: Number(formData.price_per_unit),
      } : l));
      showToast("Listing updated successfully", "success");
    } else {
      const newListing: Listing = {
        id: `l-${Date.now()}`,
        material_name: formData.material_name,
        category: formData.category,
        stock_qty: Number(formData.stock_qty),
        unit: formData.unit,
        price_per_unit: Number(formData.price_per_unit),
        is_flagged_high: false,
      };
      setListings(prev => [newListing, ...prev]);
      showToast("Listing created successfully", "success");
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const listing = listings.find(l => l.id === id);
    setListings(prev => prev.filter(l => l.id !== id));
    showToast(`${listing?.material_name} deleted`, "info");
  };

  return (
    <div id="supplier-listings">
      <div className="flex items-center justify-between mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-jakarta font-bold text-heading text-2xl"
        >
          My Listings
        </motion.h1>
        <button onClick={openNewModal} className="btn-primary-supplier text-sm flex items-center gap-2" id="add-listing-btn">
          <Plus className="w-4 h-4" />
          Add New Listing
        </button>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No listings yet"
          description="Create your first listing to start receiving orders."
          actionLabel="Add Listing"
          onAction={openNewModal}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {listings.map(listing => (
              <motion.div
                key={listing.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
              >
                <ElevatedCard className={listing.is_flagged_high ? "border border-amber-200" : ""}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-supplier-soft flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-supplier" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-heading text-sm truncate">{listing.material_name}</h3>
                        {listing.is_flagged_high && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Price Flagged
                          </span>
                        )}
                        {listing.stock_qty === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold">Out of Stock</span>
                        )}
                      </div>
                      <p className="text-subtle text-xs">{listing.category} · {listing.stock_qty.toLocaleString("en-IN")} {listing.unit}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="price-tag text-lg text-heading">{formatINR(listing.price_per_unit)}</p>
                      <p className="text-subtle text-xs">per {listing.unit}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(listing)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-muted hover:text-heading transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </ElevatedCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl z-50 p-6"
              id="listing-modal"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-jakarta font-bold text-heading text-lg">
                  {editingId ? "Edit Listing" : "Add New Listing"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Material Name</label>
                  <input
                    type="text"
                    required
                    value={formData.material_name}
                    onChange={e => setFormData({ ...formData, material_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-heading text-sm focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none"
                    placeholder="e.g. Portland Cement OPC 53"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Category</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-heading text-sm focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none"
                      placeholder="e.g. Cement"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-heading text-sm bg-white focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="bags">bags</option>
                      <option value="pcs">pcs</option>
                      <option value="cft">cft</option>
                      <option value="litres">litres</option>
                      <option value="tonnes">tonnes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock_qty}
                      onChange={e => setFormData({ ...formData, stock_qty: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-heading text-sm focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none tabular-nums"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Price per Unit (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price_per_unit}
                      onChange={e => setFormData({ ...formData, price_per_unit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-heading text-sm focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary-supplier py-3 text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Update Listing" : "Create Listing"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
