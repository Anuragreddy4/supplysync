"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatINR } from "@/lib/format";
import ElevatedCard from "@/components/shared/ElevatedCard";
import EmptyState from "@/components/shared/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface FlaggedListing {
  id: string;
  material_name: string;
  category: string;
  current_price: number;
  fair_price_min: number;
  fair_price_max: number;
  unit: string;
}

const demoFlagged: FlaggedListing[] = [
  { id: "l-2", material_name: "TMT Steel Bars (12mm)", category: "Steel", current_price: 620, fair_price_min: 480, fair_price_max: 560, unit: "kg" },
  { id: "l-5", material_name: "Exterior Emulsion Paint", category: "Paints", current_price: 750, fair_price_min: 400, fair_price_max: 550, unit: "litres" },
];

export default function SupplierPricingAlertsPage() {
  const [flagged, setFlagged] = useState(demoFlagged);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleAdjust = async (listing: FlaggedListing) => {
    setAdjustingId(listing.id);
    const fairMidpoint = Math.round((listing.fair_price_min + listing.fair_price_max) / 2);
    await new Promise(r => setTimeout(r, 800));
    setFlagged(prev => prev.filter(l => l.id !== listing.id));
    showToast(`${listing.material_name} price adjusted to ${formatINR(fairMidpoint)}`, "success");
    setAdjustingId(null);
  };

  return (
    <div id="supplier-pricing-alerts">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-jakarta font-bold text-heading text-2xl mb-2"
      >
        Pricing Alerts
      </motion.h1>
      <p className="text-muted text-sm mb-6">
        Our Dynamic Pricing AI has flagged listings where your price is above the fair market range.
      </p>

      {flagged.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All your prices are fair — nice work! 🎉"
          description="No pricing alerts at the moment. Keep up the great pricing strategy."
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {flagged.map((listing, i) => {
              const fairMid = Math.round((listing.fair_price_min + listing.fair_price_max) / 2);
              const overPct = Math.round(((listing.current_price - listing.fair_price_max) / listing.fair_price_max) * 100);
              const rangeWidth = listing.fair_price_max - listing.fair_price_min;
              const markerPos = Math.min(100, Math.max(0, ((listing.current_price - listing.fair_price_min) / (rangeWidth * 1.5)) * 100));

              return (
                <motion.div
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ElevatedCard className="border border-amber-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-1">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-heading text-sm">{listing.material_name}</h3>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            {overPct}% above fair range
                          </span>
                        </div>
                        <p className="text-subtle text-xs mb-4">{listing.category} · per {listing.unit}</p>

                        {/* Price Range Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-muted mb-1">
                            <span>{formatINR(listing.fair_price_min)}</span>
                            <span className="font-medium text-heading">Fair Range</span>
                            <span>{formatINR(listing.fair_price_max)}</span>
                          </div>
                          <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
                            {/* Fair range highlight */}
                            <div className="absolute inset-y-0 bg-green-100 rounded-full" style={{ left: "0%", width: "66%" }} />
                            {/* Current price marker */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"
                              style={{ left: `${Math.min(markerPos, 95)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-green-600 font-medium">Fair: {formatINR(fairMid)}</span>
                            <span className="text-xs text-red-500 font-bold">Current: {formatINR(listing.current_price)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAdjust(listing)}
                          disabled={adjustingId === listing.id}
                          className="btn-primary-supplier text-sm py-2 px-4 flex items-center gap-2"
                        >
                          {adjustingId === listing.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>Adjust to {formatINR(fairMid)}</>
                          )}
                        </button>
                      </div>
                    </div>
                  </ElevatedCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
