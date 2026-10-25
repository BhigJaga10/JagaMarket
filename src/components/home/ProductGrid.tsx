import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { SlidersHorizontal, Sparkles, AlertCircle, ArrowUpDown } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  selectedCategory: string;
  searchQuery: string;
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onOpenRequestModal: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedCategory,
  searchQuery,
  onSelectProduct,
  onAddToCart,
  onOpenRequestModal
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc' | 'popular'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory && p.category !== selectedCategory) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q) || false;
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchVendor = p.vendorBusinessName.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchBrand && !matchSku && !matchVendor) {
            return false;
          }
        }

        // Stock filter
        if (inStockOnly && p.stock <= 0) {
          return false;
        }

        // Price filter
        if (maxPriceFilter && p.price > Number(maxPriceFilter)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'price-asc') {
          return a.price - b.price;
        }
        if (sortBy === 'price-desc') {
          return b.price - a.price;
        }
        if (sortBy === 'popular') {
          return b.salesCount - a.salesCount;
        }
        // Default 'featured'
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, inStockOnly, maxPriceFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(0, page * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 my-8">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 mb-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
            <span>Filter:</span>
          </span>

          {/* In Stock toggle */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition ${
              inStockOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {inStockOnly ? '✓ In Stock Only' : 'In Stock Only'}
          </button>

          {/* Max Price quick input */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-[11px] text-slate-500">Max ₦:</span>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(e.target.value ? Number(e.target.value) : '')}
              className="w-20 text-xs bg-transparent focus:outline-none text-slate-800"
            />
            {maxPriceFilter && (
              <button
                onClick={() => setMaxPriceFilter('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="featured">Featured & Recommended</option>
            <option value="newest">Newly Added</option>
            <option value="popular">Most Popular (Order Volume)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results Count & Context */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
        <p>
          Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> live products
          {selectedCategory && (
            <span> in <span className="text-emerald-800 font-semibold">{selectedCategory}</span></span>
          )}
          {searchQuery && (
            <span> matching "<span className="text-emerald-800 font-semibold">{searchQuery}</span>"</span>
          )}
        </p>
      </div>

      {/* Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No products match your criteria</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search query or filters. You can also request any product directly and our team will source it!
          </p>
          <button
            onClick={onOpenRequestModal}
            className="mt-4 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
          >
            ✨ Request This Item on JAGA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {page < totalPages && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-6 py-3 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-800 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition"
          >
            Load More Products ({filteredProducts.length - paginatedProducts.length} remaining)
          </button>
        </div>
      )}

      {/* Prominent Sourcing Banner */}
      <div className="mt-12 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-emerald-800">
        <div>
          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>CAN'T FIND AN ITEM?</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            Use JAGA Custom Product Sourcing
          </h3>
          <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
            Upload a reference picture, specify your budget and specifications. Verified Nigerian wholesalers will provide a guaranteed quotation directly to your dashboard.
          </p>
        </div>
        <button
          onClick={onOpenRequestModal}
          className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shrink-0 transition"
        >
          Submit Product Request
        </button>
      </div>
    </div>
  );
};
