import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Order, ProductSourcingRequest } from '../../types';
import { BankTransferModal } from '../payment/BankTransferModal';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  MapPin,
  Calendar,
  Truck,
  ArrowRight,
  ExternalLink,
  XCircle,
  CreditCard
} from 'lucide-react';

interface CustomerDashboardProps {
  onOpenRequestModal: () => void;
  onBrowseMarketplace: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onOpenRequestModal,
  onBrowseMarketplace
}) => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'requests' | 'addresses'>('orders');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">Customer Account Required</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please sign in to view your orders, track ticket IDs, and check product sourcing quotations.
        </p>
      </div>
    );
  }

  // Customer's orders
  const orders = db.getOrders().filter((o) => o.customerId === currentUser.id);

  // Customer's product sourcing requests
  const requests = db.getSourcingRequests().filter((r) => r.customerId === currentUser.id);

  const handleCancelOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelReason) return;

    try {
      db.cancelOrder(cancelModalOrder.ticketId, cancelReason, 'customer', currentUser.id);
      setCancelModalOrder(null);
      setCancelReason('');
      refreshUserData();
      setSuccessAlert('Order cancellation requested. Inventory has been restored.');
      setTimeout(() => setSuccessAlert(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleQuotationDecision = (
    requestId: string,
    decision: 'accepted' | 'declined'
  ) => {
    try {
      db.respondToQuotation(requestId, decision, currentUser.id);
      refreshUserData();
      setSuccessAlert(
        decision === 'accepted'
          ? 'Quotation accepted! Our administrative team will finalize order billing.'
          : 'Quotation declined. Request has been closed.'
      );
      setTimeout(() => setSuccessAlert(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Customer Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{currentUser.fullName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.email} · {currentUser.phone}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              📍 Registered Delivery Area: {currentUser.address?.street || 'Lagos'}, {currentUser.address?.city || 'Lagos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRequestModal}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Request Item</span>
          </button>
          <button
            onClick={onBrowseMarketplace}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Shop Marketplace
          </button>
        </div>
      </div>

      {successAlert && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successAlert}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Orders & Tickets ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Sourcing Requests ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'addresses'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Delivery Details</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Orders Placed Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore products from approved Nigerian vendors on our homepage and place your first order.
              </p>
              <button
                onClick={onBrowseMarketplace}
                className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const isAwaitingPayment =
                order.paymentStatus === 'awaiting_payment' ||
                order.paymentStatus === 'payment_claimed';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4 text-xs"
                >
                  {/* Top Bar with Ticket ID */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 font-mono tracking-wide">
                          Ticket ID: {order.ticketId}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({new Date(order.createdAt).toLocaleDateString()})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Delivery to: {order.deliveryAddress.street}, {order.deliveryAddress.city},{' '}
                        {order.deliveryAddress.state}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : order.paymentStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        Payment: {order.paymentStatus.replace('_', ' ')}
                      </span>

                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        Delivery: {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Delivery alert if admin set date */}
                  {order.scheduledDeliveryDate && (
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          <strong>Estimated Delivery Date:</strong> {order.scheduledDeliveryDate} via{' '}
                          {order.deliveryCourier || 'Partner Courier'}
                        </span>
                      </div>
                      {order.trackingNumber && (
                        <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                          Track: {order.trackingNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Purchased Items List */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                            <p className="text-[11px] text-slate-500">
                              {item.variantDescription && `${item.variantDescription} · `}Qty: {item.quantity} · ₦{item.unitPrice.toLocaleString()} each
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-slate-900">
                          ₦{(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <p>Items Subtotal: ₦{order.subtotal.toLocaleString()} · Shipping: ₦{order.deliveryFee.toLocaleString()}</p>
                      <p className="font-bold text-slate-900 text-sm">
                        Total Amount: <span className="text-emerald-900 font-black">₦{order.total.toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bank transfer payment instructions & claim button */}
                      {isAwaitingPayment && (
                        <button
                          onClick={() => setSelectedOrderForPayment(order)}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>
                            {order.paymentClaim ? 'View / Update Payment Claim' : 'Pay via Bank Transfer'}
                          </span>
                        </button>
                      )}

                      {/* Cancellation eligibility check */}
                      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'in_transit' && order.orderStatus !== 'delivered' && (
                        <button
                          onClick={() => setCancelModalOrder(order)}
                          className="px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl font-semibold text-xs"
                        >
                          Request Cancellation
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Timeline */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider block mb-2">
                      Order Progress Timeline
                    </span>
                    <div className="space-y-2 border-l-2 border-emerald-600 pl-3 ml-1.5">
                      {order.timeline.map((event, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white" />
                          <p className="font-bold text-slate-900 text-[11px]">{event.title}</p>
                          <p className="text-slate-500 text-[10px]">{event.description}</p>
                          <span className="text-[9px] text-slate-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: PRODUCT SOURCING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Custom Product Sourcing</h3>
              <p className="text-xs text-slate-500">
                Track sourcing requests submitted for rare, unlisted, or wholesale items.
              </p>
            </div>
            <button
              onClick={onOpenRequestModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Sourcing Requests Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Looking for a specific spare part, traditional fabric, electronic model, or produce? Submit a request and we'll quote you directly.
              </p>
              <button
                onClick={onOpenRequestModal}
                className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Submit Sourcing Request
              </button>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {req.requestId}
                    </span>
                    <span className="text-slate-400 text-[10px] ml-2">
                      ({new Date(req.createdAt).toLocaleDateString()})
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{req.productName}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    Status: {req.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">Target Budget</span>
                    <p className="font-bold text-slate-900">
                      {req.expectedBudgetNgn ? `₦${req.expectedBudgetNgn.toLocaleString()}` : 'Negotiable'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">Quantity</span>
                    <p className="font-bold text-slate-900">{req.quantity} unit(s)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">Delivery State</span>
                    <p className="font-bold text-slate-900">{req.deliveryState}</p>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <strong>Notes:</strong> {req.description}
                </p>

                {/* Quotation from Admin */}
                {req.quotation && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-emerald-950 uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Official Sourcing Quotation Received
                      </h5>
                      <span className="font-black text-emerald-950 text-sm">
                        Quoted Price: ₦{req.quotation.quotedPriceNgn.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-emerald-900 text-xs">
                      <strong>Sourcing Note:</strong> {req.quotation.sourcingNotes} · Estimated Delivery: {req.quotation.estimatedDeliveryDays} days.
                    </p>

                    {/* Quotation Acceptance Controls */}
                    {req.status === 'quotation_ready' && (
                      <div className="pt-2 border-t border-emerald-200 flex justify-end gap-2">
                        <button
                          onClick={() => handleQuotationDecision(req.requestId, 'declined')}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 font-bold hover:bg-rose-50"
                        >
                          Decline Quote
                        </button>
                        <button
                          onClick={() => handleQuotationDecision(req.requestId, 'accepted')}
                          className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
                        >
                          Accept Quotation
                        </button>
                      </div>
                    )}

                    {req.customerDecision === 'accepted' && (
                      <div className="text-[11px] font-bold text-emerald-800">
                        ✓ You accepted this quotation. Order billing is being finalized.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-base">Saved Delivery Information</h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              Default Residential / Office Address
            </span>
            <p className="font-bold text-slate-900 text-sm">{currentUser.fullName}</p>
            <p className="text-slate-600">{currentUser.address?.street || '14 Admiralty Way'}</p>
            <p className="text-slate-600">{currentUser.address?.city || 'Lekki'}, {currentUser.address?.state || 'Lagos State'}</p>
            <p className="text-slate-600">Phone: {currentUser.phone}</p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedOrderForPayment && (
        <BankTransferModal
          isOpen={!!selectedOrderForPayment}
          order={selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onPaymentClaimSubmitted={() => {
            refreshUserData();
            setSelectedOrderForPayment(null);
          }}
        />
      )}

      {/* Cancellation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Cancel Order ({cancelModalOrder.ticketId})
            </h4>
            <p className="text-slate-600">
              Please enter your reason for cancellation. If you already transferred funds, our refund team will review your payment claim.
            </p>
            <form onSubmit={handleCancelOrder} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Why do you wish to cancel this order?..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-emerald-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
