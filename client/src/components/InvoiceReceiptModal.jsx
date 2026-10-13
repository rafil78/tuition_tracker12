import React, { useState } from 'react';
import { 
  X, Printer, CheckCircle2, Clock, AlertTriangle, GraduationCap, 
  Building2, Tag, QrCode, Copy, Check, ShieldCheck, CreditCard, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InvoiceReceiptModal({ invoice, isOpen, onClose, onPayNow }) {
  const { formatMoney, currencySymbol } = useAuth();
  const [copied, setCopied] = useState(false);
  if (!isOpen || !invoice) return null;

  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/invoice/${invoice.id || invoice.invoiceNumber}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Preview</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isPaid ? 'bg-emerald-100 text-emerald-800' : isOverdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {invoice.status?.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              title="ডিজিটাল ইনভয়েস লিংক কপি করুন"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি লিংক'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট / PDF
            </button>
            {!isPaid && onPayNow && (
              <button
                onClick={() => {
                  onClose();
                  onPayNow(invoice);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                এখনই পে করুন
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 font-sans print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">EduTrack Academy</h1>
                <p className="text-xs text-slate-500 font-semibold">ডিজিটাল টিউশন ও অ্যাকাডেমিক ম্যানেজমেন্ট ইনভয়েস</p>
                <p className="text-[11px] text-slate-400 mt-0.5">billing@edutrack.com • +880 1712-345678</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-end gap-1.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>{isPaid ? 'ডিজিটাল মানি রিসিট' : 'ডিজিটাল টিউশন ইনভয়েস'}</span>
              </div>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-1">{invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-0.5">তারিখ: {new Date(invoice.createdAt).toLocaleDateString('bn-BD')}</p>
            </div>
          </div>

          {/* Parties Meta */}
          <div className="grid grid-cols-2 gap-8 mb-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">প্রাপক শিক্ষার্থী (Billed To)</span>
              <p className="text-sm font-bold text-slate-800">{invoice.student?.name || 'তানভীর আহমেদ'}</p>
              <p className="text-slate-600">{invoice.student?.email || 'student@edutrack.com'}</p>
              <p className="text-slate-500 font-mono">{invoice.student?.phone || '+880 1819-234567'}</p>
              {invoice.student?.grade && <p className="text-indigo-600 font-semibold mt-0.5">{invoice.student?.grade}</p>}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">টিউটর বিবরণ (Instructor)</span>
              <p className="text-sm font-bold text-slate-800">{invoice.teacher?.name || 'ড. রশিদুল করিম'}</p>
              <p className="text-slate-600">{invoice.teacher?.title || 'উচ্চতর গণিত ও পদার্থবিজ্ঞান বিশেষজ্ঞ'}</p>
              <p className="text-slate-500 font-mono">পরিশোধের শেষ সময়: <strong className="text-slate-800">{invoice.dueDate}</strong></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">আইটেম ও বিবরণ (Description)</th>
                  <th className="py-3 px-4 text-center">বিলিং সাইকেল</th>
                  <th className="py-3 px-4 text-right">পরিমাণ (BDT ৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800 text-sm">{invoice.title}</p>
                    <p className="text-slate-500 text-[11px]">{invoice.class?.title || 'উচ্চতর গণিত ও বিজ্ঞান কোর্স'}</p>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {invoice.billingMonth || 'চলতি মাস'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatMoney(invoice.originalAmount || invoice.amount)}
                  </td>
                </tr>

                {invoice.discountAmount > 0 && (
                  <tr className="bg-emerald-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ফি কর্তন / ক্রেডিট ডিসকাউন্ট (Tuition Waiver / Deduction)</span>
                      </div>
                      <p className="text-[11px] text-emerald-600">
                        {invoice.discountReason || 'শিক্ষক অনুপস্থিতি ক্রেডিট সমন্বয়'} ({invoice.discountPercent || 0}%)
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-700 text-xs font-semibold">
                      স্বয়ংক্রিয় সমন্বয়
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      -{formatMoney(invoice.discountAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals, QR Code & Digital Verification Stamp */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end border-t border-slate-200 pt-5 gap-6">
            
            {/* QR Code & Digital Hash */}
            <div className="flex items-center gap-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200 w-full sm:w-auto">
              <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=EDUTRACK-INVOICE-${invoice.invoiceNumber || invoice.id}-VERIFIED`}
                  alt="Invoice QR"
                  className="w-14 h-14"
                />
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <span className="font-bold text-slate-800 block text-xs">ডিজিটাল ভেরিফিকেশন (SSL Verified)</span>
                <p className="font-mono text-[10px] text-slate-400">HASH: #{invoice.id?.substring(0, 12).toUpperCase() || 'TXN-902'}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ SSLCommerz & bKash অনুমোদিত</span>
              </div>
            </div>

            {/* Status Stamp & Totals */}
            <div className="w-full sm:w-64 space-y-1 text-right text-xs">
              <div className="flex justify-between text-slate-500">
                <span>মূল কোর্স ফি:</span>
                <span className="font-mono">{formatMoney(invoice.originalAmount || invoice.amount)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>কর্তন / ডিসকাউন্ট:</span>
                  <span className="font-mono">-{formatMoney(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>সর্বমোট প্রদেয় / পরিশোধিত:</span>
                <span className="font-mono text-lg text-indigo-700">{formatMoney(invoice.amount)}</span>
              </div>

              <div className="pt-2 flex justify-end">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> পরিশোধ সম্পন্ন (PAID)
                  </span>
                ) : isOverdue ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" /> বকেয়া ওভারডিউ (OVERDUE)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">
                    <Clock className="w-3.5 h-3.5" /> পরিশোধ অপেক্ষমাণ (PENDING)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center border-t border-slate-100 pt-4 text-[10px] text-slate-400">
            EduTrack Digital Tuition Academy Bangladesh • এই ডিজিটাল ইনভয়েসটি সিস্টেমে স্বয়ংক্রিয়ভাবে সংরক্ষিত • billing@edutrack.com
          </div>
        </div>

      </div>
    </div>
  );
}
