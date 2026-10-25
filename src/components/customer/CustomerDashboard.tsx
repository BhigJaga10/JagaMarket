import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Order, ProductSourcingRequest, VendorApplication } from '../../types';
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
  CreditCard,
  Building2,
  ShieldCheck,
  AlertCircle,
  Landmark,
  UploadCloud,
  Store,
  RefreshCw
} from 'lucide-react';

interface CustomerDashboardProps {
  onOpenRequestModal: () => void;
  onBrowseMarketplace: () => void;
  onNavigateToVendor?: () => void;
  initialTab?: 'orders' | 'requests' | 'addresses' | 'become-vendor';
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onOpenRequestModal,
  onBrowseMarketplace,
  onNavigateToVendor,
  initialTab = 'orders'
}) => {
  const { currentUser, isApprovedVendor, setActivePortal, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'requests' | 'addresses' | 'become-vendor'>(initialTab);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Vendor Application Data
  const [vendorApp, setVendorApp] = useState<VendorApplication | null>(null);

  // Vendor Application Form State
  const [bizName, setBizName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [state, setState] = useState('Lagos');
  const [lga, setLga] = useState('Lagos Island');
  const [category, setCategory] = useState('Fashion & Ankara');
  const [description, setDescription] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [idType, setIdType] = useState('NIN National Identity Number');
  const [idDocumentUrl, setIdDocumentUrl] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');
  const [cacCertificateUrl, setCacCertificateUrl] = useState('https://images.unsplash.com/photo-1568667256549-094345857637?w=600');
  const [bankName, setBankName] = useState('Zenith Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ProductSourcingRequest[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Prefill form defaults from current customer
    setLegalName(currentUser.fullName);
    setPhone(currentUser.phone);
    if (currentUser.address?.state) setState(currentUser.address.state);

    // 1. Subscribe to Live Orders
    const unsubOrders = db.subscribeOrders(currentUser.id, 'customer', (liveOrders) => {
      setOrders(liveOrders);
    });

    // 2. Subscribe to Live Sourcing Requests
    const unsubReqs = db.subscribeSourcingRequests(currentUser.id, 'customer', (liveReqs) => {
      setRequests(liveReqs);
    });

    // 3. Subscribe to Vendor Application
    const unsubApp = db.subscribeVendorApplication(currentUser.id, (app) => {
      setVendorApp(app);
      if (app) {
        setBizName(app.businessName || '');
        setLegalName(app.legalName || currentUser.fullName);
        setPhone(app.phone || currentUser.phone);
        setBizAddress(app.businessAddress || '');
        setState(app.state || 'Lagos');
        setLga(app.lga || 'Lagos Island');
        setCategory(app.category || 'Fashion & Ankara');
        setDescription(app.businessDescription || '');
        setCacNumber(app.cacNumber || '');
        setTinNumber(app.tinNumber || '');
        setIdType(app.idType || 'NIN National Identity Number');
        setIdDocumentUrl(app.idDocumentUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');
        setCacCertificateUrl(app.cacCertificateUrl || 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600');
        setBankName(app.bankName || 'Zenith Bank');
        setAccountNumber(app.accountNumber || '');
        setAccountName(app.accountName || '');
      }
    });

    return () => {
      unsubOrders();
      unsubReqs();
      unsubApp();
    };
  }, [currentUser]);

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

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelReason) return;

    try {
      await db.cancelOrder(cancelModalOrder.id, cancelModalOrder.ticketId, cancelReason, 'customer', currentUser.id);
      setCancelModalOrder(null);
      setCancelReason('');
      refreshUserData();
      setSuccessAlert('Order cancellation requested. Inventory has been restored.');
      setTimeout(() => setSuccessAlert(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleQuotationDecision = async (
    requestId: string,
    decision: 'accepted' | 'declined'
  ) => {
    try {
      await db.respondToQuotation(requestId, decision, currentUser.id);
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

  const handleVendorApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError(null);
    setIsSubmittingApp(true);

    if (!bizName || !legalName || !phone || !bizAddress || !bankName || !accountNumber || !accountName) {
      setAppError('Please fill in all required shop, identity, and payout fields.');
      setIsSubmittingApp(false);
      return;
    }

    if (accountNumber.trim().length !== 10 || !/^\d+$/.test(accountNumber.trim())) {
      setAppError('Nigerian bank NUBAN account numbers must be exactly 10 digits.');
      setIsSubmittingApp(false);
      return;
    }

    try {
      await db.submitVendorApplication(
        {
          businessName: bizName.trim(),
          legalName: legalName.trim(),
          phone: phone.trim(),
          businessAddress: bizAddress.trim(),
          state,
          lga,
          category,
          businessDescription: description.trim() || 'Verified Nigerian Merchant on JAGA',
          cacNumber: cacNumber.trim(),
          tinNumber: tinNumber.trim(),
          idType,
          idDocumentUrl,
          cacCertificateUrl,
          bankName,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim()
        },
        currentUser.id
      );

      setIsSubmittingApp(false);
      setSuccessAlert('Vendor application submitted successfully to Cloud Firestore! Our compliance team will review your credentials.');
      setTimeout(() => setSuccessAlert(null), 4500);
    } catch (err: any) {
      setIsSubmittingApp(false);
      setAppError(err.message || 'Failed to submit vendor application.');
    }
  };

  const currentStatus = vendorApp?.status || 'not_applied';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Customer Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{currentUser.fullName}</h2>
              {isApprovedVendor && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Vendor
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.email} · {currentUser.phone}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              📍 Primary Area: {currentUser.address?.street || 'Lagos'}, {currentUser.address?.city || 'Lagos'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Vendor Switcher if approved */}
          {isApprovedVendor && (
            <button
              onClick={() => {
                setActivePortal('vendor');
                onNavigateToVendor?.();
              }}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Go to Vendor Dashboard</span>
            </button>
          )}

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
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successAlert}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
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
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
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
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'addresses'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Delivery Details</span>
        </button>

        <button
          onClick={() => setActiveTab('become-vendor')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'become-vendor'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Become a Vendor</span>
          {vendorApp?.status === 'pending' && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          {vendorApp?.status === 'approved' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
          {vendorApp?.status === 'needs_changes' && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
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

                  {order.scheduledDeliveryDate && (
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-700" />
                        <span>
                          Dispatched via <strong>{order.deliveryCourier}</strong>. Expected delivery: <strong>{order.scheduledDeliveryDate}</strong>
                        </span>
                      </div>
                      {order.trackingNumber && (
                        <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-300">
                          {order.trackingNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Line Items */}
                  <div className="divide-y divide-slate-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{item.productName}</p>
                            <p className="text-[11px] text-slate-500">
                              Qty: {item.quantity} · ₦{item.unitPrice.toLocaleString()} each
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          ₦{(item.quantity * item.unitPrice).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Total (incl. delivery): </span>
                      <span className="font-black text-slate-900 text-sm">
                        ₦{order.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAwaitingPayment && (
                        <button
                          onClick={() => setSelectedOrderForPayment(order)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition"
                        >
                          {order.paymentStatus === 'payment_claimed' ? 'Update Transfer Evidence' : 'Pay via Bank Transfer'}
                        </button>
                      )}

                      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                        <button
                          onClick={() => setCancelModalOrder(order)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-slate-500 transition font-medium"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Sourcing Requests Active</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Can't find what you need in Nigerian markets? Request any rare or bespoke item and our team will quote you with delivery.
              </p>
              <button
                onClick={onOpenRequestModal}
                className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Create Sourcing Request
              </button>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-900">
                    Request ID: {req.requestId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{req.productName}</h4>
                  <p className="text-slate-600 mt-1">{req.description}</p>
                </div>

                {req.quotation && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950">Official JAGA Quotation</span>
                      <span className="font-black text-emerald-900 text-sm">
                        ₦{req.quotation.quotedPriceNgn.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{req.quotation.sourcingNotes}</p>
                    <p className="text-slate-500 text-[10px]">
                      Estimated delivery: {req.quotation.estimatedDeliveryDays} days to {req.deliveryState}
                    </p>

                    {!req.customerDecision && (
                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          onClick={() => handleQuotationDecision(req.id, 'declined')}
                          className="px-3 py-1 bg-white border border-slate-300 text-slate-600 rounded-lg font-bold"
                        >
                          Decline Quote
                        </button>
                        <button
                          onClick={() => handleQuotationDecision(req.id, 'accepted')}
                          className="px-4 py-1 bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
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

      {/* TAB 4: BECOME A VENDOR / KYC */}
      {activeTab === 'become-vendor' && (
        <div className="space-y-6">
          {/* Status Tracker Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Merchant Onboarding Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  CBN & CAC compliance verification lifecycle
                </p>
              </div>

              <div>
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    currentStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : currentStatus === 'pending'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : currentStatus === 'needs_changes'
                      ? 'bg-orange-100 text-orange-900 border border-orange-300'
                      : currentStatus === 'suspended'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : currentStatus === 'rejected'
                      ? 'bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  Status: {currentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* APPROVED STATE */}
            {currentStatus === 'approved' && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <h4 className="font-bold text-sm">Congratulations! Your Merchant Account is Verified.</h4>
                </div>
                <p className="text-xs leading-relaxed text-emerald-900">
                  Your store <strong>{vendorApp?.businessName}</strong> is verified to list products, accept direct escrow orders, and receive payouts to <strong>{vendorApp?.bankName} ({vendorApp?.accountNumber})</strong>.
                </p>
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-slate-700">
                  💡 <strong>Dual Account Privileges:</strong> As an approved vendor, you retain full customer access. You can shop, place orders, and switch to your Vendor Dashboard anytime using the toggle above or in your profile menu.
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActivePortal('vendor');
                      onNavigateToVendor?.();
                    }}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-amber-300" />
                    <span>Launch Vendor Merchant Dashboard</span>
                  </button>
                </div>
              </div>
            )}

            {/* PENDING STATE */}
            {currentStatus === 'pending' && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                  <h4 className="font-bold text-sm">Application Under Compliance Review</h4>
                </div>
                <p className="text-xs leading-relaxed text-amber-900">
                  Thank you for applying to sell on JAGA! Our administrative verification team is actively reviewing your CAC credentials, identity verification documents, and payout bank details.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Proposed Shop</span>
                    <span className="font-bold text-slate-900">{vendorApp?.businessName}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-bold text-slate-900">{vendorApp?.category}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payout Destination</span>
                    <span className="font-bold text-slate-900">{vendorApp?.bankName}</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800">
                  🛡️ <strong>Safety Guarantee:</strong> Your customer privileges remain fully functional while your merchant review is in progress. You can continue browsing and purchasing without interruption.
                </p>
              </div>
            )}

            {/* NEEDS CHANGES STATE */}
            {currentStatus === 'needs_changes' && (
              <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-700 shrink-0" />
                  <h4 className="font-bold text-sm">Additional Information Required by Administrator</h4>
                </div>
                <div className="p-3 bg-white rounded-xl border border-orange-200 text-xs">
                  <span className="font-bold text-orange-900 block mb-1">Administrator Review Notes:</span>
                  <p className="text-slate-800">{vendorApp?.adminNotes || 'Please provide updated documentation or verified payout details below.'}</p>
                </div>
                <p className="text-xs text-orange-900">
                  Please adjust the requested details in the form below and click <strong>"Re-Submit Application"</strong>.
                </p>
              </div>
            )}

            {/* REJECTED STATE */}
            {currentStatus === 'rejected' && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
                  <h4 className="font-bold text-sm">Vendor Application Not Approved</h4>
                </div>
                <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs">
                  <span className="font-bold text-rose-900 block mb-1">Review Decision Reason:</span>
                  <p className="text-slate-800">{vendorApp?.adminNotes || 'The provided business or identity documents did not meet marketplace onboarding criteria.'}</p>
                </div>
                <p className="text-xs text-rose-900">
                  Your customer account remains in good standing. You can re-apply below with accurate documentation if you wish to be reconsidered.
                </p>
              </div>
            )}

            {/* SUSPENDED STATE */}
            {currentStatus === 'suspended' && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
                  <h4 className="font-bold text-sm">Merchant Store Suspended</h4>
                </div>
                <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs">
                  <span className="font-bold text-rose-900 block mb-1">Suspension Reason:</span>
                  <p className="text-slate-800">{vendorApp?.adminNotes || 'Merchant operations paused by compliance administration.'}</p>
                </div>
                <p className="text-xs text-rose-900">
                  Your merchant listings and selling tools are currently locked. Your customer purchasing features remain fully active for marketplace shopping.
                </p>
              </div>
            )}
          </div>

          {/* APPLICATION FORM (Visible if not_applied, needs_changes, or rejected) */}
          {(currentStatus === 'not_applied' || currentStatus === 'needs_changes' || currentStatus === 'rejected') && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {currentStatus === 'needs_changes' ? 'Update Vendor Application' : 'Vendor Onboarding Application'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete the verification requirements to unlock your vendor shop on JAGA
                </p>
              </div>

              {/* Security & KYC Explanation Banner */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Why is Sensitive Information Required?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-900/90">
                  Under <strong>Central Bank of Nigeria (CBN)</strong> payment guidelines and <strong>Corporate Affairs Commission (CAC)</strong> compliance, marketplace merchants must be verified prior to receiving escrow payouts.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block">🔒 Isolated Security Architecture:</span>
                    <span>KYC credentials and payout bank details are stored strictly in private, protected Firestore subcollections. They are never exposed publicly or to other merchants.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block">💼 Guaranteed Escrow Payouts:</span>
                    <span>Your payout bank account is verified to guarantee that funds from fulfilled customer orders are safely deposited into your official account without delay.</span>
                  </div>
                </div>
              </div>

              {appError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{appError}</span>
                </div>
              )}

              <form onSubmit={handleVendorApplicationSubmit} className="space-y-4 text-xs">
                {/* 1. Identity & Contact */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
                    1. Merchant Legal Identity & Contact
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Legal Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chinedu Eze"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+234 803 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Business Details */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
                    2. Business & Shop Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Business / Store Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alaba Tech & Gadgets Ltd"
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Primary Product Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                      >
                        <option value="Fashion & Ankara">Fashion & Ankara</option>
                        <option value="Phones & Gadgets">Phones & Gadgets</option>
                        <option value="Electronics & Solar">Electronics & Solar</option>
                        <option value="Groceries & Foodstuff">Groceries & Foodstuff</option>
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Automobiles & Spares">Automobiles & Spares</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Operating State *
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja (FCT)">Abuja (FCT)</option>
                        <option value="Rivers">Rivers</option>
                        <option value="Kano">Kano</option>
                        <option value="Oyo">Oyo</option>
                        <option value="Anambra">Anambra</option>
                        <option value="Enugu">Enugu</option>
                        <option value="Delta">Delta</option>
                        <option value="Kaduna">Kaduna</option>
                        <option value="Ogun">Ogun</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Local Government Area (LGA)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ikeja, Alaba, Ojo"
                        value={lga}
                        onChange={(e) => setLga(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Physical Shop / Warehouse Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Suite 4B, Electronic Plaza, Alaba International Market, Ojo"
                      value={bizAddress}
                      onChange={(e) => setBizAddress(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Business Description & Specialty
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe the goods you sell, warranty terms, and your warehousing location..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* 3. CAC & Identity Verification */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
                    3. Business Registration & KYC Verification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        CAC Registration Number (RC / BN)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RC-1849204 or BN-938201"
                        value={cacNumber}
                        onChange={(e) => setCacNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tax Identification Number (TIN)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 23849102-0001"
                        value={tinNumber}
                        onChange={(e) => setTinNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Identity Verification Document *
                      </label>
                      <select
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="NIN National Identity Number">NIN National Identity Number</option>
                        <option value="Voter's Card (INEC PVC)">Voter's Card (INEC PVC)</option>
                        <option value="Federal Road Safety Driver's License">FRSC Driver's License</option>
                        <option value="Nigerian International Passport">Nigerian International Passport</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        KYC Document URL / Upload Reference
                      </label>
                      <input
                        type="text"
                        value={idDocumentUrl}
                        onChange={(e) => setIdDocumentUrl(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-600 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Bank Payout Details */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-700" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
                      4. Payout Bank Account Details
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    This verified account receives direct payouts when orders are successfully delivered to customers.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bank Name *
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="Zenith Bank">Zenith Bank</option>
                        <option value="Access Bank">Access Bank</option>
                        <option value="Guaranty Trust Bank (GTBank)">GTBank</option>
                        <option value="First Bank of Nigeria">First Bank</option>
                        <option value="United Bank for Africa (UBA)">UBA</option>
                        <option value="Kuda Microfinance Bank">Kuda Bank</option>
                        <option value="Moniepoint MFB">Moniepoint</option>
                        <option value="Stanbic IBTC Bank">Stanbic IBTC</option>
                        <option value="Fidelity Bank">Fidelity Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        NUBAN Account Number (10 Digits) *
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="0123456789"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Account Beneficiary Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alaba Tech Ltd or Chinedu Eze"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    By submitting, you agree to the JAGA Vendor Escrow & Quality Standards.
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmittingApp}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    {isSubmittingApp
                      ? 'Submitting to Firestore...'
                      : currentStatus === 'needs_changes'
                      ? 'Re-Submit Application'
                      : 'Submit Vendor Application'}
                  </button>
                </div>
              </form>
            </div>
          )}
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
