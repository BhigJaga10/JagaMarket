import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  Search,
  ShoppingBag,
  Bell,
  User,
  PlusCircle,
  HelpCircle,
  LogOut,
  Store,
  ShieldCheck,
  Shield,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenAuth: (defaultRole?: UserRole) => void;
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenRequestModal: () => void;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView: string;
  onNavigate: (view: string) => void;
  unreadNotifsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenCart,
  onOpenNotifications,
  onOpenRequestModal,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  activeView,
  onNavigate,
  unreadNotifsCount
}) => {
  const { currentUser, currentVendorProfile, isAuthenticated, role, isApprovedVendor, setActivePortal, logout } = useAuth();
  const { totalItems } = useCart();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedCatFilter, setSelectedCatFilter] = useState('All');

  const categories = [
    'All',
    'Fashion & Ankara',
    'Phones & Gadgets',
    'Electronics & Solar',
    'Groceries & Foodstuff',
    'Home & Kitchen',
    'Automobiles & Spares'
  ];

  const handleCategorySelect = (cat: string) => {
    setSelectedCatFilter(cat);
    onSelectCategory(cat === 'All' ? '' : cat);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner & Quick Role Switcher */}
      <div className="bg-emerald-950 text-emerald-100 text-[11px] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-amber-300">
            <span>🇳🇬 JAGA Nigeria</span>
          </span>
          <span className="hidden md:inline text-emerald-400">|</span>
          <span className="hidden md:inline text-emerald-200">
            Direct Bank Transfer Escrow · 36 States Delivery · Unique Ticket IDs
          </span>
        </div>

        {/* Real Firebase Session Indicator & Dual Role Switcher */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Signed in as <strong>{currentUser?.fullName.split(' ')[0]}</strong> ({role})
                </span>
              </span>

              {/* Approved Vendor Dual Switcher (Requirement 6) */}
              {isApprovedVendor && (
                <button
                  onClick={() => {
                    if (activeView === 'vendor-dashboard') {
                      setActivePortal('customer');
                      onNavigate('customer-dashboard');
                    } else {
                      setActivePortal('vendor');
                      onNavigate('vendor-dashboard');
                    }
                  }}
                  className="px-2.5 py-0.5 rounded text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition shadow-xs flex items-center gap-1"
                >
                  <Store className="w-3 h-3 text-slate-900" />
                  <span>
                    {activeView === 'vendor-dashboard' ? 'Switch to Customer Account' : 'Switch to Vendor Dashboard'}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  onNavigate('home');
                }}
                className="px-2 py-0.5 rounded text-[10px] bg-emerald-900 hover:bg-emerald-800 text-rose-300 font-medium border border-emerald-800 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-300">
                Guest Browsing Mode
              </span>
              <button
                onClick={() => onOpenAuth('customer')}
                className="px-2.5 py-0.5 rounded text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition shadow-xs"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="cursor-pointer flex items-center gap-2 shrink-0 group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex items-center justify-center font-black text-xl shadow-md border border-emerald-600/30 group-hover:scale-105 transition">
            <span className="tracking-tighter">JG</span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-emerald-950 tracking-tight">JAGA</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mb-1" />
            </div>
            <span className="block text-[10px] font-semibold text-emerald-800 -mt-1 tracking-wider uppercase">
              Nigeria Marketplace
            </span>
          </div>
        </div>

        {/* Global Product Search Bar */}
        <div className="flex-1 max-w-2xl hidden sm:flex items-center">
          <div className="w-full flex items-center bg-slate-100 rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:bg-white transition overflow-hidden">
            <select
              value={selectedCatFilter}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent px-3 py-2.5 border-r border-slate-300 focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex-1 flex items-center px-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search phones, Ankara, inverters, foodstuff, shoes..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (activeView !== 'home') onNavigate('home');
                }}
                className="w-full text-xs text-slate-900 bg-transparent py-2.5 focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => onNavigate('home')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-semibold transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Actions Strip */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Request a Product Button */}
          <button
            onClick={onOpenRequestModal}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Request Item</span>
          </button>

          {/* Sell on JAGA (Vendor CTA) */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onOpenAuth('customer');
              } else if (isApprovedVendor) {
                setActivePortal('vendor');
                onNavigate('vendor-dashboard');
              } else {
                onNavigate('customer-dashboard');
              }
            }}
            className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-emerald-800 px-2 py-1.5 transition"
          >
            <Store className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isApprovedVendor ? 'Vendor Dashboard' : 'Sell on JAGA'}</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="p-2 text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition relative flex items-center gap-1.5"
            title="Cart"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-800" />
            {totalItems > 0 && (
              <span className="w-5 h-5 bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Account / Auth Menu */}
          <div className="relative">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                    {currentUser?.fullName.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block max-w-[100px]">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.fullName.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium capitalize -mt-0.5">
                      {isApprovedVendor ? 'Verified Vendor' : role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div
                    onMouseLeave={() => setUserMenuOpen(false)}
                    className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in-50 duration-100"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="font-bold text-slate-900 truncate">{currentUser?.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {isApprovedVendor ? 'Verified Vendor & Customer' : role}
                      </span>
                    </div>

                    {/* Customer Account & Orders: Always available to every user (including approved vendors) */}
                    <button
                      onClick={() => {
                        onNavigate('customer-dashboard');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 font-medium"
                    >
                      🛍️ My Customer Dashboard & Orders
                    </button>

                    {/* Vendor Merchant Dashboard: Available if vendor is approved */}
                    {isApprovedVendor && (
                      <button
                        onClick={() => {
                          setActivePortal('vendor');
                          onNavigate('vendor-dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-emerald-800 hover:bg-emerald-50 font-bold flex items-center gap-1.5"
                      >
                        <Store className="w-3.5 h-3.5 text-emerald-700" />
                        <span>🏪 Vendor Merchant Dashboard</span>
                      </button>
                    )}

                    {/* Admin Portal */}
                    {role === 'admin' && (
                      <button
                        onClick={() => {
                          onNavigate('admin-dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5 text-rose-600" />
                        <span>Super Admin Control Centre</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onNavigate('home');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100"
                    >
                      Browse Marketplace
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        onNavigate('home');
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('customer')}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="sm:hidden px-4 pb-2.5">
        <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search products, brands, Ankara, foods..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (activeView !== 'home') onNavigate('home');
            }}
            className="w-full text-xs text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
