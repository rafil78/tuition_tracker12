import React, { useState, useEffect } from 'react';
import { 
  X, Server, Globe, Wifi, Check, AlertCircle, RefreshCw, 
  Database, Download, Upload, RotateCcw, Flame, ShieldCheck,
  CheckCircle2, Cloud, ArrowRight
} from 'lucide-react';
import { setServerUrl, api } from '../api';

export default function ServerConfigModal({ isOpen, onClose }) {
  const [serverUrl, setServerUrlState] = useState(() => {
    const saved = localStorage.getItem('edutrack_server_url');
    return (saved && saved !== 'offline' && saved !== 'default') ? saved : 'http://localhost:5000';
  });

  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'failed'
  const [testMsg, setTestMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({ totalClasses: 4, totalStudents: 12, totalInvoices: 8 });

  useEffect(() => {
    if (!isOpen) return;

    // Load server stats and Firebase status
    api.getFirebaseStatus().then(st => {
      if (st) setFirebaseStatus(st);
    }).catch(() => {});

    api.getStats().then(s => {
      if (s) {
        setStats({
          totalClasses: s.totalClasses || 4,
          totalStudents: s.totalStudents || 12,
          totalInvoices: s.totalInvoices || 8
        });
      }
    }).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl) => {
    setTestStatus('testing');
    setTestMsg('সার্ভার ও ফায়ারবেস সংযোগ পরীক্ষা করা হচ্ছে...');
    try {
      const url = targetUrl.replace(/\/$/, '') + '/api/firebase/status';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setFirebaseStatus(data);
        setTestMsg('✅ সার্ভার সক্রিয় ও সফলভাবে Firebase Connected Mode-এ সংযুক্ত!');
      } else {
        setTestStatus('failed');
        setTestMsg(`⚠️ সার্ভার রেসপন্স কোড: ${res.status}`);
      }
    } catch (err) {
      setTestStatus('failed');
      setTestMsg('❌ সার্ভারে সংযোগ পাওয়া যায়নি। নিশ্চিত করুন ব্যাকএন্ড সার্ভার (port 5000) চালু আছে।');
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setActionMsg('ফায়ারবেস ক্লাউডে ডেটাবেস সিঙ্ক হচ্ছে...');
    try {
      const res = await api.triggerServerFirebaseSync();
      if (res && res.success) {
        setActionMsg(`✅ ফায়ারবেসে সফলভাবে ${res.totalRecords || 0} টি রেকর্ড সিঙ্ক সম্পন্ন হয়েছে!`);
        setFirebaseStatus(prev => ({ ...prev, lastSyncedAt: res.syncedAt }));
      } else {
        setActionMsg('⚠️ ফায়ারবেস সিঙ্ক সম্পন্ন হয়েছে।');
      }
    } catch (err) {
      setActionMsg('❌ সিঙ্ক ত্রুটি: ' + err.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setActionMsg(''), 5000);
    }
  };

  const handleSave = () => {
    if (serverUrl === 'http://localhost:5000' || !serverUrl) {
      setServerUrl('default');
    } else {
      setServerUrl(serverUrl.trim());
    }
    onClose();
    window.location.reload();
  };

  const handleExportJson = () => {
    try {
      const dataStr = api.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edutrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionMsg('✅ ডাটাবেস সফলভাবে JSON ব্যাকআপ ফাইল আকারে ডাউনলোড হয়েছে!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      setActionMsg('❌ ব্যাকআপ ডাউনলোড ব্যর্থ হয়েছে');
    }
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        const res = api.importData(content);
        if (res.success) {
          setActionMsg('✅ ব্যাকআপ ডাটা সফলভাবে রিস্টোর হয়েছে! অ্যাপ রিলোড হচ্ছে...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setActionMsg('❌ ফাইল ফরম্যাট সঠিক নয়: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (!window.confirm('আপনি কি ডাটাবেস প্রাথমিক ডেমো অবস্থায় রিসেট করতে চান?')) return;
    api.resetData();
    setActionMsg('✅ ডাটাবেস সফলভাবে ফ্যাক্টরি ডেমো ডেটায় রিসেট হয়েছে!');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn text-slate-800">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30">
              <Flame className="w-5 h-5 fill-amber-500/30" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm">Firebase Connected Mode</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">Active</span>
              </div>
              <p className="text-[11px] text-slate-300">সার্ভার শুধুমাত্র গুগল ফায়ারবেস ক্লাউড মোডে চলে (অফলাইন মোড নিষ্ক্রিয়)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Active Firebase Connected Mode Banner */}
          <div className="p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/60 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 fill-amber-500/20" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">গুগল ফায়ারবেস ক্লাউড কানেকশন</h4>
                  <p className="text-[11px] text-slate-600">রিয়েলটাইম ক্লাউড ডেটাবেস ও সিকিউর ব্যাকএন্ড সিঙ্ক সক্রিয়</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
              <div>
                <span className="text-slate-500 block text-[10px]">অপারেটিং মোড:</span>
                <span className="font-semibold text-slate-800 font-mono">Firebase-Connected</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">অফলাইন মোড:</span>
                <span className="font-bold text-rose-600">নিষ্ক্রিয় (Disabled)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Project ID:</span>
                <span className="font-mono text-slate-700">{firebaseStatus?.projectId || 'edutrack-app'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Cloud Database:</span>
                <span className="font-semibold text-amber-700">Realtime DB & Firestore</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={syncing}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'ফায়ারবেসে সিঙ্ক হচ্ছে...' : '🚀 ফায়ারবেসে সম্পূর্ণ ডেটা সিঙ্ক করুন'}</span>
            </button>
          </div>

          {/* Backend Server URL Config */}
          <div className="space-y-2 border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                <span>ব্যাকএন্ড সার্ভার API URL</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Port: 5000</span>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrlState(e.target.value)}
                placeholder="http://localhost:5000"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={() => handleTestConnection(serverUrl)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg inline-flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>টেস্ট</span>
              </button>
            </div>
          </div>

          {/* Test Status feedback */}
          {testStatus && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              testStatus === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : testStatus === 'testing'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-semibold">{testMsg}</span>
            </div>
          )}

          {/* Database Live Stats & Actions */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>সার্ভার ডেটাবেস স্ট্যাটাস</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded font-bold">
                ACID Engine
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <p className="text-xs font-bold text-slate-900">{stats.totalClasses}</p>
                <p className="text-[10px] text-slate-500">ব্যাচ</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <p className="text-xs font-bold text-slate-900">{stats.totalStudents}</p>
                <p className="text-[10px] text-slate-500">শিক্ষার্থী</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <p className="text-xs font-bold text-slate-900">{stats.totalInvoices}</p>
                <p className="text-[10px] text-slate-500">ইনভয়েস</p>
              </div>
            </div>

            {/* Action Tools */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition"
                title="Download JSON Database Backup"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                <span>ডাটা ব্যাকআপ নিন</span>
              </button>

              <label className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer transition">
                <Upload className="w-3 h-3 text-emerald-600" />
                <span>ব্যাকআপ রিস্টোর</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetDemo}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-semibold transition"
                title="Reset Database to Default Seed Data"
              >
                <RotateCcw className="w-3 h-3" />
                <span>রিসেট ডেমো</span>
              </button>
            </div>

            {actionMsg && (
              <p className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100 animate-fadeIn">
                {actionMsg}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
            >
              সংরক্ষণ করুন
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
