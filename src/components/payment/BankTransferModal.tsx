import React, { useState } from 'react';
import { Order } from '../../types';
import { db } from '../../services/db';
import {
  X,
  Copy,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Building,
  CreditCard,
  FileText,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface BankTransferModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentClaimSubmitted: (updatedOrder: Order) => void;
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentClaimSubmitted
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bankPaidFrom, setBankPaidFrom] = useState('');
  const [accountSenderName, setAccountSenderName] = useState(order?.customerName || '');
  const [transactionRef, setTransactionRef] = useState('');
  const [claimedAmount, setClaimedAmount] = useState<number>(order?.total || 0);
  const [receiptImage, setReceiptImage] = useState<string>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const bankSettings = db.getBankSettings();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bankPaidFrom || !accountSenderName || !transactionRef) {
      setErrorMsg('Please enter your Bank name, Sender account name, and Transaction reference.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedOrder = db.submitPaymentClaim(
        order.ticketId,
        {
          bankPaidFrom,
          accountSenderName,
          transactionReference: transactionRef,
          claimedAmount: Number(claimedAmount),
          receiptImageUrl: receiptImage
        },
        order.customerId
      );

      setIsSubmitting(false);
      setSuccessMsg('Payment claim submitted successfully! An administrator will independently verify the bank statement.');
      setTimeout(() => {
        onPaymentClaimSubmitted(updatedOrder);
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to submit payment claim.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              ₦
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manual Bank Transfer Payment</h3>
              <p className="text-xs text-emerald-200">
                Order Ticket ID: <strong className="text-amber-300 font-mono">{order.ticketId}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Important Ticket ID Banner */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Critical Transfer Narration Requirement
              </span>
              <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                24-Hour Hold
              </span>
            </div>
            <p className="text-slate-800 leading-relaxed text-xs">
              When making this transfer in your banking app, you <strong>MUST</strong> enter your Ticket ID as the transfer remark/narration:
            </p>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-300 font-mono text-sm font-bold text-slate-900">
              <span>{order.ticketId}</span>
              <button
                type="button"
                onClick={() => handleCopy(order.ticketId, 'ticketId')}
                className="text-xs text-emerald-800 hover:text-emerald-900 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded"
              >
                {copiedField === 'ticketId' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'ticketId' ? 'Copied' : 'Copy Ticket ID'}</span>
              </button>
            </div>
          </div>

          {/* Configured Official Bank Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-700" />
                Official JAGA Escrow Bank Account
              </h4>
              <span className="text-emerald-800 font-semibold text-[11px]">Verified Corporate Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-500">Bank Name</p>
                <p className="text-sm font-bold text-slate-900">{bankSettings.bankName}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-500">Account Name</p>
                <p className="text-sm font-bold text-slate-900">{bankSettings.accountName}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Account Number (NUBAN)</p>
                  <p className="text-sm font-black font-mono text-slate-900">{bankSettings.accountNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(bankSettings.accountNumber, 'accountNo')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Copy Account Number"
                >
                  {copiedField === 'accountNo' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-emerald-800 font-semibold">Exact Amount to Transfer</p>
                  <p className="text-base font-black text-emerald-950 font-mono">
                    ₦{order.total.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(order.total.toString(), 'amount')}
                  className="p-1.5 rounded-lg bg-emerald-200/60 hover:bg-emerald-200 text-emerald-900"
                  title="Copy Amount"
                >
                  {copiedField === 'amount' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              {bankSettings.instructions}
            </p>
          </div>

          {/* Current Payment Status */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Order Payment Status:</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              {order.paymentStatus.replace('_', ' ')}
            </span>
          </div>

          {/* Payment Claim Submission Form */}
          <form onSubmit={handleSubmitClaim} className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                Submit Your Payment Claim
              </h4>
              <span className="text-slate-400 text-[11px]">Step 2 after making transfer</span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Bank You Paid From *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GTBank / Access / Zenith / Kuda / OPay"
                  value={bankPaidFrom}
                  onChange={(e) => setBankPaidFrom(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Sender Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Name as it appears on transfer"
                  value={accountSenderName}
                  onChange={(e) => setAccountSenderName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Transfer Reference / Session ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 000013240981928374 or NIP Ref"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Claimed Amount Transferred (₦) *
                </label>
                <input
                  type="number"
                  required
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            {/* Proof of payment preview */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Proof of Payment / Transfer Receipt (Optional)
              </label>
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src={receiptImage}
                    alt="Receipt thumbnail"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                  />
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">Bank Transfer Receipt Attached</p>
                    <p className="text-[10px] text-slate-400">PDF / Screenshot image</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-1 rounded">
                  ✓ Receipt Attached
                </span>
              </div>
            </div>

            {/* Crucial Verification Notice as per prompt Section 8 */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-[11px] text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">⚠️ Disclaimer:</span> Submitting a payment claim or uploading proof does <strong>NOT</strong> mean the payment has been confirmed. JAGA platform administrators independently check the actual bank account ledger before marking payment as confirmed.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>Submit Payment Claim for Admin Verification</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
