"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { ShoppingBag, Warehouse, Loader2, MapPin, Building2, User, Phone } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";



export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<"buyer" | "supplier" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1 = role select, 2 = details form
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    phone: "",
    address: "",
    city: "",
    lat: 0,
    lng: 0,
  });

  // Address input ref only
  const addressInputRef = useRef<HTMLInputElement>(null);

  const handleRoleSelect = (role: "buyer" | "supplier") => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    
    if (!selectedRole) return;
    
    // Check if any required field is empty
    if (!form.fullName.trim() || !form.businessName.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      await fetchApi("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          role: selectedRole,
          full_name: form.fullName,
          business_name: form.businessName,
          phone: form.phone,
          address_text: form.address,
          city: form.city,
          latitude: form.lat,
          longitude: form.lng,
        }),
      });
      router.push(`/${selectedRole}/dashboard`);
    } catch (error) {
      console.error("Error setting up profile", error);
      // Fallback: still navigate for demo
      router.push(`/${selectedRole}/dashboard`);
    }
  };

  const addressLabel = selectedRole === "buyer" ? "Delivery Address" : "Warehouse / Business Address";

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6" id="select-role-page">
      <div className="w-full max-w-2xl">
        {/* Step 1: Role Select */}
        {step === 1 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="SupplySync Logo" className="w-10 h-10 object-contain drop-shadow-sm dark:hidden" />
                <img src="/logo-dark.png" alt="SupplySync Logo" className="w-10 h-10 object-contain drop-shadow-sm hidden dark:block" />
              </Link>
              <h1 className="text-3xl md:text-4xl font-jakarta font-bold tracking-tight text-heading mb-3">
                Create your account
              </h1>
              <p className="text-muted text-lg">Are you here to buy materials or supply them?</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleRoleSelect("buyer")}
                className="elevated-card p-8 text-left transition-all duration-300 group hover:shadow-card-hover"
                id="role-buyer-card"
              >
                <div className="w-14 h-14 rounded-2xl bg-buyer-soft flex items-center justify-center mb-5">
                  <ShoppingBag className="w-7 h-7 text-buyer" />
                </div>
                <h2 className="text-xl font-jakarta font-bold text-heading mb-2">I&apos;m a Buyer</h2>
                <p className="text-muted text-sm leading-relaxed">
                  Find the best materials for your business with AI-powered sourcing.
                </p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleRoleSelect("supplier")}
                className="elevated-card p-8 text-left transition-all duration-300 group hover:shadow-card-hover"
                id="role-supplier-card"
              >
                <div className="w-14 h-14 rounded-2xl bg-supplier-soft flex items-center justify-center mb-5">
                  <Warehouse className="w-7 h-7 text-supplier" />
                </div>
                <h2 className="text-xl font-jakarta font-bold text-heading mb-2">I&apos;m a Supplier</h2>
                <p className="text-muted text-sm leading-relaxed">
                  List your inventory and connect with verified buyers.
                </p>
              </motion.button>
            </div>
          </>
        )}

        {/* Step 2: Business Details + Address */}
        {step === 2 && selectedRole && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => { setStep(1); setSelectedRole(null); }}
              className="text-sm text-muted hover:text-heading font-medium mb-6 flex items-center gap-1 transition-colors"
            >
              ← Back to role selection
            </button>

            <div className="elevated-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedRole === "buyer" ? "bg-buyer-soft" : "bg-supplier-soft"
                }`}>
                  {selectedRole === "buyer" ? (
                    <ShoppingBag className={`w-5 h-5 text-buyer`} />
                  ) : (
                    <Warehouse className={`w-5 h-5 text-supplier`} />
                  )}
                </div>
                <div>
                  <h2 className="font-jakarta font-bold text-heading text-xl">
                    Sign up as {selectedRole === "buyer" ? "Buyer" : "Supplier"}
                  </h2>
                  <p className="text-muted text-sm">Fill in your business details below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Your full name"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-heading text-sm outline-none transition-all ${
                        hasSubmitted && !form.fullName.trim() 
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-200" 
                          : "border-gray-200 placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring dark:border-slate-700 dark:bg-slate-800"
                      }`}
                      id="signup-fullname"
                    />
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                    <input
                      type="text"
                      required
                      value={form.businessName}
                      onChange={e => setForm({ ...form, businessName: e.target.value })}
                      placeholder="Your company / shop name"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-heading text-sm outline-none transition-all ${
                        hasSubmitted && !form.businessName.trim() 
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-200" 
                          : "border-gray-200 placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring dark:border-slate-700 dark:bg-slate-800"
                      }`}
                      id="signup-business"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-heading text-sm outline-none transition-all ${
                        hasSubmitted && !form.phone.trim() 
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-200" 
                          : "border-gray-200 placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring dark:border-slate-700 dark:bg-slate-800"
                      }`}
                      id="signup-phone"
                    />
                  </div>
                </div>

                {/* Address with Maps */}
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">
                    <MapPin className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                    {addressLabel}
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    required
                    placeholder="Enter your full address"
                    className={`w-full px-4 py-3 rounded-xl border text-heading text-sm outline-none transition-all ${
                        hasSubmitted && !form.address.trim() 
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-200" 
                          : "border-gray-200 placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    id="signup-address"
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">
                    <MapPin className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-heading text-sm outline-none transition-all ${
                        hasSubmitted && !form.city.trim() 
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-200" 
                          : "border-gray-200 placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    id="signup-city"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    selectedRole === "buyer" ? "btn-primary-buyer" : "btn-primary-supplier"
                  }`}
                  id="signup-submit"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `Create ${selectedRole === "buyer" ? "Buyer" : "Supplier"} Account`
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-muted mt-4">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-heading hover:text-buyer transition-colors">
                  Login
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
