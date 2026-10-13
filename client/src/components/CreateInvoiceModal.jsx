import React, { useState } from 'react';
import { X, DollarSign, Calendar, User, BookOpen, Tag, Percent, Sparkles, Check } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { autoBackupRecord } from '../firestoreSync';

export default function CreateInvoiceModal({ isOpen, onClose, onCreated, students, classes }) {
  const { currencySymbol, formatMoney } = useAuth();
  const [studentId, setStudentId] = useState(students?.[0]?.id || '');
  const [classId, setClassId] = useState(classes?.[0]?.id || '');
  const [title, setTitle] = useState('');
  const [originalAmount, setOriginalAmount] = useState(classes?.[0]?.monthlyFee ? String(classes[0].monthlyFee) : '3000');
  const [billingMonth, setBillingMonth] = useState('November 2026');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  
  // Discount states
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState('10');
  const [discountReason, setDiscountReason] = useState('Early Bird / Merit Discount');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Compute discount and final amount
  const orig = Number(originalAmount) || 0;
  let computedDiscount = 0;
  let discPercent = 0;

  if (discountType === 'percent') {
    discPercent = Number(discountValue) || 0;
    computedDiscount = Math.round((orig * discPercent) / 100);
  } else if (discountType === 'fixed') {
    computedDiscount = Number(discountValue) || 0;
    discPercent = orig > 0 ? Math.round((computedDiscount / orig) * 100) : 0;
  }

  const finalAmount = Math.max(0, orig - computedDiscount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !originalAmount) return;
    setLoading(true);

    try {
      const selectedClass = classes.find(c => c.id === classId);
      const invoiceTitle = title || `${selectedClass?.title || 'Tuition'} - ${billingMonth} Fee`;
      
      const res = await api.createInvoice({
        studentId,
        classId,
        title: invoiceTitle,
        originalAmount: orig,
        discountPercent: discPercent,
        discountAmount: computedDiscount,
        discountReason: discountType !== 'none' ? discountReason : '',
        amount: finalAmount,
        billingMonth,
        dueDate
      });

      // Auto-backup to Cloud Firestore in background
      if (res?.invoice) {
        autoBackupRecord('invoices', res.invoice);
      }

      if (onCreated) onCreated(res);
      onClose();
    } catch (err) {
      console.error('Failed to create invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div>
            <h3 className="text-lg font-bold">Generate Student Tuition Invoice</h3>
            <p className="text-xs text-indigo-100">Apply tuition fee with customizable discounts and due dates</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Select Student
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade || 'Student'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Associated Tuition Batch
            </label>
            <select
              value={classId}
              onChange={e => {
                setClassId(e.target.value);
                const cls = classes.find(c => c.id === e.target.value);
                if (cls) setOriginalAmount(String(cls.monthlyFee || 3000));
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} — {formatMoney(c.monthlyFee)}/month
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Original Fee ({currencySymbol})
              </label>
              <input
                type="number"
                value={originalAmount}
                onChange={e => setOriginalAmount(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Month</label>
              <input
                type="text"
                value={billingMonth}
                onChange={e => setBillingMonth(e.target.value)}
                placeholder="e.g. November 2026"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* ================= APPLIED DISCOUNT SECTION ================= */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Apply Student Tuition Discount
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Waiver Option
              </span>
            </div>

            {/* Discount Type Radio / Toggle */}
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { id: 'none', label: 'No Discount' },
                { id: 'percent', label: 'Percentage (%)' },
                { id: 'fixed', label: `Fixed (${currencySymbol})` }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDiscountType(opt.id)}
                  className={`py-1.5 px-2 rounded-lg font-bold border transition-all text-center ${
                    discountType === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {discountType !== 'none' && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      {discountType === 'percent' ? 'Discount Rate (%)' : `Discount Amount (${currencySymbol})`}
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      min="1"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg font-mono font-bold text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Discount Reason / Note
                    </label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={e => setDiscountReason(e.target.value)}
                      placeholder="e.g. Sibling Discount / Merit Waiver"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg text-emerald-900"
                    />
                  </div>
                </div>

                {/* Calculation Summary Card */}
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Fee:</span>
                    <span className="font-mono">{formatMoney(orig)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-{formatMoney(computedDiscount)} ({discountReason})</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1 text-sm">
                    <span>Payable Amount:</span>
                    <span className="font-mono text-emerald-700">{formatMoney(finalAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Payment Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Title / Note (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Higher Mathematics - November 2026 Batch"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Payable</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {formatMoney(finalAmount)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Issue Invoice'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
