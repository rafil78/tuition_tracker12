import React, { useState } from 'react';
import { 
  X, CreditCard, CheckCircle2, ShieldCheck, Sparkles, 
  Smartphone, QrCode, Lock, AlertCircle, ArrowRight, Download, Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { autoBackupRecord } from '../firestoreSync';

export default function PaymentModal({ invoice, isOpen, onClose, onPaymentSuccess }) {
  const { formatMoney, currencySymbol } = useAuth();
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardName, setCardName] = useState('Alex Rivera');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // Alternative methods
  const [upiId, setUpiId] = useState('alex.rivera@okaxis');
  const [paypalEmail, setPaypalEmail] = useState('alex.rivera@student.edu');
  const [mobileNumber, setMobileNumber] = useState('+1 (555) 345-6789');

  if (!isOpen || !invoice) return null;

  const handleFillDemoCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardName(invoice.student?.name || 'Alex Rivera');
    setCardExpiry('08/29');
    setCardCvc('321');
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate real gateway processing delay
      await new Promise(r => setTimeout(r, 1200));

      const payload = {
        invoiceId: invoice.id,
        method,
        cardDetails: method === 'card' ? {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          name: cardName,
          expiry: cardExpiry,
          brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard'
        } : undefined,
        paypalEmail: method === 'paypal' ? paypalEmail : undefined,
        upiId: method === 'upi' ? upiId : undefined,
        mobileNumber: method === 'bkash' ? mobileNumber : undefined,
      };

      const result = await api.processPayment(payload);

      if (result.success) {
        setPaymentResult(result);
        
        // Trigger celebratory confetti
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });

        if (result.invoice) {
          autoBackupRecord('invoices', result.invoice);
        }

        if (onPaymentSuccess) {
          onPaymentSuccess(result.invoice);
        }
      } else {
        setError(result.error || 'Payment gateway declined the transaction.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Connection to payment gateway failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-white/20 rounded-full tracking-wide uppercase">
              Secure Checkout Gateway
            </span>
            <span className="text-xs text-indigo-200">256-Bit SSL</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            {paymentResult ? 'Payment Completed 🎉' : 'Pay Tuition Fee'}
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            {invoice.title} • {invoice.invoiceNumber}
          </p>

          <div className="mt-4 flex items-baseline justify-between border-t border-indigo-500/40 pt-3">
            <span className="text-xs uppercase tracking-wider text-indigo-200">Amount to Pay</span>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {formatMoney(invoice.amount)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentResult ? (
            /* Success confirmation screen */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                Transaction Successful!
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                Tuition fee for <strong className="text-slate-700">{invoice.student?.name}</strong> has been marked as fully paid and synced with the database.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left mb-6 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Reference:</span>
                  <span className="font-mono font-semibold text-slate-800">{paymentResult.payment?.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-semibold text-slate-800 uppercase">{paymentResult.payment?.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-800">{new Date(paymentResult.payment?.paidAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-medium">
                  <span className="text-slate-700">Total Settled:</span>
                  <span className="text-emerald-600 font-bold text-sm">{formatMoney(invoice.amount)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-slate-500" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Payment Form */
            <form onSubmit={handleProcessPayment}>
              {/* Method Tabs */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === 'card'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-indigo-600" />
                  Credit Card
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('paypal')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === 'paypal'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="font-bold text-blue-600 text-sm">PayPal</span>
                  Checkout
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('upi')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === 'upi'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1 text-emerald-600" />
                  UPI / QR
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('bkash')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === 'bkash'
                      ? 'border-pink-600 bg-pink-50/70 text-pink-700 ring-2 ring-pink-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1 text-pink-600" />
                  bKash / Mobile
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* CARD FORM */}
              {method === 'card' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Cardholder Information</span>
                    <button
                      type="button"
                      onClick={handleFillDemoCard}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-fill Test Card
                    </button>
                  </div>

                  {/* Card Visualizer */}
                  <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 text-white rounded-xl p-4 shadow-lg border border-slate-700/50">
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-xs tracking-wider text-slate-300 uppercase font-mono">EduTrack Pay</div>
                      <div className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold tracking-widest text-white uppercase">
                        {cardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD'}
                      </div>
                    </div>
                    <div className="font-mono text-lg tracking-widest text-slate-100 mb-4">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between text-xs text-slate-300 uppercase">
                      <div>
                        <div className="text-[9px] text-slate-400">Cardholder</div>
                        <div className="font-medium tracking-wide">{cardName || 'YOUR NAME'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400">Expires</div>
                        <div className="font-mono">{cardExpiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      placeholder="Alex Rivera"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Security Code (CVC)</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value)}
                        placeholder="•••"
                        maxLength={4}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PAYPAL FORM */}
              {method === 'paypal' && (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                    <p className="font-semibold mb-1">Fast & Secure PayPal Express Checkout</p>
                    <p>You will be authenticated via PayPal Sandbox gateway to authorize the tuition charge of ${invoice.amount}.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">PayPal Account Email</label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={e => setPaypalEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* UPI FORM */}
              {method === 'upi' && (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <div className="w-28 h-28 bg-white border border-emerald-300 rounded-xl mx-auto flex items-center justify-center p-2 mb-2 shadow-sm">
                      <QrCode className="w-20 h-20 text-emerald-700" />
                    </div>
                    <p className="text-xs font-semibold text-emerald-900">Scan QR or Pay via Virtual Payment Address</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Virtual Payment Address (VPA / UPI ID)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="student@okaxis"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* BKASH / MOBILE */}
              {method === 'bkash' && (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900">
                    <p className="font-semibold mb-1">Direct Mobile Wallet Gateway (bKash / Nagad / Apple Pay)</p>
                    <p>Enter your registered mobile wallet account to receive instant prompt verification.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Account Number</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Escrow Gateway</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2.5 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay {formatMoney(invoice.amount)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
