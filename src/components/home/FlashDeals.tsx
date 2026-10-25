import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Timer, Zap, ArrowRight } from 'lucide-react';

interface FlashDealsProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product) => void;
}

export const FlashDeals: React.FC<FlashDealsProps> = ({
  products,
  onSelectProduct,
  onAddToCart
}) => {
  // Flash deal products (products with dealDiscountPercent)
  const dealProducts = products.filter((p) => (p.dealDiscountPercent || 0) > 0 && p.stock > 0);

  // Countdown timer simulation for Nigerian flash sale
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (dealProducts.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 my-6">
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 rounded-2xl p-4 sm:p-5 text-white shadow-md">
        {/* Deal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-black">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight">
                ⚡ Naija Flash Deals & Discounts
              </h3>
              <p className="text-xs text-amber-100">
                Direct vendor deals with verified Nigerian stock
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 text-xs font-bold bg-black/30 px-3 py-1.5 rounded-xl border border-white/20">
            <Timer className="w-4 h-4 text-amber-300" />
            <span className="text-[11px] text-amber-200">Ends in:</span>
            <div className="flex items-center gap-1 font-mono text-sm text-white">
              <span className="bg-black/40 px-1.5 py-0.5 rounded">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              :
              <span className="bg-black/40 px-1.5 py-0.5 rounded">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              :
              <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Deals Scrollable Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {dealProducts.slice(0, 4).map((product) => {
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-xl p-2.5 text-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] rounded-md shadow-xs">
                      -{product.dealDiscountPercent}% OFF
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800 font-semibold truncate">
                    {product.vendorBusinessName}
                  </p>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block font-black text-slate-900 text-xs sm:text-sm">
                      ₦{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ₦{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                    title="Add to Cart"
                  >
                    + Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
