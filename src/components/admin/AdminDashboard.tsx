import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  VendorProfile,
  Product,
  Order,
  VendorSubOrder,
  ProductSourcingRequest,
  BankSettings,
  KycStatus,
  VendorApplication,
  VendorApplicationStatus
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
  RotateCcw,
  Building2,
  Landmark,
  Clock,
  AlertCircle,
  Check,
  Eye
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'applications' | 'payments' | 'vendors' | 'products' | 'orders' | 'delivery' | 'sourcing' | 'settings' | 'audit'
  >('overview');

  const [searchTicket, setSearchTicket] = useState('');
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Vendor Applications State
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'needs_changes' | 'approved' | 'rejected' | 'suspended'>('pending');
  const [reviewAppModal, setReviewAppModal] = useState<{
    app: VendorApplication;
    action: VendorApplicationStatus;
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

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

  const [bankSettings, setBankSettings] = useState<BankSettings>(db.getBankSettings());
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subOrders, setSubOrders] = useState<VendorSubOrder[]>([]);
  const [sourcingRequests, setSourcingRequests] = useState<ProductSourcingRequest[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const unsubApps = db.subscribeAllVendorApplications((apps) => setApplications(apps));
    const unsubV = db.subscribeVendors((v) => setVendors(v));
    const unsubP = db.subscribeProducts((p) => setProducts(p));
    const unsubO = db.subscribeOrders(currentUser.id, 'admin', (o) => setOrders(o));
    const unsubS = db.subscribeSubOrders(currentUser.id, 'admin', (s) => setSubOrders(s));
    const unsubR = db.subscribeSourcingRequests(currentUser.id, 'admin', (r) => setSourcingRequests(r));
    const unsubB = db.subscribeBankSettings((b) => setBankSettings(b));

    return () => {
      unsubApps();
      unsubV();
      unsubP();
      unsubO();
      unsubS();
      unsubR();
      unsubB();
    };
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">Restricted Administrator Area</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You must be authenticated with verified administrative credentials (e.g. sadiqmuhammadibrahim1436@gmail.com) to access platform controls.
        </p>
      </div>
    );
  }

  // Application counts
  const pendingApps = applications.filter((a) => a.status === 'pending');
  const needsChangesApps = applications.filter((a) => a.status === 'needs_changes');
  const approvedApps = applications.filter((a) => a.status === 'approved');
  const suspendedApps = applications.filter((a) => a.status === 'suspended');
  const rejectedApps = applications.filter((a) => a.status === 'rejected');

  // Overview KPIs
  const pendingPayments = orders.filter((o) => o.paymentStatus === 'payment_claimed');
  const confirmedOrders = orders.filter((o) => o.paymentStatus === 'confirmed');
  const totalConfirmedRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

  // Review Application Action
  const handleProcessApplicationReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppModal) return;

    try {
      await db.reviewVendorApplication(
        reviewAppModal.app.id,
        reviewAppModal.action,
        reviewNotes || (reviewAppModal.action === 'approved' ? 'Compliance verified. CAC & Bank payout approved.' : 'Application decision updated.'),
        currentUser.id,
        currentUser.email,
        currentUser.fullName
      );

      const decisionName = reviewAppModal.action.toUpperCase();
      const shopName = reviewAppModal.app.businessName;
      setReviewAppModal(null);
      setReviewNotes('');
      refreshUserData();
      setAlertSuccess(`Vendor application for "${shopName}" marked as ${decisionName}. Changes committed to Cloud Firestore.`);
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to review application.');
    }
  };

  // Payment Verification Action
  const handleProcessPaymentVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPaymentModal) return;

    try {
      await db.verifyPaymentClaim(
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
  const handleSaveDeliverySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDeliveryModal) return;

    try {
      await db.updateDeliverySchedule(
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
  const handleSendSourcingQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcingQuoteModal || !quotePrice) return;

    try {
      await db.addQuotationToRequest(
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

  const filteredApplications = applications.filter((app) => {
    if (appStatusFilter === 'all') return true;
    return app.status === appStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Super Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-white">JAGA Marketplace Super Admin Console</h2>
          </div>
          <p className="text-xs text-rose-200 mt-1">
            Administrator: <strong>{currentUser.fullName}</strong> ({currentUser.email}) · Verified Firebase Security Authorization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isSeeding}
            onClick={async () => {
              if (confirm('Initialize / Seed authentic Nigerian catalog (Alaba, Balogun, Kano) directly into Cloud Firestore?')) {
                setIsSeeding(true);
                try {
                  const res = await db.seedInitialCatalogToFirestore();
                  setAlertSuccess(res.message);
                } catch (err: any) {
                  alert(err.message || 'Failed to seed Firestore catalog.');
                } finally {
                  setIsSeeding(false);
                }
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md border border-emerald-400 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Writing to Firestore...' : 'Seed Catalog to Firestore'}</span>
          </button>
        </div>
      </div>

      {alertSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: Shield },
          { id: 'applications', label: `Vendor Applications (${pendingApps.length})`, icon: Building2, alert: pendingApps.length > 0 },
          { id: 'payments', label: `Payment Queue (${pendingPayments.length})`, icon: CreditCard, alert: pendingPayments.length > 0 },
          { id: 'vendors', label: `Active Merchants (${vendors.length})`, icon: Users },
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'delivery', label: 'Delivery Scheduling', icon: Truck },
          { id: 'sourcing', label: `Product Requests (${sourcingRequests.length})`, icon: Sparkles },
          { id: 'settings', label: 'Bank Settings', icon: Settings }
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
              <span className="text-[11px] text-slate-500 font-medium">Pending Vendor Applications</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{pendingApps.length}</p>
              <span className="text-[10px] text-rose-700 font-semibold">{needsChangesApps.length} changes requested</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Pending Bank Claims</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingPayments.length}</p>
              <span className="text-[10px] text-amber-700 font-semibold">Requires statement check</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Confirmed Revenue</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">
                ₦{totalConfirmedRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">{confirmedOrders.length} confirmed orders</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Marketplace Products</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{products.length}</p>
              <span className="text-[10px] text-slate-400">Across {vendors.length} approved merchants</span>
            </div>
          </div>

          {/* Pending Applications prompt */}
          {pendingApps.length > 0 && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-rose-700 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {pendingApps.length} Customer Vendor Application(s) Awaiting Review
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Latest applicant: "{pendingApps[0].businessName}" ({pendingApps[0].legalName}). Unapproved applicants cannot publish products.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('applications')}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
              >
                Review Vendor Applications →
              </button>
            </div>
          )}

          {/* Payment Claims prompt */}
          {pendingPayments.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-amber-700 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {pendingPayments.length} Payment Claim(s) Awaiting Bank Statement Check
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Confirm payment references to notify vendors to dispatch orders.
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
        </div>
      )}

      {/* TAB 2: VENDOR APPLICATIONS REVIEW (REQUIREMENT 4) */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-base">Vendor Onboarding & KYC Applications</h3>
              <p className="text-slate-500 mt-0.5">
                Review submitted legal credentials, CAC certificates, and payout bank accounts. Server-side authorized decisions.
              </p>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: `All (${applications.length})` },
                { id: 'pending', label: `Pending (${pendingApps.length})` },
                { id: 'needs_changes', label: `Needs Changes (${needsChangesApps.length})` },
                { id: 'approved', label: `Approved (${approvedApps.length})` },
                { id: 'suspended', label: `Suspended (${suspendedApps.length})` },
                { id: 'rejected', label: `Rejected (${rejectedApps.length})` }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setAppStatusFilter(btn.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    appStatusFilter === btn.id
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No vendor applications matching filter "{appStatusFilter}".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const isApproved = app.status === 'approved';
                const isPending = app.status === 'pending';
                const isNeedsChanges = app.status === 'needs_changes';
                const isSuspended = app.status === 'suspended';

                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
                  >
                    {/* Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{app.businessName}</h4>
                          <span className="text-slate-500 font-medium">({app.legalName})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          📞 {app.phone} · Category: <strong className="text-slate-700">{app.category}</strong> · 📍 {app.businessAddress}, {app.state}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isNeedsChanges
                              ? 'bg-orange-100 text-orange-900 border border-orange-300'
                              : isSuspended
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Core Credential Data Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">CAC Registration (RC/BN)</span>
                        <span className="font-mono font-bold text-slate-900">{app.cacNumber || 'Unregistered / Sole Trader'}</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Tax Number (TIN)</span>
                        <span className="font-mono font-bold text-slate-900">{app.tinNumber || 'N/A'}</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted Date</span>
                        <span className="font-bold text-slate-900">{new Date(app.submittedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Identity Document Type</span>
                        <span className="font-bold text-slate-900">{app.idType}</span>
                      </div>
                    </div>

                    {/* Isolated Payout Bank Account Details (Requirement 2 & 4) */}
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Protected Vendor Payout Bank Account</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500 block">Bank Name:</span>
                          <strong className="text-slate-900">{app.bankName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">NUBAN Account Number:</span>
                          <strong className="font-mono text-emerald-900">{app.accountNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Account Beneficiary:</span>
                          <strong className="text-slate-900">{app.accountName}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Business Description */}
                    {app.businessDescription && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong>Store Profile:</strong> {app.businessDescription}
                      </p>
                    )}

                    {/* Decision Notes & History if present */}
                    {app.adminNotes && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950">
                        <span className="font-bold text-amber-900 block mb-0.5">Admin Decision Notes:</span>
                        <p>{app.adminNotes}</p>
                        {app.reviewedByAdminEmail && (
                          <span className="block text-[10px] text-amber-700 mt-1">
                            Reviewed by: {app.reviewedByAdminEmail} at {new Date(app.reviewedAt || app.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Document Previews */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <span>Identity Verification ({app.idType})</span>
                          <a
                            href={app.idDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline flex items-center gap-1 text-[10px]"
                          >
                            <span>Open URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <img
                          src={app.idDocumentUrl}
                          alt="ID Document"
                          className="w-full h-32 object-cover rounded-lg bg-slate-200 border border-slate-200"
                        />
                      </div>

                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <span>CAC Document / Business Proof</span>
                          {app.cacCertificateUrl && (
                            <a
                              href={app.cacCertificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1 text-[10px]"
                            >
                              <span>Open URL</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <img
                          src={app.cacCertificateUrl || 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600'}
                          alt="CAC Certificate"
                          className="w-full h-32 object-cover rounded-lg bg-slate-200 border border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Action Decision Buttons (Server-Side Verified) */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                      {/* Action: Approve */}
                      {!isApproved && (
                        <button
                          onClick={() => {
                            setReviewAppModal({ app, action: 'approved' });
                            setReviewNotes('Approved by compliance administration after CAC and bank account verification.');
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Approve Vendor</span>
                        </button>
                      )}

                      {/* Action: Request Changes */}
                      {!isNeedsChanges && (
                        <button
                          onClick={() => {
                            setReviewAppModal({ app, action: 'needs_changes' });
                            setReviewNotes('Please re-upload a clearer image of your government ID or provide registered CAC certificate.');
                          }}
                          className="px-3.5 py-2 border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-900 rounded-xl font-bold transition flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-orange-700" />
                          <span>Request Changes</span>
                        </button>
                      )}

                      {/* Action: Reject */}
                      {!isApproved && app.status !== 'rejected' && (
                        <button
                          onClick={() => {
                            setReviewAppModal({ app, action: 'rejected' });
                            setReviewNotes('Application does not meet current marketplace onboarding requirements.');
                          }}
                          className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition"
                        >
                          Reject Application
                        </button>
                      )}

                      {/* Action: Suspend (for approved vendors) */}
                      {isApproved && (
                        <button
                          onClick={() => {
                            setReviewAppModal({ app, action: 'suspended' });
                            setReviewNotes('Vendor access temporarily suspended due to compliance investigation.');
                          }}
                          className="px-3.5 py-2 bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-800 rounded-xl font-bold transition flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Suspend Vendor Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS QUEUE */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Payment Claims Verification Queue</h3>
            <p className="text-slate-500">
              Cross-check the Zenith Bank statement. Confirming alerts customers and enables vendor dispatch.
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

                      {order.paymentStatus !== 'confirmed' && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => setVerifyPaymentModal({ order, decision: 'rejected' })}
                            className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold"
                          >
                            Reject Claim
                          </button>
                          <button
                            onClick={() => setVerifyPaymentModal({ order, decision: 'confirmed' })}
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

      {/* TAB 4: ACTIVE MERCHANTS */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Verified Marketplace Merchants</h3>
            <p className="text-slate-500">
              List of established stores selling products on the live JAGA marketplace catalog.
            </p>
          </div>

          <div className="space-y-3">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{vendor.businessName}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Owner: {vendor.ownerName} · {vendor.email} · {vendor.phone} · Category: {vendor.category}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    📍 {vendor.businessAddress}, {vendor.state}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    vendor.kycStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {vendor.kycStatus}
                  </span>
                  <span className="text-slate-400 text-[11px]">★ {vendor.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Marketplace Products Catalog</h3>
            <p className="text-slate-500">
              All live and catalog products stored in Cloud Firestore.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((product) => (
              <div key={product.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-900 truncate">{product.name}</p>
                  <p className="text-emerald-800 font-bold">₦{product.price.toLocaleString()}</p>
                  <p className="text-slate-500 text-[11px]">Vendor: {product.vendorBusinessName}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-800">
                    {product.status} · Stock: {product.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Customer Orders</h3>
            <p className="text-slate-500">
              All orders placed in the system with unique ticket IDs.
            </p>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{order.ticketId}</span>
                  <span className="font-bold text-slate-800">₦{order.total.toLocaleString()}</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Customer: {order.customerName} ({order.customerPhone}) · State: {order.deliveryAddress.state}
                </p>
                <div className="flex gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Payment: {order.paymentStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    Delivery: {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DELIVERY SCHEDULING */}
      {activeTab === 'delivery' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Delivery Scheduling</h3>
            <p className="text-slate-500">
              Assign courier partners and delivery dates to confirmed orders.
            </p>
          </div>

          <div className="space-y-3">
            {orders
              .filter((o) => o.paymentStatus === 'confirmed')
              .map((order) => (
                <div key={order.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{order.ticketId}</span>
                    <p className="text-slate-500 text-[11px]">Destination: {order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                    {order.scheduledDeliveryDate && (
                      <span className="text-emerald-700 font-bold text-[11px]">
                        Scheduled: {order.scheduledDeliveryDate} via {order.deliveryCourier}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setScheduleDeliveryModal(order)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                  >
                    Set Schedule
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 8: SOURCING REQUESTS */}
      {activeTab === 'sourcing' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Product Sourcing Requests</h3>
            <p className="text-slate-500">
              Requests submitted by customers for unavailable or rare items.
            </p>
          </div>

          <div className="space-y-3">
            {sourcingRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{req.productName}</span>
                  <span className="font-mono text-slate-500">{req.requestId}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{req.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px]">From: {req.customerName} ({req.customerPhone})</span>
                  {!req.quotation && (
                    <button
                      onClick={() => setSourcingQuoteModal(req)}
                      className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg shadow-xs"
                    >
                      Provide Quotation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 text-xs max-w-lg">
          <h3 className="font-bold text-slate-900 text-base">Escrow Bank Transfer Settings</h3>
          <p className="text-slate-500">
            Customers transfer funds to this official account during checkout.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div>
              <span className="text-slate-400 block text-[10px]">Bank:</span>
              <strong className="text-slate-900">{bankSettings.bankName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Account Name:</span>
              <strong className="text-slate-900">{bankSettings.accountName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Account Number:</span>
              <strong className="text-slate-900 font-mono">{bankSettings.accountNumber}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Application Review Decision Modal */}
      {reviewAppModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Confirm Vendor Application Review
              </h4>
              <button
                onClick={() => setReviewAppModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p><strong>Merchant:</strong> {reviewAppModal.app.businessName} ({reviewAppModal.app.legalName})</p>
              <p><strong>Decision:</strong> <span className="uppercase font-bold text-rose-700">{reviewAppModal.action}</span></p>
              <p><strong>Reviewing Admin UID:</strong> <code className="text-slate-600">{currentUser.id}</code></p>
            </div>

            <form onSubmit={handleProcessApplicationReview} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Administrator Review Notes / Rationale *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter detailed audit rationale, instructions for requested changes, or reason for suspension..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-rose-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewAppModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm & Write to Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Verification Modal */}
      {verifyPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Confirm Payment Verification ({verifyPaymentModal.order.ticketId})
            </h4>
            <form onSubmit={handleProcessPaymentVerification} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Audit Note</label>
                <input
                  type="text"
                  placeholder="e.g. Verified on Zenith statement ref: REF829402"
                  value={adminVerifierNote}
                  onChange={(e) => setAdminVerifierNote(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
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
                  Confirm
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

      {/* Sourcing Quote Modal */}
      {sourcingQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Provide Quotation for {sourcingQuoteModal.productName}
            </h4>
            <form onSubmit={handleSendSourcingQuote} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Quoted Price (₦)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 85000"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Estimated Days</label>
                <input
                  type="number"
                  required
                  value={quoteDays}
                  onChange={(e) => setQuoteDays(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Sourcing Notes</label>
                <textarea
                  rows={2}
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
                  Send Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
