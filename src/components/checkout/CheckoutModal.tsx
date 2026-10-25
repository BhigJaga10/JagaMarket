import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Order } from '../../types';
import {
  X,
  ShieldCheck,
  MapPin,
  Truck,
  Phone,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  LogIn
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onPromptLogin: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  onPromptLogin
}) => {
  const { cart, subtotal, clearCart } = useCart();
  const { currentUser, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [street, setStreet] = useState(currentUser?.address?.street || '');
  const [city, setCity] = useState(currentUser?.address?.city || 'Lagos');
  const [state, setState] = useState(currentUser?.address?.state || 'Lagos');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Delivery fee lookup based on state
  const deliveryZones = db.getDeliveryZones();
  const matchedZone = deliveryZones.find(
    (z) => z.state.toLowerCase() === state.toLowerCase()
  );
  const deliveryFee = matchedZone ? matchedZone.fee : 4000;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated || !currentUser) {
      onPromptLogin();
      return;
    }

    if (!fullName || !phone || !street || !state) {
      setError('Please provide complete recipient name, phone, and delivery address.');
      return;
    }

    if (cart.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Server-side order creation:
      // Validates stock, recalculates prices, generates unique Ticket ID JAG-2026-XXXXXX,
      // and splits into vendor suborders!
      const newOrder = await db.createOrder({
        customer: currentUser,
        deliveryAddress: {
          fullName,
          phone,
          street,
          city,
          state,
          instructions
        },
        cartItems: cart.map((item) => ({
          productId: item.productId,
          variantId: item.selectedVariant?.id,
          quantity: item.quantity
        }))
      });

      clearCart();
      setIsSubmitting(false);
      onOrderCreated(newOrder);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to generate order ticket. Please check stock availability.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300 font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Checkout & Order Placement</h3>
              <p className="text-xs text-emerald-200">
                Ticket ID reservation & manual bank transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Check Warning Banner if visitor */}
        {!isAuthenticated && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Login Required:</strong> You can browse freely, but a customer account is required to place orders.
              </span>
            </div>
            <button
              onClick={onPromptLogin}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Delivery Details */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>1. Delivery Address in Nigeria</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Recipient Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amara Okafor"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number (for dispatch call) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+234 803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Delivery State (Calculates Shipping) *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                >
                  <option value="Lagos">Lagos State (₦2,500)</option>
                  <option value="Abuja (FCT)">Abuja FCT (₦3,500)</option>
                  <option value="Rivers">Rivers / Port Harcourt (₦4,000)</option>
                  <option value="Kano">Kano State (₦4,500)</option>
                  <option value="Oyo">Oyo / Ibadan (₦3,000)</option>
                  <option value="Other Nigerian States">Other Nigerian States (₦5,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City / LGA *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lekki / Ikeja / Garki"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Street Address & Landmarks *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Plot 14 Admiralty Way, opposite Zenith Bank"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
              />
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Call before arrival, leave with security gate"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Items Summary */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>2. Items to be Reserved ({cart.length})</span>
            </h4>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {cart.map((item) => {
                const itemPrice = item.product.price + (item.selectedVariant?.priceDelta || 0);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-9 h-9 rounded object-cover bg-slate-200 shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500">
                          Qty: {item.quantity} · {item.product.vendorBusinessName}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0 pl-2">
                      ₦{(itemPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee ({state})</span>
              <span className="font-semibold text-slate-900">₦{deliveryFee.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Order Amount</span>
              <span className="text-lg font-black text-emerald-900">
                ₦{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Bank Transfer Reassurance */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong>Manual Nigerian Bank Transfer:</strong> Submitting will instantly reserve your items and generate your unique Order Ticket ID (e.g. <code>JAG-2026-000123</code>). You will transfer the exact amount using your bank app with the Ticket ID as narration.
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span>Generate Order Ticket & View Bank Transfer Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
