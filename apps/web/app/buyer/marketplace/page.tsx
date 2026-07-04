"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import ProductBlock from "@/components/shared/ProductBlock";
import FilterDrawer from "@/components/shared/FilterDrawer";
import SkeletonLoader from "@/components/shared/SkeletonLoader";
import EmptyState from "@/components/shared/EmptyState";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Package } from "lucide-react";

interface Listing {
  id: string;
  supplier_id: string;
  supplier_name: string;
  material_name: string;
  category: string;
  stock_qty: number;
  unit: string;
  price_per_unit: number;
  image_url?: string;
  is_flagged_high: boolean;
}

// Demo listings for UI preview
const demoListings: Listing[] = [
  { id: "l-1", supplier_id: "s-1", supplier_name: "Shree Industries", material_name: "Portland Cement (OPC 53)", category: "Cement", stock_qty: 500, unit: "bags", price_per_unit: 370, image_url: "", is_flagged_high: false },
  { id: "l-2", supplier_id: "s-2", supplier_name: "Vizag Steel Traders", material_name: "TMT Steel Bars (12mm)", category: "Steel", stock_qty: 240, unit: "kg", price_per_unit: 620, image_url: "", is_flagged_high: false },
  { id: "l-3", supplier_id: "s-3", supplier_name: "Godavari Sand Works", material_name: "River Sand (Fine)", category: "Sand", stock_qty: 1000, unit: "cft", price_per_unit: 70, image_url: "", is_flagged_high: false },
  { id: "l-4", supplier_id: "s-4", supplier_name: "Lakshmi Bricks", material_name: "Red Clay Bricks (Standard)", category: "Bricks", stock_qty: 5000, unit: "pcs", price_per_unit: 8, image_url: "", is_flagged_high: false },
  { id: "l-5", supplier_id: "s-1", supplier_name: "Shree Industries", material_name: "PPC Cement (Pozzolana)", category: "Cement", stock_qty: 12, unit: "bags", price_per_unit: 350, image_url: "", is_flagged_high: false },
  { id: "l-6", supplier_id: "s-5", supplier_name: "Hyderabad Paints Co.", material_name: "Exterior Emulsion Paint (White)", category: "Paints", stock_qty: 0, unit: "litres", price_per_unit: 450, image_url: "", is_flagged_high: false },
  { id: "l-7", supplier_id: "s-6", supplier_name: "Southern Timber Works", material_name: "Teak Wood Plank (6ft)", category: "Timber", stock_qty: 80, unit: "pcs", price_per_unit: 2200, image_url: "", is_flagged_high: false },
  { id: "l-8", supplier_id: "s-7", supplier_name: "Deccan Aggregates", material_name: "Crushed Stone Aggregate (20mm)", category: "Sand", stock_qty: 3000, unit: "cft", price_per_unit: 45, image_url: "", is_flagged_high: false },
];

const allCategories = Array.from(new Set(demoListings.map(l => l.category)));

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [appliedFilters, setAppliedFilters] = useState({ category: "", priceRange: [0, 10000] as [number, number] });
  const { addItem } = useCart();
  const { showToast } = useToast();

  // Filter results
  const filteredListings = useMemo(() => {
    return demoListings.filter(listing => {
      const matchesSearch = !searchQuery || listing.material_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !appliedFilters.category || listing.category === appliedFilters.category;
      const matchesPrice = listing.price_per_unit >= appliedFilters.priceRange[0] && listing.price_per_unit <= appliedFilters.priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [searchQuery, appliedFilters]);

  const handleAddToCart = (listing: Listing) => {
    addItem({
      listingId: listing.id,
      materialName: listing.material_name,
      supplierName: listing.supplier_name,
      supplierId: listing.supplier_id,
      unitPrice: listing.price_per_unit,
      unit: listing.unit,
      availableStock: listing.stock_qty,
    });
    showToast(`${listing.material_name} added to cart`, "success");
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ category: selectedCategory, priceRange });
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setPriceRange([0, 10000]);
    setAppliedFilters({ category: "", priceRange: [0, 10000] });
  };

  return (
    <div id="buyer-marketplace">
      {/* Search + Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="search-bar flex-1">
          <Search className="w-5 h-5 text-subtle shrink-0" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="marketplace-search"
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-100 shadow-card text-body text-sm font-medium hover:bg-gray-50 transition-colors"
          id="filter-btn"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </motion.div>

      {/* Results Grid */}
      {filteredListings.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products match your search"
          description="Try adjusting your search or filters to find what you're looking for."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredListings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductBlock
                id={listing.id}
                materialName={listing.material_name}
                supplierName={listing.supplier_name}
                stockQty={listing.stock_qty}
                unit={listing.unit}
                pricePerUnit={listing.price_per_unit}
                imageUrl={listing.image_url}
                onAddToCart={() => handleAddToCart(listing)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={allCategories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        maxPrice={10000}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </div>
  );
}
