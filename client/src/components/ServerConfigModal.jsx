import React, { useState } from 'react';
import { X, Server, Globe, Wifi, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getApiBase, setServerUrl } from '../api';

export default function ServerConfigModal({ isOpen, onClose }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('edutrack_server_url');
    if (!saved) return 'offline';
    if (saved.includes('192.168.')) return 'local';
    return 'custom';
  });

  const [customUrl, setCustomUrl] = useState(() => {
    return localStorage.getItem('edutrack_server_url') || 'https://tuition-tracker12.onrender.com';
  });

  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'failed'
  const [testMsg, setTestMsg] = useState('');

  if (!isOpen) return null;

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
        setTestMsg('✅ সার্ভার সক্রিয় ও সফলভাবে সংযুক্ত!');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn text-slate-800">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">সার্ভার সংযোগ সেটিংস (Server Connection)</h3>
              <p className="text-[11px] text-slate-400">অ্যাপটি কোন সার্ভারের সাথে ডাটা সিঙ্ক করবে নির্ধারণ করুন</p>
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
        <div className="p-5 space-y-3.5">
          
          {/* Option 1: Standalone Offline Mode */}
          <button
            type="button"
            onClick={() => { setMode('offline'); setTestStatus(null); }}
            className={`w-full p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
              mode === 'offline' 
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-slate-900">অফলাইন ডেমো মোড (সুপারফাস্ট)</h4>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">সুপারিশকৃত</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                কোনো বহিরাগত সার্ভার সংযোগের প্রয়োজন নেই। অ্যাপের সমস্ত ড্যাশবোর্ড, ছাত্র-শিক্ষক ডাটা ও ফিচার স্বয়ংক্রিয়ভাবে চলবে।
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
              <h4 className="font-bold text-xs text-slate-900">লোকাল পিসি ওয়াইফাই সংযোগ (Local Wi-Fi)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                আপনার কম্পিউটার ও মোবাইল একই ওয়াইফাই-তে থাকলে পিসির সার্ভারে (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">192.168.1.5:5000</code>) রিয়েলটাইম যুক্ত হবে।
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
              <h4 className="font-bold text-xs text-slate-900">অনলাইন ক্লাউড সার্ভার (Render / Web URL)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Render বা অন্য ক্লাউডে ডেপ্লয় করা এপিআই সার্ভারের ইউআরএল দিন।
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

          {/* Buttons */}
          <div className="pt-2 flex gap-2">
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
