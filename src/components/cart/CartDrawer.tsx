import React from 'react';
import { useCart } from '../../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout
}) => {
  const { cart, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Shopping Cart</h3>
              <p className="text-xs text-slate-500">{totalItems} item{totalItems === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto stroke-1 mb-3 opacity-40" />
              <h4 className="font-semibold text-slate-700 text-base">Your cart is empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Explore thousands of verified products from Alaba, Balogun, and top Nigerian merchants.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice =
                item.product.price + (item.selectedVariant?.priceDelta || 0);
              const maxStock = item.selectedVariant
                ? item.selectedVariant.stock
                : item.product.stock;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs flex gap-3 relative"
                >
                  <img
                    src={item.product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-800 line-clamp-1">
                      {item.product.vendorBusinessName}
                    </p>
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {item.product.name}
                    </h4>

                    {item.selectedVariant && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {[
                          item.selectedVariant.color,
                          item.selectedVariant.size,
                          item.selectedVariant.optionName
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="font-bold text-slate-900 text-sm">
                        ₦{(unitPrice * item.quantity).toLocaleString()}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-slate-800 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= maxStock}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 transition"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900 text-sm">
                ₦{subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Delivery Fee</span>
              <span>Calculated at checkout</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-lg font-extrabold text-emerald-800">
                ₦{subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct Bank Transfer Escrow · Verifiable Ticket ID</span>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
