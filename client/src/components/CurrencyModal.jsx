import React, { useState } from 'react';
import { X, Check, DollarSign, Globe, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CurrencyModal({ isOpen, onClose }) {
  const { settings, updateCurrency } = useAuth();
  const [currencySymbol, setCurrencySymbol] = useState(settings?.currencySymbol || '৳');
  const [currencyCode, setCurrencyCode] = useState(settings?.currencyCode || 'BDT');
  const [currencyName, setCurrencyName] = useState(settings?.currencyName || 'Bangladeshi Taka');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka (BDT)', flag: '🇧🇩' },
    { code: 'USD', symbol: '$', name: 'US Dollar (USD)', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro (EUR)', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', flag: '🇬🇧' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', flag: '🇮🇳' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)', flag: '🇦🇪' },
  ];

  const handleSelectPreset = (p) => {
    setCurrencySymbol(p.symbol);
    setCurrencyCode(p.code);
    setCurrencyName(p.name);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCurrency({
        currencyCode,
        currencySymbol,
        currencyName
      });
      onClose();
    } catch (err) {
      console.error('Failed to save currency:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Currency & Billing Settings</h3>
              <p className="text-xs text-emerald-100">Set tuition currency (Default: Bangladeshi Taka ৳)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Popular Currency Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => {
                const isSelected = currencyCode === p.code;
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.flag}</span>
                      <span>{p.code} ({p.symbol})</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Custom Currency Specification
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  placeholder="৳"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-bold text-center focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={e => setCurrencyCode(e.target.value)}
                  placeholder="BDT"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Currency Name</label>
              <input
                type="text"
                value={currencyName}
                onChange={e => setCurrencyName(e.target.value)}
                placeholder="Bangladeshi Taka"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
              className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20"
            >
              {loading ? 'Saving...' : 'Apply Currency'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
