import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { X, ShieldAlert, CheckCircle2, Building2, User as UserIcon, Shield, UploadCloud, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer',
  onSuccess
}) => {
  const { login, registerCustomer, registerVendor, switchUserFast } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>(defaultRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Customer Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custStreet, setCustStreet] = useState('');
  const [custState, setCustState] = useState('Lagos');

  // Vendor Form State
  const [bizName, setBizName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [vendEmail, setVendEmail] = useState('');
  const [vendPhone, setVendPhone] = useState('');
  const [vendPassword, setVendPassword] = useState('');
  const [vendAddress, setVendAddress] = useState('');
  const [vendState, setVendState] = useState('Lagos');
  const [vendLga, setVendLga] = useState('Lagos Island');
  const [vendCategory, setVendCategory] = useState('Fashion & Ankara');
  const [cacNumber, setCacNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [cacCertFile, setCacCertFile] = useState<string>('https://images.unsplash.com/photo-1568667256549-094345857637?w=600');
  const [govIdFile, setGovIdFile] = useState<string>('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');
  const [govIdType, setGovIdType] = useState('NIN National Identity');

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  if (!isOpen) return null;

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setError(null);
    setSuccessMsg(null);
    if (role === 'admin') {
      setIsSignUp(false); // Admin cannot sign up
    }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      if (!custName || !custEmail || !custPhone || !custPassword) {
        setError('Please fill in all required customer fields.');
        return;
      }
      const res = registerCustomer({
        fullName: custName,
        email: custEmail,
        phone: custPhone,
        street: custStreet,
        state: custState
      });
      if (!res.success) {
        setError(res.error || 'Failed to register customer');
      } else {
        setSuccessMsg('Account created successfully! Welcome to JAGA.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 800);
      }
    } else {
      if (!custEmail) {
        setError('Please enter your registered email.');
        return;
      }
      const res = login(custEmail, 'customer');
      if (!res.success) {
        setError(res.error || 'Login failed.');
      } else {
        setSuccessMsg('Welcome back!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }
    }
  };

  const handleVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      if (!bizName || !ownerName || !vendEmail || !vendPhone || !vendAddress) {
        setError('Please complete all vendor business and location fields.');
        return;
      }
      const res = registerVendor({
        businessName: bizName,
        ownerName,
        email: vendEmail,
        phone: vendPhone,
        businessAddress: vendAddress,
        state: vendState,
        lga: vendLga,
        category: vendCategory,
        cacNumber,
        tinNumber,
        kycDocuments: {
          cacCertificateUrl: cacCertFile,
          governmentIdUrl: govIdFile,
          idType: govIdType
        }
      });
      if (!res.success) {
        setError(res.error || 'Vendor registration failed.');
      } else {
        setSuccessMsg('Vendor application submitted! Your account is pending admin KYC verification.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } else {
      if (!vendEmail) {
        setError('Please enter your vendor email.');
        return;
      }
      const res = login(vendEmail, 'vendor');
      if (!res.success) {
        setError(res.error || 'Vendor login failed.');
      } else {
        setSuccessMsg('Vendor dashboard authenticated.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminEmail) {
      setError('Admin email required.');
      return;
    }
    const res = login(adminEmail, 'admin');
    if (!res.success) {
      setError(res.error || 'Unauthorized admin credentials.');
    } else {
      setSuccessMsg('Admin access granted.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 600);
    }
  };

  const handleQuickDemo = (role: 'customer' | 'approved_vendor' | 'pending_vendor' | 'admin') => {
    setError(null);
    if (role === 'customer') {
      switchUserFast('user-cust-01');
    } else if (role === 'approved_vendor') {
      switchUserFast('user-vend-01');
    } else if (role === 'pending_vendor') {
      switchUserFast('user-vend-pending');
    } else if (role === 'admin') {
      switchUserFast('user-admin-01');
    }
    setSuccessMsg(`Switched directly to Demo ${role.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">JAGA Account Portal</h3>
            <p className="text-xs text-emerald-200">
              Access the Nigerian Multi-Vendor Marketplace
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Selector */}
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
              ⚡ Instant 1-Click Demo Sign-in
            </span>
            <span className="text-[11px] text-amber-700">Pre-seeded test accounts</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => handleQuickDemo('customer')}
              className="px-2 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-medium text-[11px] text-slate-800 text-left transition shadow-2xs"
            >
              👤 Customer
              <span className="block text-[9px] text-slate-500 truncate">Amara (Lekki)</span>
            </button>
            <button
              onClick={() => handleQuickDemo('approved_vendor')}
              className="px-2 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-medium text-[11px] text-slate-800 text-left transition shadow-2xs"
            >
              🏪 Vendor (Verified)
              <span className="block text-[9px] text-slate-500 truncate">Balogun Fabrics</span>
            </button>
            <button
              onClick={() => handleQuickDemo('pending_vendor')}
              className="px-2 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-medium text-[11px] text-slate-800 text-left transition shadow-2xs"
            >
              ⏳ Vendor (Pending)
              <span className="block text-[9px] text-slate-500 truncate">Fatima (Kano)</span>
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="px-2 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-medium text-[11px] text-slate-800 text-left transition shadow-2xs"
            >
              🛡️ Super Admin
              <span className="block text-[9px] text-slate-500 truncate">Ops Manager</span>
            </button>
          </div>
        </div>

        {/* Dedicated Role Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => handleTabChange('customer')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'customer'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Customer Portal</span>
          </button>
          <button
            onClick={() => handleTabChange('vendor')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'vendor'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vendor Portal</span>
          </button>
          <button
            onClick={() => handleTabChange('admin')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'admin'
                ? 'border-rose-600 text-rose-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CUSTOMER */}
          {activeTab === 'customer' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  {isSignUp ? 'Create a Customer Account' : 'Sign in as Customer'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-emerald-700 hover:underline font-semibold"
                >
                  {isSignUp ? 'Already registered? Sign In' : 'New to JAGA? Create Account'}
                </button>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amara Okafor"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-emerald-600 focus:border-emerald-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. customer@jaga.ng"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-emerald-600 focus:border-emerald-600"
                  />
                  {!isSignUp && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Demo email: <code className="text-emerald-700">customer@jaga.ng</code>
                    </p>
                  )}
                </div>

                {isSignUp && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Phone Number (WhatsApp) *
                        </label>
                        <input
                          type="tel"
                          placeholder="+234 803 000 0000"
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                          required
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Delivery State
                        </label>
                        <select
                          value={custState}
                          onChange={(e) => setCustState(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Lagos">Lagos</option>
                          <option value="Abuja (FCT)">Abuja (FCT)</option>
                          <option value="Rivers">Rivers</option>
                          <option value="Kano">Kano</option>
                          <option value="Oyo">Oyo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Street Address (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                        value={custStreet}
                        onChange={(e) => setCustStreet(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-emerald-600"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-emerald-600 focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition mt-2"
                >
                  {isSignUp ? 'Create Customer Account' : 'Sign In as Customer'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: VENDOR */}
          {activeTab === 'vendor' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  {isSignUp ? 'Register as a JAGA Vendor' : 'Vendor Sign In'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-emerald-700 hover:underline font-semibold"
                >
                  {isSignUp ? 'Already registered? Sign In' : 'New Vendor? Apply to Sell'}
                </button>
              </div>

              {isSignUp && (
                <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold">KYC Notice:</span> JAGA takes marketplace trust seriously. Newly registered vendors are placed in <strong>Pending Verification</strong> status until an administrator approves your KYC documents. You cannot publish live products until verified.
                </div>
              )}

              <form onSubmit={handleVendorSubmit} className="space-y-3">
                {isSignUp ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Business / Shop Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Alaba Tech Hub"
                          value={bizName}
                          onChange={(e) => setBizName(e.target.value)}
                          required
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Owner Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chidi Eze"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          required
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Business Email *
                        </label>
                        <input
                          type="email"
                          placeholder="shop@alaba.ng"
                          value={vendEmail}
                          onChange={(e) => setVendEmail(e.target.value)}
                          required
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Phone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={vendPhone}
                          onChange={(e) => setVendPhone(e.target.value)}
                          required
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Primary Category *
                        </label>
                        <select
                          value={vendCategory}
                          onChange={(e) => setVendCategory(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Fashion & Ankara">Fashion & Ankara</option>
                          <option value="Phones & Gadgets">Phones & Gadgets</option>
                          <option value="Electronics & Solar">Electronics & Solar</option>
                          <option value="Groceries & Foodstuff">Groceries & Foodstuff</option>
                          <option value="Home & Kitchen">Home & Kitchen</option>
                          <option value="Automobiles & Spares">Automobiles & Spares</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Operating State *
                        </label>
                        <select
                          value={vendState}
                          onChange={(e) => setVendState(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Lagos">Lagos</option>
                          <option value="Abuja (FCT)">Abuja (FCT)</option>
                          <option value="Kano">Kano</option>
                          <option value="Rivers">Rivers</option>
                          <option value="Oyo">Oyo</option>
                          <option value="Anambra">Anambra</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Physical Shop / Warehouse Address *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Line 7, Alaba International Market, Ojo"
                        value={vendAddress}
                        onChange={(e) => setVendAddress(e.target.value)}
                        required
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          CAC Registration / RC Number
                        </label>
                        <input
                          type="text"
                          placeholder="RC-1234567 or BN-12345"
                          value={cacNumber}
                          onChange={(e) => setCacNumber(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Tax Identification Number (TIN)
                        </label>
                        <input
                          type="text"
                          placeholder="23849102-0001"
                          value={tinNumber}
                          onChange={(e) => setTinNumber(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    {/* KYC Document Uploads */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
                        KYC Verification Documents
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">
                            CAC Certificate / Business Reg
                          </label>
                          <div className="p-2 border border-dashed border-slate-300 rounded bg-white text-center text-slate-500">
                            ✓ Certificate attached (Demo Verified)
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">
                            Government ID (NIN / Voters Card)
                          </label>
                          <div className="p-2 border border-dashed border-slate-300 rounded bg-white text-center text-slate-500">
                            ✓ {govIdType} attached
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={vendPassword}
                        onChange={(e) => setVendPassword(e.target.value)}
                        required
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Vendor Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="vendor@jaga.ng"
                        value={vendEmail}
                        onChange={(e) => setVendEmail(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Approved Demo: <code className="text-emerald-700">vendor@jaga.ng</code> | Pending Demo: <code className="text-amber-700">pending@jaga.ng</code>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={vendPassword}
                        onChange={(e) => setVendPassword(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition mt-2"
                >
                  {isSignUp ? 'Submit Vendor Application' : 'Sign In to Vendor Dashboard'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ADMIN */}
          {activeTab === 'admin' && (
            <div>
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <strong>Strict Security Notice:</strong> Administrator access is restricted. Admin accounts can never be created via public sign-up. Only pre-configured authorized personnel can log in.
                </div>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Administrator Email *
                  </label>
                  <input
                    type="email"
                    placeholder="admin@jaga.ng"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-rose-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pre-authorized admin: <code className="text-rose-700 font-semibold">admin@jaga.ng</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Security Passkey *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-rose-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-xl shadow-xs transition mt-2"
                >
                  Authenticate Admin Session
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
