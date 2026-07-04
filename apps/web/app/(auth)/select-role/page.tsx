"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { ShoppingBag, Warehouse, Loader2, MapPin, Building2, User, Phone } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

declare global {
  interface Window {
    google: any;
    initSignupMap: () => void;
  }
}

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<"buyer" | "supplier" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1 = role select, 2 = details form
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    phone: "",
    address: "",
    lat: 0,
    lng: 0,
  });

  // Google Maps refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Maps when step 2 is shown
  useEffect(() => {
    if (step !== 2) return;

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      // Default location (India center)
      const defaultPos = { lat: 20.5937, lng: 78.9629 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultPos,
        zoom: 5,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });
      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      markerRef.current = marker;

      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            map.setCenter(pos);
            map.setZoom(15);
            marker.setPosition(pos);
            setForm(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }));

            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: pos }, (results: any, status: any) => {
              if (status === "OK" && results[0]) {
                setForm(prev => ({ ...prev, address: results[0].formatted_address }));
                if (addressInputRef.current) {
                  addressInputRef.current.value = results[0].formatted_address;
                }
              }
            });
          },
          () => { /* Permission denied — keep default */ }
        );
      }

      // Drag marker to update address
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        const lat = pos.lat();
        const lng = pos.lng();
        setForm(prev => ({ ...prev, lat, lng }));

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            setForm(prev => ({ ...prev, address: results[0].formatted_address }));
            if (addressInputRef.current) {
              addressInputRef.current.value = results[0].formatted_address;
            }
          }
        });
      });

      // Click map to move marker
      map.addListener("click", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition(e.latLng);
        setForm(prev => ({ ...prev, lat, lng }));

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            setForm(prev => ({ ...prev, address: results[0].formatted_address }));
            if (addressInputRef.current) {
              addressInputRef.current.value = results[0].formatted_address;
            }
          }
        });
      });

      // Autocomplete
      if (addressInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["formatted_address", "geometry"],
        });
        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            map.setCenter(place.geometry.location);
            map.setZoom(16);
            marker.setPosition(place.geometry.location);
            setForm(prev => ({
              ...prev,
              address: place.formatted_address || "",
              lat,
              lng,
            }));
          }
        });
      }
    };

    // Load Google Maps script if not already loaded
    if (window.google?.maps) {
      initMap();
    } else {
      window.initSignupMap = initMap;
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&libraries=places&callback=initSignupMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [step]);

  const handleRoleSelect = (role: "buyer" | "supplier") => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsSubmitting(true);

    try {
      await fetchApi("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          role: selectedRole,
          full_name: form.fullName,
          business_name: form.businessName,
          phone: form.phone,
          address: form.address,
          lat: form.lat,
          lng: form.lng,
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
                <div className="w-10 h-10 bg-gradient-to-br from-buyer to-teal-400 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-heading text-sm placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring outline-none transition-all"
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-heading text-sm placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring outline-none transition-all"
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
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-heading text-sm placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring outline-none transition-all"
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
                    placeholder="Search for your address..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-heading text-sm placeholder:text-subtle focus:border-buyer focus:ring-2 focus:ring-buyer-ring outline-none transition-all mb-3"
                    id="signup-address"
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                  {/* Google Maps embed */}
                  <div
                    ref={mapRef}
                    className="w-full h-56 rounded-xl border border-gray-200 overflow-hidden bg-gray-100"
                    id="signup-map"
                  />
                  <p className="text-subtle text-xs mt-2">
                    📍 Click on the map or drag the pin to set your exact location
                  </p>
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
