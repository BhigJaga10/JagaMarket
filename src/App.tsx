import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { db } from './services/db';
import { Product, Order, UserRole } from './types';

import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroBanner } from './components/home/HeroBanner';
import { CategoryBar } from './components/home/CategoryBar';
import { FlashDeals } from './components/home/FlashDeals';
import { ProductGrid } from './components/home/ProductGrid';

import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ProductDetailModal } from './components/product/ProductDetailModal';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { BankTransferModal } from './components/payment/BankTransferModal';
import { RequestProductModal } from './components/request/RequestProductModal';

import { VendorDashboard } from './components/vendor/VendorDashboard';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

import { Store } from 'lucide-react';
import { testFirestoreConnection } from './firebase';

const MainApp: React.FC = () => {
  const { currentUser, role, isAuthenticated, isApprovedVendor } = useAuth();
  const { addToCart } = useCart();

  // Navigation & View state
  const [activeView, setActiveView] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<UserRole>('customer');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [activeOrderForPayment, setActiveOrderForPayment] = useState<Order | null>(null);

  // Resume checkout flag if guest was prompted to log in during checkout
  const [pendingCheckoutResume, setPendingCheckoutResume] = useState(false);

  // Live products & notifications state
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Subscribe to Live Firestore Products
    const unsubProducts = db.subscribeProducts((prods) => {
      const publicProds = prods.filter(
        (p) => p.status === 'published' || p.status === 'out_of_stock'
      );
      setMarketplaceProducts(publicProds);
    });

    // 2. Subscribe to Live Firestore Vendors
    const unsubVendors = db.subscribeVendors(() => {
      // Refresh filtered public products when vendors update
      setMarketplaceProducts(db.getPublicMarketplaceProducts());
    });

    // 3. Test connection
    testFirestoreConnection().catch(console.warn);

    return () => {
      unsubProducts();
      unsubVendors();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAuth = (defaultRole: UserRole = 'customer') => {
    setAuthDefaultRole(defaultRole);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    if (pendingCheckoutResume) {
      setPendingCheckoutResume(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleAddToCart = (product: Product) => {
    const res = addToCart(product, 1);
    showToast(res.message);
  };

  const handlePromptLoginDuringCheckout = () => {
    setPendingCheckoutResume(true);
    setIsCheckoutOpen(false);
    handleOpenAuth('customer');
  };

  const handleOrderCreated = (order: Order) => {
    setActiveOrderForPayment(order);
    showToast(`Order created! Ticket ID: ${order.ticketId}`);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-emerald-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-emerald-950 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-700 animate-in slide-in-from-top duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenAuth={handleOpenAuth}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        unreadNotifsCount={unreadNotifsCount}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'home' && (
          <>
            {/* Hero Carousel */}
            <HeroBanner
              onOpenRequestModal={() => setIsRequestModalOpen(true)}
              onExploreCategory={(cat) => {
                setSelectedCategory(cat);
              }}
            />

            {/* Category Navigation Bar */}
            <CategoryBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />

            {/* Flash Deals with Countdown */}
            {!searchQuery && (
              <FlashDeals
                products={marketplaceProducts}
                onSelectProduct={(p) => setSelectedProductForDetail(p)}
                onAddToCart={handleAddToCart}
              />
            )}

            {/* Main Marketplace Grid */}
            <ProductGrid
              products={marketplaceProducts}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onSelectProduct={(p) => setSelectedProductForDetail(p)}
              onAddToCart={handleAddToCart}
              onOpenRequestModal={() => setIsRequestModalOpen(true)}
            />
          </>
        )}

        {activeView === 'vendor-dashboard' && (
          isApprovedVendor ? (
            <VendorDashboard
              onOpenProductUpload={() => {}}
              onSelectProductDetail={(p) => setSelectedProductForDetail(p)}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <Store className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Vendor Access Restricted</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Only approved, verified vendors can access merchant selling tools and publish products. If you recently submitted an application, it is currently awaiting administrator review.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setActiveView('customer-dashboard')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  View Status in Customer Dashboard
                </button>
                <button
                  onClick={() => setActiveView('home')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )
        )}

        {activeView === 'customer-dashboard' && (
          <CustomerDashboard
            onOpenRequestModal={() => setIsRequestModalOpen(true)}
            onBrowseMarketplace={() => setActiveView('home')}
            onNavigateToVendor={() => setActiveView('vendor-dashboard')}
          />
        )}

        {activeView === 'admin-dashboard' && <AdminDashboard />}
      </main>

      {/* Global Footer */}
      <Footer
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
        onOpenVendorAuth={() => {
          if (isAuthenticated) {
            setActiveView('customer-dashboard');
          } else {
            handleOpenAuth('customer');
          }
        }}
      />

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authDefaultRole}
        onSuccess={handleAuthSuccess}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onRefresh={() => {}}
        onNavigateToItem={(type) => {
          setIsNotifOpen(false);
          if (type === 'order' || type === 'request') {
            if (role === 'admin') setActiveView('admin-dashboard');
            else if (role === 'vendor') setActiveView('vendor-dashboard');
            else setActiveView('customer-dashboard');
          }
        }}
      />

      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderCreated={handleOrderCreated}
        onPromptLogin={handlePromptLoginDuringCheckout}
      />

      <BankTransferModal
        isOpen={!!activeOrderForPayment}
        order={activeOrderForPayment}
        onClose={() => setActiveOrderForPayment(null)}
        onPaymentClaimSubmitted={() => {
          showToast('Payment claim submitted! Awaiting administrator statement check.');
        }}
      />

      <RequestProductModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onRequestCreated={() => {
          showToast('Sourcing request submitted! Track under Customer Dashboard.');
        }}
        onPromptLogin={() => {
          setIsRequestModalOpen(false);
          handleOpenAuth('customer');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
