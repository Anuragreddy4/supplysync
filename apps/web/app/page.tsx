"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Shield, MapPin } from "lucide-react";
import Footer from "@/components/shared/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-base">
      {/* Top Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SupplySync Logo" className="w-8 h-8 object-contain" />
            <span className="font-jakarta font-bold text-heading text-lg tracking-tight">
              Supply Sync
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-heading hover:text-buyer transition-colors"
            id="navbar-signin"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="font-jakarta font-extrabold text-heading text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6">
              Smarter Sourcing for{" "}
              <span className="text-buyer">Every Small Business</span>
            </h1>
            <p className="text-body text-lg max-w-lg mb-8 leading-relaxed">
              Access reliable suppliers, automate RFQs, and grow your sourcing efficiency with Supply Sync.
            </p>
            <Link
              href="/login"
              className="btn-primary-buyer inline-flex items-center gap-2 text-base px-8 py-4"
              id="hero-get-started"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Right - Logo Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <div className="relative w-80 h-80 lg:w-[420px] lg:h-[420px]">
              {/* Decorative gradient blobs */}
              <div className="absolute inset-0 bg-gradient-to-br from-buyer/20 via-teal-200/30 to-indigo-200/20 rounded-full blur-3xl" />
              <div className="absolute top-8 right-4 w-48 h-48 bg-gradient-to-br from-supplier/15 to-purple-200/20 rounded-full blur-2xl" />
              {/* Center logo */}
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="w-40 h-40 lg:w-52 lg:h-52 bg-white rounded-3xl shadow-card flex items-center justify-center">
                  <div className="text-center">
                    <img src="/logo.png" alt="SupplySync Logo" className="w-20 h-20 lg:w-24 lg:h-24 mx-auto object-contain mb-3 drop-shadow-md" />
                    <span className="font-jakarta font-bold text-heading text-sm">Supply Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Live Stock, Real Prices",
                description: "Browse real-time inventory with live pricing from verified local suppliers in your area.",
                color: "text-buyer",
                bg: "bg-buyer-soft",
              },
              {
                icon: Shield,
                title: "Fair Pricing, Always",
                description: "Our Dynamic Pricing AI agent detects and flags inflated prices, ensuring you never overpay.",
                color: "text-supplier",
                bg: "bg-supplier-soft",
              },
              {
                icon: MapPin,
                title: "Direct From Local Suppliers",
                description: "Connect directly with nearby suppliers. No middlemen, faster delivery, better relationships.",
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="elevated-card p-6 hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-jakarta font-semibold text-heading text-lg mb-2">{feature.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
