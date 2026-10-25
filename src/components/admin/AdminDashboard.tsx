import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  VendorProfile,
  Product,
  Order,
  ProductSourcingRequest,
  BankSettings,
  KycStatus
} from '../../types';
import {
  Shield,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  Truck,
  Sparkles,
  Settings,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vendors' | 'products' | 'orders' | 'payments' | 'delivery' | 'sourcing' | 'settings' | 'audit'
  >('overview');

  const [searchTicket, setSearchTicket] = useState('');
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Reject / Reason Modal states
  const [rejectVendorModal, setRejectVendorModal] = useState<VendorProfile | null>(null);
  const [rejectVendorReason, setRejectVendorReason] = useState('');

  // Payment Verification Modal
  const [verifyPaymentModal, setVerifyPaymentModal] = useState<{
    order: Order;
    decision: 'confirmed' | 'rejected';
  } | null>(null);
  const [adminVerifierNote, setAdminVerifierNote] = useState('');

  // Delivery schedule modal
  const [scheduleDeliveryModal, setScheduleDeliveryModal] = useState<Order | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('2026-10-28');
  const [courierPartner, setCourierPartner] = useState('GIG Logistics (Express)');
  const [trackingNumber, setTrackingNumber] = useState(`GIG-NG-${Date.now().toString().slice(-6)}`);

  // Sourcing Quote modal
  const [sourcingQuoteModal, setSourcingQuoteModal] = useState<ProductSourcingRequest | null>(null);
  const [quotePrice, setQuotePrice] = useState<number | ''>('');
  const [quoteDays, setQuoteDays] = useState(3);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Bank Settings Form
  const [bankSettings, setBankSettings] = useState<BankSettings>(db.getBankSettings());

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">Restricted Administrator Area</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You must be authenticated with administrative credentials to access platform controls.
        </p>
      </div>
    );
  }

  const vendors = db.getVendors();
  const products = db.getProducts();
  const orders = db.getOrders();
  const subOrders = db.getSubOrders();
  const sourcingRequests = db.getSourcingRequests();
  const auditLogs = db.getAuditLogs();

  // Overview KPIs
  const pendingVendors = vendors.filter((v) => v.kycStatus === 'pending');
  const pendingPayments = orders.filter((o) => o.paymentStatus === 'payment_claimed');
  const confirmedOrders = orders.filter((o) => o.paymentStatus === 'confirmed');
  const totalConfirmedRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

  // Vendor KYC Actions
  const handleApproveVendor = (vendor: VendorProfile) => {
    try {
      db.updateVendorKycStatus(vendor.id, 'approved', undefined, currentUser.fullName);
      refreshUserData();
      setAlertSuccess(`Vendor "${vendor.businessName}" has been approved. They can now publish live products.`);
      setTimeout(() => setAlertSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectVendorModal) return;
    try {
      db.updateVendorKycStatus(rejectVendorModal.id, 'rejected', rejectVendorReason, currentUser.fullName);
      setRejectVendorModal(null);
      setRejectVendorReason('');
      refreshUserData();
      setAlertSuccess(`Vendor application updated to rejected.`);
      setTimeout(() => setAlertSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Payment Verification Action
  const handleProcessPaymentVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPaymentModal) return;

    try {
      db.verifyPaymentClaim(
        verifyPaymentModal.order.ticketId,
        verifyPaymentModal.decision,
        adminVerifierNote || (verifyPaymentModal.decision === 'confirmed' ? 'Verified against Zenith Bank statement credit.' : 'Bank transfer could not be verified.'),
        currentUser.fullName
      );
      setVerifyPaymentModal(null);
      setAdminVerifierNote('');
      refreshUserData();
      setAlertSuccess(`Payment claim for ticket ${verifyPaymentModal.order.ticketId} marked as ${verifyPaymentModal.decision.toUpperCase()}.`);
      setTimeout(() => setAlertSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delivery Scheduling Action
  const handleSaveDeliverySchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDeliveryModal) return;

    try {
      db.updateDeliverySchedule(
        scheduleDeliveryModal.ticketId,
        deliveryDate,
        courierPartner,
        trackingNumber,
        currentUser.fullName
      );
      setScheduleDeliveryModal(null);
      refreshUserData();
      setAlertSuccess(`Delivery scheduled for ticket ${scheduleDeliveryModal.ticketId}. Customer notified.`);
      setTimeout(() => setAlertSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Sourcing Quote Action
  const handleSendSourcingQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcingQuoteModal || !quotePrice) return;

    try {
      db.addQuotationToRequest(
        sourcingQuoteModal.requestId,
        {
          quotedPriceNgn: Number(quotePrice),
          estimatedDeliveryDays: Number(quoteDays),
          sourcingNotes: quoteNotes || 'Sourced directly from verified merchant with warranty.'
        },
        currentUser.fullName
      );
      setSourcingQuoteModal(null);
      setQuotePrice('');
      setQuoteNotes('');
      refreshUserData();
      setAlertSuccess(`Quotation sent to customer for request ${sourcingQuoteModal.requestId}.`);
      setTimeout(() => setAlertSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Bank Settings
  const handleSaveBankSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateBankSettings(bankSettings, currentUser.fullName);
    setAlertSuccess('Marketplace bank transfer settings updated.');
    setTimeout(() => setAlertSuccess(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Control Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-white">JAGA Marketplace Super Admin Console</h2>
          </div>
          <p className="text-xs text-rose-200 mt-1">
            Administrator: <strong>{currentUser.fullName}</strong> ({currentUser.email}) · Strict server-side RBAC enforced
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset entire database back to default demo records?')) {
                db.resetToDemo();
                refreshUserData();
                setAlertSuccess('Demo database re-seeded to initial state.');
              }
            }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {alertSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: Shield },
          { id: 'payments', label: `Payment Queue (${pendingPayments.length})`, icon: CreditCard, alert: pendingPayments.length > 0 },
          { id: 'vendors', label: `Vendor KYC (${pendingVendors.length})`, icon: Users, alert: pendingVendors.length > 0 },
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'delivery', label: 'Delivery Scheduling', icon: Truck },
          { id: 'sourcing', label: `Product Requests (${sourcingRequests.length})`, icon: Sparkles },
          { id: 'settings', label: 'Bank Settings', icon: Settings },
          { id: 'audit', label: 'Audit Trail', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'border-rose-600 text-rose-800 bg-rose-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Pending Bank Claims</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingPayments.length}</p>
              <span className="text-[10px] text-amber-700 font-semibold">Requires verification</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Pending Vendor KYCs</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{pendingVendors.length}</p>
              <span className="text-[10px] text-rose-700 font-semibold">Awaiting compliance</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Confirmed Revenue</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">
                ₦{totalConfirmedRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">{confirmedOrders.length} confirmed orders</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Total Products</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{products.length}</p>
              <span className="text-[10px] text-slate-400">From {vendors.length} vendors</span>
            </div>
          </div>

          {/* Critical action highlight: Payment verification queue prompt */}
          {pendingPayments.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-amber-700 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {pendingPayments.length} Payment Claim(s) Awaiting Admin Bank Statement Check
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Customers have submitted transfer references with Ticket IDs. Confirm them to alert vendors to dispatch.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
              >
                Review Payment Claims →
              </button>
            </div>
          )}

          {/* Pending KYC highlight */}
          {pendingVendors.length > 0 && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-rose-700 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {pendingVendors.length} New Vendor Application(s) Awaiting Review
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Merchants like "{pendingVendors[0].businessName}" cannot publish products until verified.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('vendors')}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
              >
                Review KYC Documents →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT CLAIMS VERIFICATION QUEUE (SECTION 8 OF SPEC) */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Payment Claims Verification Queue</h3>
            <p className="text-slate-500">
              Independently cross-check the Zenith Bank corporate statement. Confirming automatically alerts customers and notifies each vendor to begin order fulfillment.
            </p>
          </div>

          {orders.filter((o) => o.paymentClaim || o.paymentStatus === 'payment_claimed').length === 0 ? (
            <p className="py-12 text-center text-slate-400">No payment claims currently submitted.</p>
          ) : (
            <div className="space-y-3">
              {orders
                .filter((o) => o.paymentClaim || o.paymentStatus === 'payment_claimed')
                .map((order) => {
                  const claim = order.paymentClaim;

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {order.ticketId}
                          </span>
                          <span className="text-slate-500 text-[11px] ml-2">
                            Customer: <strong>{order.customerName}</strong> ({order.customerPhone})
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            order.paymentStatus === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {order.paymentStatus.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Claim Data Grid */}
                      {claim ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block">Bank Paid From</span>
                            <span className="font-bold text-slate-900">{claim.bankPaidFrom}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block">Sender Name</span>
                            <span className="font-bold text-slate-900">{claim.accountSenderName}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block">Transfer Reference</span>
                            <span className="font-mono font-bold text-slate-900 truncate block">
                              {claim.transactionReference}
                            </span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block">Claimed / Expected Amount</span>
                            <span className="font-black text-emerald-900">
                              ₦{claim.claimedAmount.toLocaleString()} / ₦{order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-amber-800 italic">No detailed claim form filled yet.</p>
                      )}

                      {/* Receipt Image if attached */}
                      {claim?.receiptImageUrl && (
                        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                          <img
                            src={claim.receiptImageUrl}
                            alt="Receipt"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                          />
                          <div className="text-[11px]">
                            <p className="font-semibold text-slate-800">Uploaded Transfer Receipt Evidence</p>
                            <span className="text-slate-400">Submitted {new Date(claim.submittedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      {/* Verification Controls */}
                      {order.paymentStatus !== 'confirmed' && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => {
                              setVerifyPaymentModal({ order, decision: 'rejected' });
                            }}
                            className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold"
                          >
                            Reject Claim
                          </button>
                          <button
                            onClick={() => {
                              setVerifyPaymentModal({ order, decision: 'confirmed' });
                            }}
                            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                          >
                            ✓ Confirm Bank Payment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VENDOR KYC APPROVALS */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Vendor KYC Compliance</h3>
            <p className="text-slate-500">
              Review registered Nigerian businesses, CAC certificates, and national IDs. Unapproved vendors cannot publish products.
            </p>
          </div>

          <div className="space-y-4">
            {vendors.map((vendor) => {
              const isApproved = vendor.kycStatus === 'approved';

              return (
                <div
                  key={vendor.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{vendor.businessName}</h4>
                        <span className="text-slate-400">({vendor.ownerName})</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {vendor.email} · {vendor.phone} · Category: {vendor.category} · {vendor.businessAddress}, {vendor.state}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : vendor.kycStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {vendor.kycStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">CAC Reg / RC</span>
                      <span className="font-bold text-slate-800">{vendor.cacNumber || 'N/A'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">TIN Number</span>
                      <span className="font-bold text-slate-800">{vendor.tinNumber || 'N/A'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Joined Date</span>
                      <span className="font-bold text-slate-800">{vendor.joinedDate}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Recorded Sales</span>
                      <span className="font-bold text-slate-800">{vendor.totalSales} items</span>
                    </div>
                  </div>

                  {/* Document previews */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <p className="font-semibold text-slate-700 text-[10px] mb-1">CAC Document Preview</p>
                      <img
                        src={vendor.kycDocuments.cacCertificateUrl}
                        alt="CAC Proof"
                        className="w-full h-28 object-cover rounded-lg bg-slate-200"
                      />
                    </div>
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <p className="font-semibold text-slate-700 text-[10px] mb-1">
                        Government ID ({vendor.kycDocuments.idType || 'NIN'})
                      </p>
                      <img
                        src={vendor.kycDocuments.governmentIdUrl}
                        alt="ID Proof"
                        className="w-full h-28 object-cover rounded-lg bg-slate-200"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    {vendor.kycStatus !== 'approved' && (
                      <button
                        onClick={() => handleApproveVendor(vendor)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        ✓ Approve Vendor Account
                      </button>
                    )}
                    {vendor.kycStatus !== 'rejected' && (
                      <button
                        onClick={() => setRejectVendorModal(vendor)}
                        className="px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl font-bold text-xs"
                      >
                        Reject / Request Changes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">All Platform Orders</h3>
              <p className="text-slate-500">
                Track parent orders and respective vendor suborders. Search by ticket ID.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Ticket ID (e.g. JAG-2026)..."
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                className="text-xs bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {orders
              .filter((o) =>
                searchTicket ? o.ticketId.toLowerCase().includes(searchTicket.toLowerCase()) : true
              )
              .map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {order.ticketId}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-2">
                        Customer: {order.customerName} ({order.deliveryAddress.state})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.paymentStatus === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        Payment: {order.paymentStatus}
                      </span>
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        Status: {order.orderStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>{order.items.length} item(s)</span>
                    <span className="font-black text-slate-900 text-sm">
                      Total: ₦{order.total.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions: Schedule delivery, cancel order */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setScheduleDeliveryModal(order)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                    >
                      Schedule Delivery Date
                    </button>
                    {order.orderStatus !== 'cancelled' && (
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for admin cancellation:');
                          if (reason) {
                            db.cancelOrder(order.ticketId, reason, 'admin', currentUser.id);
                            refreshUserData();
                            setAlertSuccess(`Order ticket ${order.ticketId} cancelled.`);
                          }
                        }}
                        className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: SOURCING REQUESTS */}
      {activeTab === 'sourcing' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Customer Sourcing Requests</h3>
            <p className="text-slate-500">
              Review custom requests, input vendor quotations, and send official pricing to customers.
            </p>
          </div>

          <div className="space-y-4">
            {sourcingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">{req.requestId}</span>
                    <span className="text-slate-500 text-[11px] ml-2">
                      Customer: {req.customerName} ({req.customerPhone})
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                    {req.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{req.productName}</h4>
                  <p className="text-slate-600">{req.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">Target Budget</span>
                    <span className="font-bold text-slate-800">
                      {req.expectedBudgetNgn ? `₦${req.expectedBudgetNgn.toLocaleString()}` : 'Negotiable'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">Quantity</span>
                    <span className="font-bold text-slate-800">{req.quantity} unit(s)</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">Delivery State</span>
                    <span className="font-bold text-slate-800">{req.deliveryState}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">Preferred Brand</span>
                    <span className="font-bold text-slate-800">{req.preferredBrand || 'Any'}</span>
                  </div>
                </div>

                {/* Quotation Status */}
                {req.quotation ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                    <p className="font-bold">
                      Quotation Provided: ₦{req.quotation.quotedPriceNgn.toLocaleString()} ({req.quotation.estimatedDeliveryDays} days)
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">{req.quotation.sourcingNotes}</p>
                  </div>
                ) : (
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSourcingQuoteModal(req)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs"
                    >
                      + Generate Sourcing Quotation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: BANK SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 text-xs max-w-2xl">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Marketplace Bank Transfer Settings</h3>
            <p className="text-slate-500">
              These details are presented to customers on their order confirmation and payment screen.
            </p>
          </div>

          <form onSubmit={handleSaveBankSettings} className="space-y-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankSettings.bankName}
                onChange={(e) => setBankSettings({ ...bankSettings, bankName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Corporate Account Name</label>
              <input
                type="text"
                required
                value={bankSettings.accountName}
                onChange={(e) => setBankSettings({ ...bankSettings, accountName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">NUBAN Account Number</label>
              <input
                type="text"
                required
                value={bankSettings.accountNumber}
                onChange={(e) => setBankSettings({ ...bankSettings, accountNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Instructions to Buyer</label>
              <textarea
                rows={3}
                required
                value={bankSettings.instructions}
                onChange={(e) => setBankSettings({ ...bankSettings, instructions: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
            >
              Save Bank Configuration
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Administrative Audit Trail</h3>
            <p className="text-slate-500">
              Immutable chronological record of administrative actions, KYC decisions, and payment confirmations.
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-600">{log.details}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">By: {log.adminName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Verify Payment */}
      {verifyPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Confirm or Reject Payment for Ticket {verifyPaymentModal.order.ticketId}
            </h4>
            <p className="text-slate-600">
              Decision: <strong className="uppercase text-emerald-800">{verifyPaymentModal.decision}</strong>.
              Enter verification notes for the customer and audit log.
            </p>
            <form onSubmit={handleProcessPaymentVerification} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. Credited Zenith Bank account on 24-Oct. Statement Ref matches."
                value={adminVerifierNote}
                onChange={(e) => setAdminVerifierNote(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyPaymentModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sourcing Quotation */}
      {sourcingQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Provide Quotation for Request {sourcingQuoteModal.requestId}
            </h4>
            <form onSubmit={handleSendSourcingQuote} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Quoted Price (₦ NGN) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 42000"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Estimated Delivery Days</label>
                <input
                  type="number"
                  required
                  value={quoteDays}
                  onChange={(e) => setQuoteDays(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Sourcing Notes & Origin</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Direct from verified importer in Alaba with 12 months Carlcare warranty."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSourcingQuoteModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg shadow-xs"
                >
                  Send Quotation to Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Delivery */}
      {scheduleDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Schedule Delivery for Ticket {scheduleDeliveryModal.ticketId}
            </h4>
            <form onSubmit={handleSaveDeliverySchedule} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Estimated Delivery Date</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Courier Partner</label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="GIG Logistics (Express)">GIG Logistics (Express)</option>
                  <option value="Kwik Delivery (Same-day)">Kwik Delivery (Same-day)</option>
                  <option value="Speedaf Express">Speedaf Express</option>
                  <option value="Fez Delivery">Fez Delivery</option>
                  <option value="Direct Merchant Dispatch">Direct Merchant Dispatch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleDeliveryModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Update Delivery Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
