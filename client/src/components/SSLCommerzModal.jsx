import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Lock, CheckCircle2, AlertCircle, 
  CreditCard, Smartphone, Building, ArrowRight, Download, 
  RotateCw, RefreshCw, Sparkles, Check, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { autoBackupRecord } from '../firestoreSync';

export default function SSLCommerzModal({ invoice, isOpen, onClose, onPaymentSuccess }) {
  const { formatMoney, currencySymbol } = useAuth();
  
  // Payment channel tabs: 'mfs' (Mobile Banking), 'card' (Cards), 'netbanking' (Internet Banking)
  const [activeTab, setActiveTab] = useState('mfs');
  const [selectedMfs, setSelectedMfs] = useState('bkash'); // 'bkash' | 'nagad' | 'rocket' | 'upay'
  const [selectedBank, setSelectedBank] = useState('city'); // 'city' | 'islami' | 'brac' | 'ebl'
  
  // MFS Form state
  const [mfsNumber, setMfsNumber] = useState('01712345678');
  const [mfsStep, setMfsStep] = useState(1); // 1: number, 2: otp, 3: pin
  const [mfsOtp, setMfsOtp] = useState('784912');
  const [mfsPin, setMfsPin] = useState('12345');

  // Card Form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('তানভীর আহমেদ');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Internet Banking Form state
  const [bankUserId, setBankUserId] = useState('student_user_bd');
  const [bankPassword, setBankPassword] = useState('••••••••');

  // Processing & result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  // Initialize SSLCommerz session when modal opens
  useEffect(() => {
    if (isOpen && invoice) {
      setError('');
      setPaymentResult(null);
      setMfsStep(1);
      
      // Pre-fill student name
      if (invoice.student?.name) {
        setCardHolder(invoice.student.name);
      }

      // Initialize session
      api.initSSLCommerz(invoice.id, {
        customerName: invoice.student?.name,
        customerEmail: invoice.student?.email,
        customerPhone: invoice.student?.phone || '01712345678'
      }).then(res => {
        if (res.status === 'SUCCESS') {
          setSessionData(res);
        }
      }).catch(err => {
        console.warn('SSLCommerz init warning:', err);
      });
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const handleFillDemoCard = () => {
    setCardNumber('4242 8899 7766 4242');
    setCardHolder(invoice.student?.name || 'তানভীর আহমেদ (Alex Rivera)');
    setCardExpiry('06/29');
    setCardCvv('742');
  };

  const handleFillDemoMfs = (type) => {
    setSelectedMfs(type);
    if (type === 'bkash') setMfsNumber('01712345678');
    if (type === 'nagad') setMfsNumber('01898765432');
    if (type === 'rocket') setMfsNumber('019123456789');
    if (type === 'upay') setMfsNumber('01611223344');
  };

  const handleExecutePayment = async () => {
    setError('');
    setLoading(true);

    try {
      // Simulate real bank/gateway roundtrip
      await new Promise(r => setTimeout(r, 1400));

      const channelName = 
        activeTab === 'mfs' ? `${selectedMfs.toUpperCase()} (MFS)` :
        activeTab === 'card' ? (cardNumber.startsWith('4') ? 'VISA Card' : 'MasterCard') :
        `Internet Banking (${selectedBank.toUpperCase()})`;

      const payload = {
        invoiceId: invoice.id,
        tran_id: sessionData?.tran_id || `SSLCZ_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        val_id: `SSLCZ_VAL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paymentMethod: 'sslcommerz',
        channel: channelName,
        mobileNumber: activeTab === 'mfs' ? mfsNumber : undefined,
        cardDetails: activeTab === 'card' ? {
          brand: cardNumber.startsWith('4') ? 'Visa' : 'MasterCard',
          last4: cardNumber.replace(/\s+/g, '').slice(-4),
          name: cardHolder
        } : undefined
      };

      const result = await api.validateSSLCommerz(payload);

      if (result.success) {
        setPaymentResult(result);
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.55 }
        });
        if (result.invoice) {
          autoBackupRecord('invoices', result.invoice);
        }
        if (onPaymentSuccess) {
          onPaymentSuccess(result.invoice);
        }
      } else {
        setError(result.error || 'SSLCommerz gateway could not authorize transaction.');
      }
    } catch (err) {
      console.error('SSLCommerz execution error:', err);
      setError('পেমেন্ট গেটওয়েতে সংযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
        
        {/* SSLCommerz Official Branded Header */}
        <div className="bg-gradient-to-r from-[#990000] via-[#c4161c] to-[#e61e24] text-white p-5 sm:p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white px-3 py-1.5 rounded-xl shadow-md flex items-center">
                <span className="text-sm font-black tracking-tight text-[#c4161c]">SSL</span>
                <span className="text-sm font-black tracking-tight text-slate-800">COMMERZ</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    নিরাপদ পেমেন্ট গেটওয়ে (SSLCommerz)
                  </h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-black bg-amber-400 text-amber-950 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-900" />
                    <span>SSLCommerz Demo Sandbox</span>
                  </span>
                </div>
                <p className="text-xs text-red-100 font-medium">
                  বাংলাদেশ ব্যাংক অনুমোদিত জাতীয় পেমেন্ট গেটওয়ে • স্যান্ডবক্স ডেমো টেস্ট মোড
                </p>
              </div>
            </div>

            <div className="text-right bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
              <span className="text-[10px] text-red-100 font-bold block uppercase tracking-wider">
                পরিশোধযোগ্য সর্বমোট (Total Due)
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {formatMoney(invoice.amount)}
              </span>
            </div>
          </div>

          {/* Quick Invoice Details Strip */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between text-xs text-red-100 gap-2">
            <div>
              <span className="opacity-80">ইনভয়েস: </span>
              <span className="font-mono font-bold text-white">{invoice.invoiceNumber}</span>
              <span className="mx-2 opacity-50">|</span>
              <span className="opacity-80">কোর্স: </span>
              <span className="font-bold text-white">{invoice.title}</span>
            </div>
            <div>
              <span className="opacity-80">শিক্ষার্থী: </span>
              <span className="font-bold text-white">{invoice.student?.name || 'শিক্ষার্থী'}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {paymentResult ? (
            /* Success Receipt Screen */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                  Payment Verified (সফলভাবে পরিশোধিত)
                </span>
                <h4 className="text-2xl font-black text-slate-900 mt-2">
                  ৳{invoice.amount} টাকা গৃহীত হয়েছে!
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  এসএসএলকমার্জ (SSLCommerz) ভেরিফায়েড গেটওয়ের মাধ্যমে পেমেন্ট সম্পন্ন হয়েছে।
                </p>
              </div>

              {/* Official SSLCommerz Receipt Slip */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left shadow-sm space-y-3 font-sans max-w-md mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#c4161c]">SSLCOMMERZ</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">VALID</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ট্রানজেকশন আইডি (Tran ID):</span>
                    <span className="font-mono font-bold text-slate-800">{paymentResult.payment?.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ভ্যালিডেশন আইডি (Val ID):</span>
                    <span className="font-mono font-bold text-slate-800">{paymentResult.payment?.val_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">পেমেন্ট চ্যানেল (Channel):</span>
                    <span className="font-bold text-indigo-600">{paymentResult.payment?.channel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ব্যাংক রেফারেন্স (Bank Ref):</span>
                    <span className="font-mono text-slate-600">{paymentResult.payment?.bank_tran_id}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm">
                    <span className="text-slate-800">পরিশোধিত অর্থ (Amount Paid):</span>
                    <span className="text-emerald-600 font-mono">{formatMoney(invoice.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  রসিদ ডাউনলোড / প্রিন্ট
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  সম্পন্ন (Done)
                </button>
              </div>
            </div>
          ) : (
            /* Gateway Selection & Form */
            <div className="space-y-4">
              
              {/* SSLCommerz Demo Interactive Helper Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold shrink-0">⚡</span>
                  <div>
                    <strong className="text-amber-950 font-bold block">SSLCommerz ডেমো স্যান্ডবক্স সক্রিয়:</strong>
                    <span className="text-[11px] text-amber-800">টেস্ট করার জন্য নিচের বাটন চাপলে ডেমো ডাটা অটো বসে যাবে:</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('mfs');
                      handleFillDemoMfs('bkash');
                      setMfsStep(3);
                    }}
                    className="px-2.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
                  >
                    ডেমো bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('mfs');
                      handleFillDemoMfs('nagad');
                      setMfsStep(3);
                    }}
                    className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
                  >
                    ডেমো Nagad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('card');
                      handleFillDemoCard();
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
                  >
                    ডেমো Card
                  </button>
                </div>
              </div>

              {/* Payment Channel Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('mfs')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'mfs'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-pink-600" />
                  <span>মোবাইল ব্যাংকিং (MFS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'card'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>কার্ড (Cards)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('netbanking')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'netbanking'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>নেট ব্যাংকিং</span>
                </button>
              </div>

              {/* TAB 1: Mobile Banking (bKash, Nagad, Rocket, Upay) */}
              {activeTab === 'mfs' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* MFS Provider Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    {/* bKash */}
                    <button
                      type="button"
                      onClick={() => handleFillDemoMfs('bkash')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        selectedMfs === 'bkash'
                          ? 'border-[#E2136E] bg-pink-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full bg-[#E2136E]" />
                        {selectedMfs === 'bkash' && <Check className="w-4 h-4 text-[#E2136E]" />}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-extrabold text-[#E2136E]">বিকাশ (bKash)</p>
                        <p className="text-[10px] text-slate-500">ইনস্ট্যান্ট পেমেন্ট</p>
                      </div>
                    </button>

                    {/* Nagad */}
                    <button
                      type="button"
                      onClick={() => handleFillDemoMfs('nagad')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        selectedMfs === 'nagad'
                          ? 'border-[#F7941D] bg-orange-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full bg-[#F7941D]" />
                        {selectedMfs === 'nagad' && <Check className="w-4 h-4 text-[#F7941D]" />}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-extrabold text-[#F7941D]">নগদ (Nagad)</p>
                        <p className="text-[10px] text-slate-500">ডাক বিভাগীয় ডিজিটাল</p>
                      </div>
                    </button>

                    {/* Rocket */}
                    <button
                      type="button"
                      onClick={() => handleFillDemoMfs('rocket')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        selectedMfs === 'rocket'
                          ? 'border-[#8C3494] bg-purple-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full bg-[#8C3494]" />
                        {selectedMfs === 'rocket' && <Check className="w-4 h-4 text-[#8C3494]" />}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-extrabold text-[#8C3494]">রকেট (Rocket)</p>
                        <p className="text-[10px] text-slate-500">DBBL 12-ডিজিট</p>
                      </div>
                    </button>

                    {/* Upay */}
                    <button
                      type="button"
                      onClick={() => handleFillDemoMfs('upay')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        selectedMfs === 'upay'
                          ? 'border-[#003366] bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full bg-[#003366]" />
                        {selectedMfs === 'upay' && <Check className="w-4 h-4 text-[#003366]" />}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-extrabold text-[#003366]">উপায় (Upay)</p>
                        <p className="text-[10px] text-slate-500">UCB ডিজিটাল ওয়ালেট</p>
                      </div>
                    </button>

                  </div>

                  {/* Interactive MFS Checkout Box */}
                  <div className={`p-5 rounded-2xl border ${
                    selectedMfs === 'bkash' ? 'bg-pink-50/40 border-pink-200' :
                    selectedMfs === 'nagad' ? 'bg-orange-50/40 border-orange-200' :
                    selectedMfs === 'rocket' ? 'bg-purple-50/40 border-purple-200' :
                    'bg-blue-50/40 border-blue-200'
                  } space-y-4`}>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-800">
                          {selectedMfs.toUpperCase()} গেটওয়ে অথেনটিকেশন
                        </span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-slate-600 border border-slate-200">
                          ধাপ {mfsStep} / 3
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">মার্চেন্ট: EduTrack BD</span>
                    </div>

                    {mfsStep === 1 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            আপনার {selectedMfs.toUpperCase()} একাউন্ট নম্বর দিন
                          </label>
                          <input
                            type="text"
                            value={mfsNumber}
                            onChange={(e) => setMfsNumber(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm bg-white"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          আপনার নম্বরে একটি ৬-ডিজিটের গোপন ওটিপি কোড পাঠানো হবে।
                        </p>
                        <button
                          type="button"
                          onClick={() => setMfsStep(2)}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <span>পরবর্তী ধাপে যান (ওটিপি গ্রহণ করুন)</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {mfsStep === 2 && (
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-700">
                              এসএমএস ওটিপি কোড (OTP Verification Code)
                            </label>
                            <span className="text-[11px] text-slate-500 font-mono">নম্বর: {mfsNumber}</span>
                          </div>
                          <input
                            type="text"
                            value={mfsOtp}
                            onChange={(e) => setMfsOtp(e.target.value)}
                            placeholder="6-digit OTP (e.g. 784912)"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm text-center tracking-widest bg-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMfsStep(1)}
                            className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                          >
                            পেছনে
                          </button>
                          <button
                            type="button"
                            onClick={() => setMfsStep(3)}
                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <span>ওটিপি যাচাই ও পিন ধাপে যান</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {mfsStep === 3 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {selectedMfs.toUpperCase()} একাউন্ট পিন (PIN)
                          </label>
                          <input
                            type="password"
                            value={mfsPin}
                            onChange={(e) => setMfsPin(e.target.value)}
                            placeholder="Enter 5-digit PIN"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm text-center tracking-widest bg-white"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          🔒 আপনার পিন সম্পূর্ণ এনক্রিপ্টেড ও SSLCommerz গেটওয়ের মাধ্যমে সরাসরি প্রক্রিয়াকৃত হয়।
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMfsStep(2)}
                            className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                          >
                            পেছনে
                          </button>
                          <button
                            type="button"
                            onClick={handleExecutePayment}
                            disabled={loading}
                            className={`flex-1 py-3 rounded-xl text-xs font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                              selectedMfs === 'bkash' ? 'bg-[#E2136E] hover:bg-[#c90f5f]' :
                              selectedMfs === 'nagad' ? 'bg-[#F7941D] hover:bg-[#e07f0f]' :
                              selectedMfs === 'rocket' ? 'bg-[#8C3494] hover:bg-[#772b7e]' :
                              'bg-[#003366] hover:bg-[#002244]'
                            }`}
                          >
                            {loading ? (
                              <>
                                <RotateCw className="w-4 h-4 animate-spin" />
                                <span>SSLCommerz পেমেন্ট প্রসেসিং হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" />
                                <span>{selectedMfs.toUpperCase()} দিয়ে পরিশোধ করুন {formatMoney(invoice.amount)}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* TAB 2: Cards (VISA, Mastercard, DBBL Nexus, Amex) */}
              {activeTab === 'card' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Card Brand Badges & Demo fill */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-900 text-white rounded text-[10px] font-black tracking-wider">VISA</span>
                      <span className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-black tracking-wider">Mastercard</span>
                      <span className="px-2 py-1 bg-emerald-700 text-white rounded text-[10px] font-black tracking-wider">Nexus</span>
                      <span className="px-2 py-1 bg-sky-700 text-white rounded text-[10px] font-black tracking-wider">Amex</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleFillDemoCard}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      টেস্ট কার্ড পূরণ
                    </button>
                  </div>

                  {/* Card Inputs */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        কার্ড নম্বর (Card Number)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        কার্ডধারীর নাম (Cardholder Name)
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on Card"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          মেয়াদ উত্তীর্ণ (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          সিভিভি / সিভিসি (CVV)
                        </label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="3 digits"
                          maxLength={4}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-center tracking-widest"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#990000] to-[#c4161c] hover:from-[#800000] hover:to-[#b0141a] text-white rounded-xl text-sm font-black shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>SSLCommerz কার্ড চার্জ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>কার্ড দিয়ে নিশ্চিত করুন {formatMoney(invoice.amount)}</span>
                      </>
                    )}
                  </button>

                </div>
              )}

              {/* TAB 3: Net Banking (City Touch, Islami Bank, BRAC Bank, EBL) */}
              {activeTab === 'netbanking' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'city', name: 'City Touch (The City Bank)', color: 'text-red-700' },
                      { id: 'islami', name: 'Islami Bank iBanking', color: 'text-emerald-700' },
                      { id: 'brac', name: 'BRAC Bank Astha', color: 'text-blue-700' },
                      { id: 'ebl', name: 'EBL Skybanking', color: 'text-indigo-700' }
                    ].map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedBank === bank.id
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <p className={`text-xs font-bold ${bank.color}`}>{bank.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">ইন্টারনেট ব্যাংকিং পোর্টাল</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ব্যাংক অনলাইন আইডি / ইউজার আইডি
                      </label>
                      <input
                        type="text"
                        value={bankUserId}
                        onChange={(e) => setBankUserId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ইন্টারনেট ব্যাংকিং পাসওয়ার্ড
                      </label>
                      <input
                        type="password"
                        value={bankPassword}
                        onChange={(e) => setBankPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-black shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>ব্যাংক পোর্টালে যাচাই হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>ইন্টারনেট ব্যাংকিং দিয়ে পরিশোধ {formatMoney(invoice.amount)}</span>
                      </>
                    )}
                  </button>

                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Footer Trust Marks */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SSLCommerz 256-Bit SSL দ্বারা সম্পূর্ণ সুরক্ষিত</span>
                </div>
                <span className="font-mono text-slate-400">Merchant Store: EduTrack BD</span>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
