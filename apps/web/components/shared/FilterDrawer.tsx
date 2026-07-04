"use client";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "@/lib/format";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPrice: number;
  onApply: () => void;
  onClear: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  maxPrice,
  onApply,
  onClear,
}: FilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-50"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
            id="filter-drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-buyer" />
                <h3 className="font-jakarta font-semibold text-heading">Filters</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onCategoryChange("")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === "" ? "bg-buyer text-white" : "bg-gray-100 text-body hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => onCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === cat ? "bg-buyer text-white" : "bg-gray-100 text-body hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">Price Range</label>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-body">
                    <span>{formatINR(priceRange[0])}</span>
                    <span>{formatINR(priceRange[1])}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    value={priceRange[0]}
                    onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                    className="w-full accent-buyer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-buyer"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={onClear} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-muted hover:bg-gray-50 transition-colors">
                Clear All
              </button>
              <button onClick={() => { onApply(); onClose(); }} className="flex-1 btn-primary-buyer py-2.5 text-sm">
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
