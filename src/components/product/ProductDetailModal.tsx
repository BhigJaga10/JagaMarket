import React, { useState } from 'react';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import {
  X,
  Star,
  CheckCircle,
  Truck,
  ShieldCheck,
  Package,
  Clock,
  MapPin,
  ShoppingBag,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onProceedToCheckout
}) => {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  if (!product) return null;

  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0 || product.status === 'out_of_stock';

  const unitPrice = product.price + (selectedVariant?.priceDelta || 0);

  const handleAddToCart = () => {
    const res = addToCart(product, quantity, selectedVariant);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBuyNow = () => {
    const res = addToCart(product, quantity, selectedVariant);
    if (res.success) {
      onClose();
      onProceedToCheckout();
    } else {
      setNotification(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{product.category}</span>
            <span>/</span>
            <span className="font-medium text-slate-800">{product.subcategory}</span>
            <span className="hidden sm:inline">· SKU: {selectedVariant?.sku || product.sku}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Images Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.dealDiscountPercent && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
                  -{product.dealDiscountPercent}% OFF
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
                  <span className="px-4 py-2 bg-rose-600 text-white font-bold text-sm rounded-xl uppercase tracking-wider">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust and Vendor Highlight Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Verified Nigerian Merchant
                </span>
                <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500" />
                  {product.rating.toFixed(1)} / 5.0
                </span>
              </div>
              <p className="font-semibold text-emerald-950 text-sm">
                {product.vendorBusinessName}
              </p>
              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {product.vendorLocation}
              </p>
            </div>
          </div>

          {/* Right: Product Details, Variants & Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                {product.brand && (
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    {product.brand}
                  </span>
                )}
                <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Price Block */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-baseline gap-3">
                <span className="text-2xl font-black text-emerald-950">
                  ₦{unitPrice.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ₦{product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.dealDiscountPercent && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Save ₦{(product.originalPrice! - unitPrice).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Select Option / Variant:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const label = [variant.color, variant.size, variant.optionName]
                        .filter(Boolean)
                        .join(' · ');

                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariant(variant);
                            setQuantity(1);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <div>{label}</div>
                          <div className="text-[10px] text-slate-400">
                            {variant.stock > 0 ? `${variant.stock} left` : 'Out of stock'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Notice */}
              <div className="flex items-center gap-2 text-xs">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Currently Out of Stock
                  </span>
                ) : currentStock <= 5 ? (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Low Stock: Only {currentStock} units remaining!
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    In Stock ({currentStock} available in warehouse)
                  </span>
                )}
              </div>

              {/* Quantity Stepper */}
              {!isOutOfStock && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-bold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Product Description
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Delivery & Specs tags */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Coverage: {product.deliveryCoverage === 'nationwide' ? 'All 36 States' : 'Regional'}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Prep Time: {product.prepTimeHours || 24} hours</span>
                </div>
              </div>
            </div>

            {/* Notification alert */}
            {notification && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notification}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-emerald-800 border-emerald-700 hover:bg-emerald-50 active:scale-95'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-95'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Buy Now</span>
                </button>
              </div>

              <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by JAGA Manual Escrow Bank Transfer Verification</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
