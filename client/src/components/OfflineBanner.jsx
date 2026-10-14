import React, { useState, useEffect } from 'react';
import { HardDrive, Wifi, WifiOff, X, ArrowUpRight } from 'lucide-react';
import { isOfflineMode, getConnectionMode } from '../api';

export default function OfflineBanner({ onOpenServerModal }) {
  const [offline, setOffline] = useState(() => isOfflineMode());
  const [dismissed, setDismissed] = useState(false);
  const [mode, setMode] = useState(() => getConnectionMode());

  useEffect(() => {
    const checkState = () => {
      setOffline(isOfflineMode());
      setMode(getConnectionMode());
    };

    window.addEventListener('online', checkState);
    window.addEventListener('offline', checkState);
    window.addEventListener('edutrack_connection_mode_changed', checkState);

    return () => {
      window.removeEventListener('online', checkState);
      window.removeEventListener('offline', checkState);
      window.removeEventListener('edutrack_connection_mode_changed', checkState);
    };
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-emerald-500/30">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white">ট্রু অফলাইন মোড সক্রিয়</h4>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              ইন্টারনেট সংযোগবিহীন অবস্থায় আপনার সব ব্যাচ, হাজিরা, পেমেন্ট ও রিপোর্ট ডিভাইস মেমোরিতে নিরাপদে সংরক্ষিত হচ্ছে।
            </p>
            {onOpenServerModal && (
              <button
                type="button"
                onClick={onOpenServerModal}
                className="mt-2 text-[10px] text-emerald-300 hover:text-emerald-200 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>মোড পরিবর্তন বা ডাটা ব্যাকআপ</span>
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
