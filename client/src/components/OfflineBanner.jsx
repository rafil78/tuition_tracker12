import React, { useState, useEffect } from 'react';
import { Flame, WifiOff, X, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react';
import { getConnectionMode } from '../api';

export default function OfflineBanner({ onOpenServerModal }) {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // When online, do not show any banner
  if (isOnline || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-rose-500/40 backdrop-blur-md animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-rose-500/30">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white">অফলাইন মোড সক্রিয় (Offline-First)</h4>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              মোবাইলের নিজস্ব লোকাল স্টোরেজ সক্রিয়। কোনো ইন্টারনেট বা সার্ভার ছাড়াই টিউশন, ব্যাচ ও পেমেন্ট 0ms ল্যাগে কাজ করবে।
            </p>
            {onOpenServerModal && (
              <button
                type="button"
                onClick={onOpenServerModal}
                className="mt-2 text-[10px] text-emerald-300 hover:text-emerald-200 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>সার্ভার সেটিংস কনফিগার করুন</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
