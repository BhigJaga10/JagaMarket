import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { ProductSourcingRequest } from '../../types';
import {
  X,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface RequestProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: (req: ProductSourcingRequest) => void;
  onPromptLogin: () => void;
}

export const RequestProductModal: React.FC<RequestProductModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
  onPromptLogin
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState(
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600'
  );
  const [preferredBrand, setPreferredBrand] = useState('');
  const [preferredSpecs, setPreferredSpecs] = useState('');
  const [expectedBudget, setExpectedBudget] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryState, setDeliveryState] = useState(currentUser?.address?.state || 'Lagos');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<ProductSourcingRequest | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated || !currentUser) {
      onPromptLogin();
      return;
    }

    if (!productName || !description) {
      setError('Please provide at least the product name and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRequest = db.createSourcingRequest({
        customerId: currentUser.id,
        customerName: currentUser.fullName,
        customerEmail: currentUser.email,
        customerPhone: currentUser.phone,
        productName,
        description,
        referenceImageUrl,
        preferredBrand: preferredBrand || undefined,
        preferredColorOrSize: preferredSpecs || undefined,
        expectedBudgetNgn: expectedBudget ? Number(expectedBudget) : undefined,
        quantity: Number(quantity),
        deliveryState,
        additionalNotes: additionalNotes || undefined
      });

      setIsSubmitting(false);
      setSuccessResult(newRequest);
      onRequestCreated(newRequest);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to submit request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Request an Unavailable Product</h3>
              <p className="text-xs text-amber-100">
                Custom sourcing across Nigerian markets & wholesale hubs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto text-xs">
          {successResult ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                Sourcing Request Submitted!
              </h4>
              <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your request ID is <strong className="text-emerald-800 font-mono text-sm">{successResult.requestId}</strong>.
                Our operations team and verified wholesale merchants will search for this item and send an official quotation to your Customer Dashboard.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left max-w-xs mx-auto space-y-1 text-[11px]">
                <p><strong>Item:</strong> {successResult.productName}</p>
                <p><strong>Target Budget:</strong> {successResult.expectedBudgetNgn ? `₦${successResult.expectedBudgetNgn.toLocaleString()}` : 'Negotiable'}</p>
                <p><strong>Status:</strong> <span className="font-bold text-amber-700 uppercase">Under Review</span></p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition"
              >
                Close & Track in Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isAuthenticated && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <span>Sign in required so we can notify you with quotations.</span>
                  <button
                    type="button"
                    onClick={onPromptLogin}
                    className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded text-xs"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Yam Pounder 3.5L or Special Kano Kuli-Kuli Paste"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Detailed Description & Specifications *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe dimensions, model number, ingredients, or any specific details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Preferred Brand / Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master Chef / Sony / Vlisco"
                    value={preferredBrand}
                    onChange={(e) => setPreferredBrand(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Color, Size, or Option
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Black / 256GB / Size 44"
                    value={preferredSpecs}
                    onChange={(e) => setPreferredSpecs(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">
                    Target / Expected Budget (₦ NGN)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={expectedBudget}
                    onChange={(e) => setExpectedBudget(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Delivery State
                  </label>
                  <select
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja (FCT)">Abuja (FCT)</option>
                    <option value="Rivers">Rivers</option>
                    <option value="Kano">Kano</option>
                    <option value="Oyo">Oyo</option>
                    <option value="Other Nigerian States">Other States</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Reference Image URL
                  </label>
                  <input
                    type="url"
                    value={referenceImageUrl}
                    onChange={(e) => setReferenceImageUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Additional Notes (Deadlines, urgency, etc.)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Need it before next Friday for an event"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-amber-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
              >
                <span>Submit Sourcing Request (Generate Ticket)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
