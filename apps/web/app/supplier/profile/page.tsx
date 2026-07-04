"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers";
import { useToast } from "@/lib/toast-context";
import ElevatedCard from "@/components/shared/ElevatedCard";
import { motion } from "framer-motion";
import { User, Building2, Phone, MapPin, Loader2, CheckCircle2 } from "lucide-react";

export default function SupplierProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessType: "wholesaler",
    phone: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast("Profile updated successfully", "success");
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto" id="supplier-profile">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-jakarta font-bold text-heading text-2xl mb-6"
      >
        My Profile
      </motion.h1>

      {/* User Info Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ElevatedCard className="mb-6">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-2xl border-2 border-gray-100 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-supplier-soft flex items-center justify-center">
                <User className="w-7 h-7 text-supplier" />
              </div>
            )}
            <div>
              <h2 className="font-jakarta font-bold text-heading text-lg">{user?.displayName || "Supplier"}</h2>
              <p className="text-muted text-sm">{user?.email}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-supplier mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified Supplier
              </span>
            </div>
          </div>
        </ElevatedCard>
      </motion.div>

      {/* Edit Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ElevatedCard>
          <h3 className="font-jakarta font-semibold text-heading text-lg mb-5">Business Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Your business name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-heading text-sm placeholder:text-subtle focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Business Type</label>
              <select
                value={form.businessType}
                onChange={e => setForm({ ...form, businessType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-heading text-sm bg-white focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none transition-all"
              >
                <option value="wholesaler">Wholesaler</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="retailer">Retailer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-heading text-sm placeholder:text-subtle focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-subtle" />
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Warehouse / business address"
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-heading text-sm placeholder:text-subtle focus:border-supplier focus:ring-2 focus:ring-supplier-ring outline-none transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary-supplier py-3 text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
            </button>
          </form>
        </ElevatedCard>
      </motion.div>
    </div>
  );
}
