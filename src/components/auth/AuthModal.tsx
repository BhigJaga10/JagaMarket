import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { X, ShieldAlert, CheckCircle2, User as UserIcon, Shield, AlertCircle, ShoppingBag } from 'lucide-react';

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
  const { login, loginWithGoogle, registerCustomer } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdminLoginMode, setIsAdminLoginMode] = useState(defaultRole === 'admin');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [street, setStreet] = useState('');
  const [state, setState] = useState('Lagos');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg('Authenticated with Google successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } else {
      setError(res.error || 'Google authentication failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (isSignUp) {
      // STRICT CUSTOMER-FIRST REGISTRATION
      if (!fullName || !email || !phone || !password) {
        setError('Please complete all required customer registration fields.');
        setIsSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsSubmitting(false);
        return;
      }

      const res = await registerCustomer({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        street: street.trim(),
        state
      });

      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Failed to create customer account.');
      } else {
        setSuccessMsg('Account created successfully! Welcome to JAGA Marketplace.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 800);
      }
    } else {
      // SIGN IN (Members or Admin)
      if (!email.trim() || !password) {
        setError('Please enter your email and password.');
        setIsSubmitting(false);
        return;
      }

      const res = await login(email.trim(), password, isAdminLoginMode ? 'admin' : undefined);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Login failed. Please verify your credentials.');
      } else {
        setSuccessMsg(isAdminLoginMode ? 'Admin session verified.' : 'Welcome back!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`p-4 text-white flex items-center justify-between ${isAdminLoginMode ? 'bg-slate-900' : 'bg-emerald-900'}`}>
          <div className="flex items-center gap-2">
            {isAdminLoginMode ? (
              <div className="w-8 h-8 rounded-lg bg-rose-600/30 flex items-center justify-center text-rose-300">
                <Shield className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-200">
                <ShoppingBag className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-white">
                {isAdminLoginMode ? 'Administrator Security Portal' : isSignUp ? 'Create Customer Account' : 'Sign in to JAGA'}
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                {isAdminLoginMode
                  ? 'Authorized compliance & platform administration'
                  : 'Nigerian Multi-Vendor Escrow Marketplace'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer-First Notice Banner on Sign Up */}
        {isSignUp && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-emerald-900 text-xs flex items-start gap-2">
            <UserIcon className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Customer-First Policy:</strong> All new users automatically register as customers to browse, order, and track deliveries. If you wish to sell, you can easily apply from your <strong>Customer Dashboard</strong> after signing in.
            </div>
          </div>
        )}

        {/* Admin Login Mode Notice */}
        {isAdminLoginMode && !isSignUp && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Restricted Portal:</strong> Administrator privileges are verified server-side against authorized Firebase credentials (e.g., <code className="font-bold text-amber-950">sadiqmuhammadibrahim1436@gmail.com</code>). Public registration is disabled.
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Toggle between Sign In / Sign Up */}
          {!isAdminLoginMode && (
            <div className="flex border-b border-slate-200 mb-5">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
                  !isSignUp
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
                  isSignUp
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Register as Customer
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amara Okafor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 focus:border-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder={isAdminLoginMode ? "sadiqmuhammadibrahim1436@gmail.com" : "e.g. name@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 focus:border-emerald-600"
              />
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja (FCT)">Abuja (FCT)</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Kano">Kano</option>
                      <option value="Oyo">Oyo</option>
                      <option value="Anambra">Anambra</option>
                      <option value="Enugu">Enugu</option>
                      <option value="Kaduna">Kaduna</option>
                      <option value="Delta">Delta</option>
                      <option value="Edo">Edo</option>
                      <option value="Ogun">Ogun</option>
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
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded-xl shadow-xs transition mt-2 text-white disabled:opacity-50 ${
                isAdminLoginMode
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : isSignUp
                ? 'Create Customer Account'
                : isAdminLoginMode
                ? 'Authenticate Admin Session'
                : 'Sign In to Account'}
            </button>

            {/* Google Sign-In for standard users */}
            {!isAdminLoginMode && (
              <>
                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative px-2 bg-white text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Or continue with
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </>
            )}
          </form>

          {/* Admin Switcher Footer Link */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            {isAdminLoginMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsAdminLoginMode(false);
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-emerald-700 hover:underline font-semibold"
              >
                ← Return to Customer & Vendor Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAdminLoginMode(true);
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-rose-600" />
                <span>Admin Login Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
