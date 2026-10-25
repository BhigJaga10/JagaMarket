import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Product, VendorSubOrder, Order } from '../../types';
import { VendorProductUploadModal } from './VendorProductUploadModal';
import {
  Store,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit,
  EyeOff,
  Eye,
  Trash2,
  DollarSign,
  Truck,
  ArrowRight,
  ShieldAlert,
  FileText
} from 'lucide-react';

interface VendorDashboardProps {
  onOpenProductUpload: () => void;
  onSelectProductDetail: (product: Product) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  onSelectProductDetail
}) => {
  const { currentUser, currentVendorProfile, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'kyc'>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [cancelModalSubOrder, setCancelModalSubOrder] = useState<VendorSubOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'vendor' || !currentVendorProfile) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">Vendor Access Required</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please log in as an approved or registered merchant to manage your store, inventory, and suborders.
        </p>
      </div>
    );
  }

  const isApproved = currentVendorProfile.kycStatus === 'approved';
  const isPending = currentVendorProfile.kycStatus === 'pending';

  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendorSubOrders, setVendorSubOrders] = useState<VendorSubOrder[]>([]);

  React.useEffect(() => {
    if (!currentUser || !currentVendorProfile) return;

    const unsubProds = db.subscribeProducts((allProds) => {
      setVendorProducts(allProds.filter((p) => p.vendorId === currentVendorProfile.id));
    });

    const unsubSubs = db.subscribeSubOrders(currentUser.id, 'vendor', (subs) => {
      setVendorSubOrders(subs);
    });

    return () => {
      unsubProds();
      unsubSubs();
    };
  }, [currentUser, currentVendorProfile]);

  const subOrdersWithParent = vendorSubOrders.map((sub) => {
    return {
      sub,
      parent: undefined as Order | undefined
    };
  });

  // Overview metrics
  const publishedCount = vendorProducts.filter((p) => p.status === 'published').length;
  const totalStock = vendorProducts.reduce((sum, p) => sum + p.stock, 0);
  const paidOrdersCount = subOrdersWithParent.filter((item) => item.parent?.paymentStatus === 'confirmed').length;
  const pendingFulfillmentCount = vendorSubOrders.filter(
    (s) => s.vendorFulfillmentStatus === 'pending' || s.vendorFulfillmentStatus === 'accepted' || s.vendorFulfillmentStatus === 'preparing'
  ).length;

  const totalRecordedSales = subOrdersWithParent
    .filter((item) => item.parent?.paymentStatus === 'confirmed')
    .reduce((sum, item) => sum + item.sub.subtotal, 0);

  const handleToggleProductStatus = async (product: Product) => {
    try {
      const nextStatus = product.status === 'published' ? 'draft' : 'published';
      await db.updateProduct(product.id, { status: nextStatus }, currentUser.id);
      refreshUserData();
      setActionSuccess(`Product "${product.name}" status updated to ${nextStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product listing?')) {
      try {
        await db.deleteProduct(productId, currentUser.id);
        refreshUserData();
        setActionSuccess('Product deleted successfully.');
        setTimeout(() => setActionSuccess(null), 3000);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleUpdateFulfillment = async (
    subOrderId: string,
    status: VendorSubOrder['vendorFulfillmentStatus']
  ) => {
    try {
      await db.updateVendorSubOrderStatus(subOrderId, status, currentUser.id);
      refreshUserData();
      setActionSuccess(`Fulfillment status changed to "${status.replace('_', ' ')}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelSubOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalSubOrder || !cancelReason) return;
    try {
      // Vendor requests suborder cancellation with reason
      await db.cancelOrder(cancelModalSubOrder.orderTicketId, cancelReason, 'vendor', currentUser.id);
      setCancelModalSubOrder(null);
      setCancelReason('');
      refreshUserData();
      setActionSuccess('Cancellation processed. Inventory restored.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner & Shop Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-amber-300 font-black text-2xl flex items-center justify-center shadow-md">
            {currentVendorProfile.businessName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                {currentVendorProfile.businessName}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {currentVendorProfile.kycStatus === 'approved' ? '✓ Verified Merchant' : '⏳ Verification Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Owner: <strong>{currentVendorProfile.ownerName}</strong> · Category:{' '}
              {currentVendorProfile.category} · {currentVendorProfile.businessAddress},{' '}
              {currentVendorProfile.state}
            </p>
          </div>
        </div>

        {/* Action Button: Add Product */}
        <div>
          {isApproved ? (
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsUploadModalOpen(true);
              }}
              className="py-3 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Product</span>
            </button>
          ) : (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Admin verification required before uploading products</span>
            </div>
          )}
        </div>
      </div>

      {/* KYC Warning if pending */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm mb-0.5">Your Vendor KYC Application is Under Review</strong>
            Your CAC and identity documents have been submitted to the JAGA administrative queue. Once approved by our compliance team, you will be able to upload products and accept live customer orders.
            <div className="mt-2 text-[11px] text-amber-800">
              💡 <em>Testing Tip:</em> Switch to <strong>Admin</strong> in the top bar to approve this vendor account with 1 click!
            </div>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Products ({vendorProducts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Suborders ({vendorSubOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('kyc')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'kyc'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>KYC & Business Credentials</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Published Products</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{publishedCount}</p>
              <span className="text-[10px] text-emerald-700 font-semibold">Live on homepage</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Available Units</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalStock}</p>
              <span className="text-[10px] text-slate-400">Total variant stock</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Confirmed Paid Orders</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{paidOrdersCount}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Verified by admin</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Recorded Net Sales</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">
                ₦{totalRecordedSales.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">Confirmed transactions only</span>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {vendorProducts.some((p) => p.stock <= 5) && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5 uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Low Inventory Alerts (Restock Required)</span>
              </h4>
              <div className="space-y-1.5">
                {vendorProducts
                  .filter((p) => p.stock <= 5)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-amber-200"
                    >
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {p.stock === 0 ? 'Sold Out' : `${p.stock} units remaining`}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Orders Preview */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Recent Suborders to Fulfill ({pendingFulfillmentCount} pending)
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-emerald-700 hover:underline font-bold"
              >
                View all suborders →
              </button>
            </div>

            {subOrdersWithParent.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No orders have been placed for your products yet.
              </p>
            ) : (
              <div className="space-y-2">
                {subOrdersWithParent.slice(0, 3).map(({ sub, parent }) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900">{sub.orderTicketId}</p>
                      <p className="text-[11px] text-slate-500">
                        {sub.items.length} item(s) · ₦{sub.subtotal.toLocaleString()} · Customer:{' '}
                        {parent?.customerName || 'Naija Buyer'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          parent?.paymentStatus === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Payment: {parent?.paymentStatus || 'awaiting'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                        Fulfillment: {sub.vendorFulfillmentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">My Product Catalogue</h3>
              <p className="text-xs text-slate-500">
                Products uploaded by you appear live on the homepage once published.
              </p>
            </div>
            {isApproved && (
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsUploadModalOpen(true);
                }}
                className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>

          {vendorProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">No products uploaded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload your first item with photos and variants to start selling.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendorProducts.map((p) => {
                const isOutOfStock = p.stock <= 0 || p.status === 'out_of_stock';

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'out_of_stock'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Category: {p.category} · SKU: {p.sku} · Available Stock:{' '}
                          <strong className={isOutOfStock ? 'text-rose-600' : 'text-slate-900'}>
                            {p.stock}
                          </strong>
                        </p>
                        <p className="font-black text-slate-900 text-sm mt-1">
                          ₦{p.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleProductStatus(p)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-semibold"
                        title={p.status === 'published' ? 'Pause / Unpublish' : 'Publish'}
                      >
                        {p.status === 'published' ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{p.status === 'published' ? 'Pause' : 'Publish'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setProductToEdit(p);
                          setIsUploadModalOpen(true);
                        }}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-semibold"
                        title="Edit Details & Pictures"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY SUBORDERS (ONLY THIS VENDOR'S ORDERS) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Fulfillment Orders</h3>
            <p className="text-xs text-slate-500">
              Only suborders containing products from <strong>{currentVendorProfile.businessName}</strong> are visible here.
            </p>
          </div>

          {subOrdersWithParent.length === 0 ? (
            <p className="py-12 text-center text-slate-400 text-xs">No orders to fulfill yet.</p>
          ) : (
            <div className="space-y-4">
              {subOrdersWithParent.map(({ sub, parent }) => {
                const isPaid = parent?.paymentStatus === 'confirmed';

                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 text-xs"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {sub.orderTicketId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({sub.id})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Order Date: {parent ? new Date(parent.createdAt).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          Payment: {parent?.paymentStatus.replace('_', ' ')}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                          Status: {sub.vendorFulfillmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Customer Delivery info */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-700">
                      <strong>Customer Recipient:</strong> {parent?.deliveryAddress.fullName} · {parent?.deliveryAddress.phone}
                      <p className="text-slate-500">
                        {parent?.deliveryAddress.street}, {parent?.deliveryAddress.city},{' '}
                        {parent?.deliveryAddress.state}
                      </p>
                      {parent?.deliveryAddress.instructions && (
                        <p className="text-amber-800 italic mt-0.5">
                          Instructions: {parent.deliveryAddress.instructions}
                        </p>
                      )}
                    </div>

                    {/* Purchased Items */}
                    <div className="space-y-1.5">
                      {sub.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={it.productImage}
                              alt={it.productName}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{it.productName}</p>
                              <p className="text-[10px] text-slate-500">
                                {it.variantDescription} · Qty: {it.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">
                            ₦{(it.unitPrice * it.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Vendor Fulfillment Controls */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-600">
                        Subtotal for your shop: <strong className="text-slate-900 font-black">₦{sub.subtotal.toLocaleString()}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {sub.vendorFulfillmentStatus === 'pending' && (
                          <button
                            onClick={() => handleUpdateFulfillment(sub.id, 'accepted')}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs"
                          >
                            Accept Order
                          </button>
                        )}
                        {sub.vendorFulfillmentStatus === 'accepted' && (
                          <button
                            onClick={() => handleUpdateFulfillment(sub.id, 'preparing')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs"
                          >
                            Mark Preparing
                          </button>
                        )}
                        {sub.vendorFulfillmentStatus === 'preparing' && (
                          <button
                            onClick={() => handleUpdateFulfillment(sub.id, 'ready_for_dispatch')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                          >
                            Mark Ready for Dispatch
                          </button>
                        )}
                        {sub.vendorFulfillmentStatus === 'ready_for_dispatch' && (
                          <button
                            onClick={() => handleUpdateFulfillment(sub.id, 'dispatched')}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs"
                          >
                            Dispatched
                          </button>
                        )}

                        {sub.vendorFulfillmentStatus !== 'cancelled' && sub.vendorFulfillmentStatus !== 'dispatched' && (
                          <button
                            onClick={() => setCancelModalSubOrder(sub)}
                            className="px-2.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-medium text-xs"
                          >
                            Cancel Suborder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: KYC & CREDENTIALS */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">KYC Compliance & Verification Status</h3>
            <p className="text-slate-500">
              Your registered business documents submitted to JAGA Compliance Unit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">CAC / RC Number</span>
              <p className="font-mono font-bold text-slate-900">{currentVendorProfile.cacNumber || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">Tax Identification (TIN)</span>
              <p className="font-mono font-bold text-slate-900">{currentVendorProfile.tinNumber || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">Government ID Type</span>
              <p className="font-bold text-slate-900">{currentVendorProfile.kycDocuments.idType || 'National ID'}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Submitted Document Proofs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-2 bg-white">
                <p className="text-[11px] font-semibold text-slate-700 mb-1">CAC Certificate Preview</p>
                <img
                  src={currentVendorProfile.kycDocuments.cacCertificateUrl}
                  alt="CAC Proof"
                  className="w-full h-36 object-cover rounded-lg bg-slate-100"
                />
              </div>
              <div className="border border-slate-200 rounded-xl p-2 bg-white">
                <p className="text-[11px] font-semibold text-slate-700 mb-1">Government ID Preview</p>
                <img
                  src={currentVendorProfile.kycDocuments.governmentIdUrl}
                  alt="ID Proof"
                  className="w-full h-36 object-cover rounded-lg bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Upload Modal */}
      <VendorProductUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        productToEdit={productToEdit}
        onSuccess={(p) => {
          refreshUserData();
          setActionSuccess(`Product "${p.name}" saved successfully.`);
          setTimeout(() => setActionSuccess(null), 3000);
        }}
      />

      {/* Suborder Cancellation Modal */}
      {cancelModalSubOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Cancel Suborder ({cancelModalSubOrder.orderTicketId})
            </h4>
            <p className="text-slate-600">
              Provide a clear reason for cancellation (e.g. out of stock or manufacturer defect). Inventory will be restored automatically.
            </p>
            <form onSubmit={handleCancelSubOrder} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-xs focus:outline-emerald-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalSubOrder(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                >
                  Confirm Suborder Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
