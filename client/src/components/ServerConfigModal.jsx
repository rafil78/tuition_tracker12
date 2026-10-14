import React, { useState } from 'react';
import { 
  X, Server, Globe, Wifi, Check, AlertCircle, RefreshCw, 
  Database, Download, Upload, RotateCcw, HardDrive, ShieldCheck
} from 'lucide-react';
import { setServerUrl, api } from '../api';
import { offlineDb } from '../offlineDb';

export default function ServerConfigModal({ isOpen, onClose }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('edutrack_server_url');
    if (!saved || saved === 'offline') return 'offline';
    if (saved.includes('192.168.')) return 'local';
    return 'custom';
  });

  const [customUrl, setCustomUrl] = useState(() => {
    const saved = localStorage.getItem('edutrack_server_url');
    return (saved && saved !== 'offline') ? saved : 'https://tuition-tracker12.onrender.com';
  });

  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'failed'
  const [testMsg, setTestMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  if (!isOpen) return null;

  const dbStats = offlineDb.getStats();
  const totalClasses = offlineDb.getAll('classes').length;
  const totalInvoices = offlineDb.getAll('invoices').length;
  const totalAttendance = offlineDb.getAll('attendance').length;

  const handleTestConnection = async (targetUrl) => {
    setTestStatus('testing');
    setTestMsg('সার্ভারে যোগাযোগ করা হচ্ছে...');
    try {
      const url = targetUrl.replace(/\/$/, '') + '/api/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setTestStatus('success');
        setTestMsg('✅ সার্ভার সক্রিয় ও সফলভাবে সংযুক্ত!');
      } else {
        setTestStatus('failed');
        setTestMsg(`⚠️ সার্ভার রেসপন্স কোড: ${res.status}`);
      }
    } catch (err) {
      setTestStatus('failed');
      setTestMsg('❌ সার্ভারে সংযোগ পাওয়া যায়নি। অফলাইন মোড ব্যবহার করতে পারেন।');
    }
  };

  const handleSave = (selectedMode) => {
    if (selectedMode === 'offline') {
      setServerUrl('offline');
    } else if (selectedMode === 'local') {
      setServerUrl('http://192.168.1.5:5000');
    } else {
      setServerUrl(customUrl.trim());
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
      setActionMsg('✅ অফলাইন ডাটা সফলভাবে ব্যাকআপ ফাইল আকারে ডাউনলোড হয়েছে!');
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
    if (!window.confirm('আপনি কি অফলাইন ডাটাবেস প্রাথমিক ডেমো অবস্থায় রিসেট করতে চান?')) return;
    api.resetData();
    setActionMsg('✅ অফলাইন ডাটাবেস সফলভাবে ফ্যাক্টরি ডেমো ডেটায় রিসেট হয়েছে!');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn text-slate-800">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">অফলাইন ও সার্ভার সেটিংস (App Mode)</h3>
              <p className="text-[11px] text-slate-400">অ্যাপটি সম্পূর্ণ অফলাইনে ডিভাইস মেমোরিতে চলবে নাকি সার্ভারের সাথে সিঙ্ক করবে</p>
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
          
          {/* Mode Selector */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              কানেকশন মোড নির্ধারণ করুন
            </label>

            {/* Option 1: Standalone Offline Mode */}
            <button
              type="button"
              onClick={() => { setMode('offline'); setTestStatus(null); }}
              className={`w-full p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                mode === 'offline' 
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900">⚡ ট্রু অফলাইন মোড (সম্পূর্ণ ইন্টারনেটবিহীন)</h4>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">সুপারফাস্ট / জিরো ল্যাগ</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  কোনো সার্ভার বা ইন্টারনেটের প্রয়োজন নেই। সব ব্যাচ, শিক্ষার্থী, হাজিরা, পরীক্ষার ফলাফল ও ফি আপনার ডিভাইসেই সংরক্ষিত থাকবে এবং নিমিষেই লোড হবে।
                </p>
              </div>
            </button>

            {/* Option 2: Local Wi-Fi PC Server */}
            <button
              type="button"
              onClick={() => { 
                setMode('local'); 
                handleTestConnection('http://192.168.1.5:5000'); 
              }}
              className={`w-full p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                mode === 'local' 
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">📡 লোকাল ওয়াইফাই পিসি সার্ভার (Local Wi-Fi)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  কম্পিউটার ও মোবাইল একই ওয়াইফাই-তে থাকলে কম্পিউটারের নোড সার্ভারে (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">192.168.1.5:5000</code>) রিয়েলটাইম সিঙ্ক হবে।
                </p>
              </div>
            </button>

            {/* Option 3: Custom Cloud Render Server */}
            <button
              type="button"
              onClick={() => { setMode('custom'); setTestStatus(null); }}
              className={`w-full p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                mode === 'custom' 
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div className="w-full">
                <h4 className="font-bold text-xs text-slate-900">☁️ অনলাইন ক্লাউড সার্ভার (Render / Web URL)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Render বা ক্লাউডে ডেপ্লয় করা কেন্দ্রীয় সার্ভারের মাধ্যমে অনলাইন সিঙ্ক।
                </p>
                
                {mode === 'custom' && (
                  <div className="mt-2.5 space-y-2">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://tuition-tracker12.onrender.com"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleTestConnection(customUrl)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-300 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>সংযোগ পরীক্ষা করুন</span>
                    </button>
                  </div>
                )}
              </div>
            </button>
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

          {/* Offline Storage Live Overview Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>ডিভাইস অফলাইন স্টোরেজ স্ট্যাটাস</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded font-bold">
                LocalStorage
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <p className="text-xs font-bold text-slate-900">{totalClasses}</p>
                <p className="text-[10px] text-slate-500">ব্যাচ</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <p className="text-xs font-bold text-slate-900">{dbStats.totalStudents}</p>
                <p className="text-[10px] text-slate-500">শিক্ষার্থী</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <p className="text-xs font-bold text-slate-900">{totalInvoices}</p>
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
              বাতিল
            </button>
            <button
              type="button"
              onClick={() => handleSave(mode)}
              className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
            >
              সেভ ও প্রয়োগ করুন
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
