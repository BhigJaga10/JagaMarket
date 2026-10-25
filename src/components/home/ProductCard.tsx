import React from 'react';
import { Product } from '../../types';
import { ShoppingBag, Star, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart
}) => {
  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const isLowStock = !isOutOfStock && product.stock <= 5;

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Product Image Container */}
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Discount Badge */}
          {product.dealDiscountPercent && product.dealDiscountPercent > 0 && !isOutOfStock && (
            <div className="absolute top-2 left-2 bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
              -{product.dealDiscountPercent}%
            </div>
          )}

          {/* Stock Badges */}
          {isOutOfStock ? (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
              <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-md">
                Sold Out
              </span>
            </div>
          ) : isLowStock ? (
            <div className="absolute bottom-2 left-2 bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Only {product.stock} left!</span>
            </div>
          ) : null}

          {/* Variants Counter */}
          {product.variants && product.variants.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-xs">
              {product.variants.length} options
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-3.5 space-y-2">
          {/* Vendor Badge & Location */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-800 truncate max-w-[140px] flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
              {product.vendorBusinessName}
            </span>
            <span className="flex items-center gap-0.5 text-slate-400 text-[10px] shrink-0">
              <MapPin className="w-2.5 h-2.5" />
              {product.vendorLocation.split(',')[1]?.trim() || 'Nigeria'}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
            {product.name}
          </h3>

          {/* Rating & Sales */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-300">·</span>
            <span>{product.salesCount} sold</span>
          </div>
        </div>
      </div>

      {/* Price & Action Strip */}
      <div className="p-3.5 pt-0 mt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="block font-black text-slate-900 text-sm sm:text-base">
            ₦{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-[11px] text-slate-400 line-through">
              ₦{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAddToCart(product);
          }}
          disabled={isOutOfStock}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-95'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
        </button>
      </div>
    </div>
  );
};
