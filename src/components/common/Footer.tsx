import React from 'react';
import { ShieldCheck, Truck, RefreshCw, PhoneCall, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onOpenRequestModal?: () => void;
  onOpenVendorAuth?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenRequestModal, onOpenVendorAuth }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-16 text-xs">
      {/* Trust Highlights */}
      <div className="max-w-7xl mx-auto px-4 pb-10 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Escrow Bank Transfer</h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Payments verified directly with our Nigerian escrow account before vendors dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Nationwide Dispatch</h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Covering Lagos, Abuja, Kano, Port Harcourt, and all 36 Nigerian states.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Order Ticket IDs</h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Unique server-generated references (e.g. JAG-2026-000123) for transparent tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Customer Support</h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Dedicated WhatsApp & phone assistance for orders and payment inquiries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
              JG
            </div>
            <span className="text-xl font-black text-white tracking-tight">JAGA</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
            JAGA is Nigeria's multi-vendor e-commerce marketplace connecting verified local merchants with customers across the nation. Authentic goods, manual bank transfer verification, and rapid fulfillment.
          </p>
          <div className="space-y-1 text-[11px] text-slate-400">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>JAGA Tower, 45 Marina Street, Lagos Island, Lagos</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-500" />
              <span>orders@jaga.ng · support@jaga.ng</span>
            </p>
          </div>
        </div>

        <div>
          <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
            Shop Categories
          </h5>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>Phones & Gadgets</li>
            <li>Fashion & Ankara Fabrics</li>
            <li>Electronics & Solar Backup</li>
            <li>Nigerian Groceries & Foodstuff</li>
            <li>Home & Kitchen Essentials</li>
            <li>Automobiles & Spare Parts</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
            Customer & Sourcing
          </h5>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              <button onClick={onOpenRequestModal} className="hover:text-amber-400 text-left">
                ✨ Request Unavailable Product
              </button>
            </li>
            <li>Track Order by Ticket ID</li>
            <li>Bank Transfer Payment Guide</li>
            <li>Return & Cancellation Policy</li>
            <li>Dispute Resolution</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
            Vendors & Governance
          </h5>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              <button onClick={onOpenVendorAuth} className="hover:text-emerald-400 text-left">
                Apply as a Verified Vendor
              </button>
            </li>
            <li>Vendor KYC Requirements</li>
            <li>Product Upload Standards</li>
            <li>Merchant Terms of Service</li>
            <li>Privacy & Data Protection</li>
          </ul>
        </div>
      </div>

      {/* Demo Disclaimer & Copyright */}
      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>© 2026 JAGA Marketplace Nigeria Ltd. All rights reserved.</p>
        <p className="p-1 px-2 rounded bg-slate-800 text-amber-300 border border-slate-700">
          ⚠️ Demo Environment: Realistic Nigerian sample data. Bank transfer instructions are for demonstration.
        </p>
      </div>
    </footer>
  );
};
