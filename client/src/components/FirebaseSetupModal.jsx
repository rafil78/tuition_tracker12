import React, { useState, useEffect } from 'react';
import { 
  X, Flame, CheckCircle2, AlertCircle, Copy, Check, 
  ExternalLink, Key, ShieldCheck, Database, FolderUp, Globe, Save,
  RefreshCw, Cloud, UploadCloud, FileText, CheckCircle
} from 'lucide-react';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  isFirebaseConfigured, 
  app, 
  auth,
  db,
  rtdb,
  storage,
  uploadFileToFirebase
} from '../firebase';
import { syncAllToCloudFirestore, getLastSyncStats } from '../firestoreSync';

export default function FirebaseSetupModal({ isOpen, onClose, onConfigSaved }) {
  if (!isOpen) return null;

  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('firestore'); // 'firestore' | 'storage' | 'config' | 'guide'

  // Firestore Sync State
  const [syncing, setSyncing] = useState(false);
  const [syncStatusStep, setSyncStatusStep] = useState('');
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState('');
  const [lastSyncStats, setLastSyncStats] = useState(getLastSyncStats());

  // Storage Test State
  const [testUploading, setTestUploading] = useState(false);
  const [testUploadProgress, setTestUploadProgress] = useState(0);
  const [testUploadSuccess, setTestUploadSuccess] = useState('');
  const [testUploadError, setTestUploadError] = useState('');

  useEffect(() => {
    const current = getFirebaseConfig();
    setConfig(current);
    setLastSyncStats(getLastSyncStats());
  }, [isOpen]);

  const handleSave = (e) => {
    e.preventDefault();
    saveFirebaseConfig(config);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onConfigSaved) onConfigSaved();
      window.location.reload();
    }, 1200);
  };

  const handleSyncFirestore = async () => {
    setSyncing(true);
    setSyncError('');
    setSyncResult(null);
    setSyncStatusStep('সিঙ্ক শুরু হচ্ছে...');
    try {
      const res = await syncAllToCloudFirestore((step) => {
        setSyncStatusStep(step);
      });
      setSyncResult(res);
      setLastSyncStats(res);
    } catch (err) {
      console.error('Firestore sync failed:', err);
      setSyncError(err.message || 'Firestore সিঙ্ক ব্যর্থ হয়েছে। API কী এবং রুলস চেক করুন।');
    } finally {
      setSyncing(false);
      setSyncStatusStep('');
    }
  };

  const handleTestUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTestUploading(true);
    setTestUploadProgress(0);
    setTestUploadSuccess('');
    setTestUploadError('');

    try {
      const res = await uploadFileToFirebase(file, 'test_uploads', (p) => {
        setTestUploadProgress(p.progress);
      });
      setTestUploadSuccess(res.downloadUrl);
    } catch (err) {
      console.error('Test storage upload failed:', err);
      setTestUploadError(err.message || 'Storage আপলোড ব্যর্থ হয়েছে। Storage রুলস চেক করুন।');
    } finally {
      setTestUploading(false);
    }
  };

  const isConfigured = Boolean(config.apiKey && config.projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Flame className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Firebase Cloud Hub</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isConfigured ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40' : 'bg-white/20 text-white'
                }`}>
                  {isConfigured ? '🟢 সংযুক্ত (Connected)' : '⚪ কনফিগার করুন'}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Google Authentication • Cloud Firestore • Firebase Storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('firestore')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'firestore'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>⚡ Realtime DB ও Firestore সিঙ্ক</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>📁 Firebase Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>গাইড (Guide)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* TAB 1: CLOUD FIRESTORE & REALTIME DB SYNC */}
          {activeTab === 'firestore' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-600" />
                      <span>Firebase Realtime Database ও ক্লাউড ব্যাকআপ</span>
                    </h4>
                    <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                      টিউশন শিডিউল, শিক্ষার্থীর হাজিরা (Attendance), পেমেন্ট ইনভয়েস, স্টাডি নোটস এবং হোমওয়ার্ক সরাসরি ফায়ারবেস ক্লাউড ডেটাবেজে ব্যাকআপ ও সিঙ্ক করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {rtdb && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ⚡ Realtime DB
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      (db || rtdb) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {(db || rtdb) ? '🟢 Connected' : '⚪ Not Initialized'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sync Trigger Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">পূর্ণাঙ্গ ক্লাউড ডেটাবেজ সিঙ্ক:</span>
                    <span className="text-[11px] text-slate-500">
                      {lastSyncStats?.syncedAt 
                        ? `সর্বশেষ সিঙ্ক: ${new Date(lastSyncStats.syncedAt).toLocaleTimeString()} (${new Date(lastSyncStats.syncedAt).toLocaleDateString()})` 
                        : 'এখনো ক্লাউডে সিঙ্ক করা হয়নি'}
                    </span>
                  </div>

                  <button
                    onClick={handleSyncFirestore}
                    disabled={syncing || !isConfigured}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? (syncStatusStep || 'ফায়ারস্টোরে সিঙ্ক হচ্ছে...') : 'এখনই ফায়ারস্টোরে সিঙ্ক করুন'}</span>
                  </button>
                </div>

                {/* Progress / Success Banner */}
                {syncResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs animate-fadeIn space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>ক্লাউড ফায়ারস্টোরে সফলভাবে ডেটা ব্যাকআপ ও সিঙ্ক হয়েছে!</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-emerald-800">
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                        👥 শিক্ষক ও ছাত্র: <strong>{syncResult.usersCount || 0} জন</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                        🏫 ব্যাচ ও শিডিউল: <strong>{syncResult.classesCount} টি</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                        📅 উপস্থিতি রেকর্ড: <strong>{syncResult.attendanceCount} টি</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                        💰 পেমেন্ট ইনভয়েস: <strong>{syncResult.invoicesCount} টি</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                        📚 স্টাডি নোটস: <strong>{syncResult.studyNotesCount} টি</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                        📝 হোমওয়ার্ক: <strong>{syncResult.assignmentsCount} টি</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                        🏠 টিউশন জব রিকোয়েস্ট: <strong>{syncResult.tuitionRequestsCount || 0} টি</strong>
                      </div>
                    </div>
                  </div>
                )}

                {syncError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-2.5 animate-fadeIn">
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none">⚠️</span>
                      <div>
                        <strong className="block font-semibold">সিঙ্ক ব্যর্থ হয়েছে:</strong>
                        <p className="mt-0.5 text-rose-800">{syncError}</p>
                      </div>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-rose-100 text-[11px] text-slate-700 space-y-1">
                      <div className="font-bold text-slate-800">🛠️ দ্রুত সমাধান পদ্ধতি:</div>
                      <div>1. <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Firebase Console</a>-এ গিয়ে আপনার প্রজেক্টটি খুলুন।</div>
                      <div>2. বাম পাশের মেনু থেকে <strong>Build &gt; Firestore Database</strong>-এ গিয়ে <strong>Create Database</strong> এ ক্লিক করে ডেটাবেজ চালু করুন।</div>
                      <div>3. <strong>Rules</strong> ট্যাবে গিয়ে <code>allow read, write: if true;</code> লিখে <strong>Publish</strong> করুন।</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Firebase Console Live Viewer Links */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Firebase Console-এ সরাসরি সিঙ্ক হওয়া ডেটা দেখতে ক্লিক করুন:</span>
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 font-semibold bg-white px-2 py-0.5 rounded border border-blue-200">
                    Project: {config.projectId || 'demo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <a
                    href={`https://console.firebase.google.com/project/${config.projectId || '_'}/firestore/data`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl border border-blue-100 shadow-2xs font-semibold text-center flex flex-col items-center gap-1 transition"
                  >
                    <span className="text-sm">📊</span>
                    <span className="text-[11px]">Firestore Data</span>
                  </a>

                  <a
                    href={`https://console.firebase.google.com/project/${config.projectId || '_'}/database/data`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-700 rounded-xl border border-blue-100 shadow-2xs font-semibold text-center flex flex-col items-center gap-1 transition"
                  >
                    <span className="text-sm">⚡</span>
                    <span className="text-[11px]">Realtime DB</span>
                  </a>

                  <a
                    href={`https://console.firebase.google.com/project/${config.projectId || '_'}/authentication/users`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 rounded-xl border border-blue-100 shadow-2xs font-semibold text-center flex flex-col items-center gap-1 transition"
                  >
                    <span className="text-sm">👤</span>
                    <span className="text-[11px]">Auth Users</span>
                  </a>

                  <a
                    href={`https://console.firebase.google.com/project/${config.projectId || '_'}/storage/files`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-700 rounded-xl border border-blue-100 shadow-2xs font-semibold text-center flex flex-col items-center gap-1 transition"
                  >
                    <span className="text-sm">📁</span>
                    <span className="text-[11px]">Storage Files</span>
                  </a>
                </div>
              </div>

              {/* Collections Info */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
                <span className="text-xs font-bold text-slate-700 block">ক্লাউড ফায়ারস্টোর কালেকশনসমূহ:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <code>edutrack_users</code>: শিক্ষক, শিক্ষার্থী ও অভিভাবক
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <code>edutrack_classes</code>: ব্যাচ ও শিডিউল
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <code>edutrack_attendance</code>: দৈনিক হাজিরা ও ফি কর্তন
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <code>edutrack_invoices</code>: ডিজিটাল ইনভয়েস ও বিল
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <code>edutrack_study_notes</code>: স্টাডি মেটেরিয়াল ও নোটস
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <code>edutrack_tuition_requests</code>: হোম টিউশন জব রিকোয়েস্ট
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIREBASE STORAGE */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <FolderUp className="w-4 h-4 text-amber-600" />
                  <span>Firebase Cloud Storage ফাইল আপলোড</span>
                </h4>
                <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                  শিক্ষকরা স্টাডি নোটসের PDF/Docs সরাসরি আপলোড করতে পারবেন এবং শিক্ষার্থীরা তাদের সমাধান করা হোমওয়ার্ক খাতার ছবি বা PDF জমা দিতে পারবে।
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs font-mono text-amber-900 bg-white/70 px-3 py-1.5 rounded-xl border border-amber-200">
                  <span>Storage Bucket:</span>
                  <span className="font-bold text-orange-700">{config.storageBucket || 'এখনো সেট হয়নি'}</span>
                </div>
              </div>

              {/* Test Upload Feature */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Firebase Storage টেস্ট আপলোড:</span>
                
                <div className="relative border-2 border-dashed border-slate-300 hover:border-orange-500 bg-white rounded-xl p-4 text-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    onChange={handleTestUpload}
                    disabled={testUploading || !isConfigured}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UploadCloud className={`w-7 h-7 ${testUploading ? 'text-orange-500 animate-bounce' : 'text-slate-400 group-hover:text-orange-600'} transition-colors`} />
                    <p className="text-xs font-bold text-slate-700">
                      যেকোনো টেস্ট ফাইল (PDF/Image) বেছে নিন
                    </p>
                    <p className="text-[10px] text-slate-400">সরাসরি Firebase Storage এ আপলোড হয়ে ডাউনলোড লিংক পাওয়া যাবে</p>
                  </div>
                </div>

                {testUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-orange-700">
                      <span>আপলোড হচ্ছে...</span>
                      <span>{testUploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-200" style={{ width: `${testUploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {testUploadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>ফাইল সফলভাবে Firebase Storage এ আপলোড সম্পন্ন হয়েছে!</span>
                    </div>
                    <a
                      href={testUploadSuccess}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 underline font-mono text-[11px] truncate block"
                    >
                      ডাউনলোড লিংক: {testUploadSuccess}
                    </a>
                  </div>
                )}

                {testUploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    ⚠️ {testUploadError}
                  </div>
                )}
              </div>

              {/* Rules hint */}
              <div className="p-3.5 bg-slate-100 rounded-2xl text-[11px] text-slate-600 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">💡 Firebase Storage Security Rules:</span>
                Firebase Console &gt; Storage &gt; Rules-এ গিয়ে নিশ্চিত করুন যে রিড ও রাইট পারমিশন দেওয়া আছে:
                <pre className="mt-1 p-2 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[10px] font-mono">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: API CONFIGURATION */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-amber-900">
                <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11.5px]">
                  <strong>ফায়ারবেস কনসোল ক্রেডেনশিয়াল:</strong> আপনি এখানে কী পেস্ট করে সেভ করতে পারেন অথবা আপনার প্রোজেক্টের <code>client/.env</code> ফাইলে যুক্ত করতে পারেন।
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-bold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Firebase ক্রেডেনশিয়াল সংরক্ষিত হয়েছে! অ্যাপ রিলোড হচ্ছে...</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">apiKey *</label>
                  <input
                    type="text"
                    required
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">projectId *</label>
                  <input
                    type="text"
                    required
                    value={config.projectId}
                    onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                    placeholder="my-edutrack-app"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">authDomain</label>
                  <input
                    type="text"
                    value={config.authDomain}
                    onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                    placeholder="my-app.firebaseapp.com"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">storageBucket</label>
                  <input
                    type="text"
                    value={config.storageBucket}
                    onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                    placeholder="my-app.appspot.com"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">messagingSenderId</label>
                  <input
                    type="text"
                    value={config.messagingSenderId}
                    onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                    placeholder="123456789012"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">appId</label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                    placeholder="1:123456789:web:abcdef"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Firebase Console খুলুন</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white rounded-xl font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>সংরক্ষণ ও সংযোগ করুন (Save Config)</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[11px]">১</span>
                    <span>Firebase Console-এ প্রজেক্ট তৈরি:</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed pl-6">
                    <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline">https://console.firebase.google.com</a>-এ যান ও <strong>"Add project"</strong> ক্লিক করে আপনার প্রজেক্ট তৈরি করুন।
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[11px]">২</span>
                    <span>Cloud Firestore সক্রিয় করুন:</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed pl-6">
                    বামদিকের মেনু থেকে <strong>Build &gt; Firestore Database &gt; Create Database</strong> চাপুন এবং <strong>Test Mode</strong> সিলেক্ট করে চালু করুন।
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[11px]">৩</span>
                    <span>Firebase Storage সক্রিয় করুন:</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed pl-6">
                    বামদিকের মেনু থেকে <strong>Build &gt; Storage &gt; Get Started</strong> চাপুন এবং <strong>Test Mode</strong> সিলেক্ট করে চালু করুন।
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[11px]">৪</span>
                    <span>Google Authentication সক্রিয় করুন:</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed pl-6">
                    বামদিকের মেনু থেকে <strong>Build &gt; Authentication &gt; Sign-in method</strong>-এ গিয়ে <strong>Google</strong> চালু (Enable) করুন।
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('firestore')}
                  className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500"
                >
                  ফায়ারস্টোর সিঙ্কে ফিরে যান →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
