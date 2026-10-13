import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Compass, Clock, Phone, ShieldCheck, 
  CheckCircle2, AlertCircle, X, RefreshCw, Car, User, 
  Send, ExternalLink, Calendar, Info, Check, MessageSquare
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function HomeTuitionLocationModal({ isOpen, onClose, selectedClass, onOpenChat }) {
  const { currentUser, isTeacher, isParent } = useAuth();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [etaInput, setEtaInput] = useState('6');
  const [notificationMsg, setNotificationMsg] = useState('');

  const classId = selectedClass?.id || 'cls-2';

  const loadTrackingData = async () => {
    try {
      setLoading(true);
      const res = await api.getTuitionLocations({ classId });
      if (Array.isArray(res) && res.length > 0) {
        setTracking(res[0]);
        setCustomNotes(res[0].notes || '');
        setEtaInput(String(res[0].etaMinutes || 6));
      } else {
        // Fallback default home tuition tracking
        setTracking({
          id: 'loc-track-1',
          classId: classId,
          status: 'on_the_way',
          statusBn: 'পথে আছেন (On the way)',
          tutorLat: 23.7432,
          tutorLng: 90.3705,
          tutorAddress: 'ধানমন্ডি ২৭ মোড় (Dhanmondi 27 Square)',
          destLat: 23.7509,
          destLng: 90.3752,
          destAddress: selectedClass?.studentAddress || 'বাড়ি #৪৫, রোড #৮/এ, ধানমন্ডি, ঢাকা',
          distanceKm: 0.85,
          etaMinutes: 6,
          sessionDate: new Date().toISOString().split('T')[0],
          scheduledTime: selectedClass?.timeSlot || '04:30 PM - 06:00 PM',
          checkInTime: null,
          checkOutTime: null,
          transportType: 'bike',
          notes: 'শিক্ষক বাইকে রওয়ানা হয়েছেন, ট্রাফিকের কারণে আনুমানিক ৬ মিনিটে পৌঁছাবেন।'
        });
      }
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTrackingData();
    }
  }, [isOpen, classId]);

  if (!isOpen) return null;

  // Handle Tutor updates
  const handleUpdateStatus = async (newStatus, notes, eta) => {
    setActionLoading(true);
    try {
      const res = await api.updateTuitionLocation({
        id: tracking?.id,
        classId,
        status: newStatus,
        notes: notes || customNotes,
        etaMinutes: eta !== undefined ? Number(eta) : Number(etaInput)
      });
      setTracking(prev => ({ ...prev, ...res }));
      setNotificationMsg(`অবস্থা সফলভাবে আপডেট করা হয়েছে: ${res.statusBn || newStatus}`);
      setTimeout(() => setNotificationMsg(''), 4000);
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick 1-click Check-in
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.checkInTuitionLocation({
        id: tracking?.id,
        classId
      });
      if (res.tracking) {
        setTracking(res.tracking);
        setNotificationMsg(`🎉 চেক-ইন সফল! শিক্ষক ছাত্রের বাসায় পৌঁছেছেন (${res.tracking.checkInTime})`);
        setTimeout(() => setNotificationMsg(''), 5000);
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick 1-click Check-out
  const handleCheckOut = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে হোম টিউশন ক্লাস সম্পন্ন হয়েছে এবং চেক-আউট করতে চান?')) return;
    setActionLoading(true);
    try {
      const res = await api.checkOutTuitionLocation({
        id: tracking?.id,
        classId
      });
      if (res.tracking) {
        setTracking(res.tracking);
        setNotificationMsg(`✅ ক্লাস সম্পন্ন ও চেক-আউট সফল! (${res.tracking.checkOutTime})`);
        setTimeout(() => setNotificationMsg(''), 5000);
      }
    } catch (err) {
      console.error('Check-out error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const currentStatus = tracking?.status || 'on_the_way';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Navigation className="w-5 h-5 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  হোম টিউশন লাইভ লোকেশন ট্র্যাকিং
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {selectedClass?.title || 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র (Physics)'} • {selectedClass?.studentAddress || 'ধানমন্ডি, ঢাকা'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTrackingData}
              disabled={loading}
              title="রিফ্রেশ করুন"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notificationMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Top Status & Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">বর্তমান অবস্থান</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg">
                  {currentStatus === 'on_the_way' ? '🛵' : currentStatus === 'arrived' ? '📍' : currentStatus === 'in_session' ? '📖' : '✅'}
                </span>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {tracking?.statusBn || 'পথে আছেন'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">দূরত্ব (Distance)</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Navigation className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-black text-indigo-950">
                  {currentStatus === 'arrived' || currentStatus === 'in_session' || currentStatus === 'completed'
                    ? '০ মিটার (পৌঁছে গেছেন)'
                    : `${tracking?.distanceKm || 0.85} কি.মি.`}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase">পৌঁছানোর সময় (ETA)</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-black text-amber-950">
                  {currentStatus === 'arrived' || currentStatus === 'in_session' || currentStatus === 'completed'
                    ? 'পৌঁছে গেছেন'
                    : `~ ${tracking?.etaMinutes || 6} মিনিট`}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">চেক-ইন / চেক-আউট</span>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950">
                  {tracking?.checkInTime ? `${tracking.checkInTime} (In)` : 'অপেক্ষমাণ'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Map Visualizer */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
            {/* Map Canvas Background with Streets & Grid Graphic */}
            <div className="relative h-64 sm:h-80 w-full bg-[#1b2234] overflow-hidden select-none">
              
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]" />

              {/* Simulated Map Road Networks */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Roads */}
                <line x1="10%" y1="20%" x2="90%" y2="25%" stroke="#334155" strokeWidth="18" strokeLinecap="round" />
                <line x1="20%" y1="10%" x2="35%" y2="90%" stroke="#334155" strokeWidth="22" strokeLinecap="round" />
                <line x1="30%" y1="75%" x2="85%" y2="40%" stroke="#334155" strokeWidth="20" strokeLinecap="round" />
                <line x1="80%" y1="15%" x2="70%" y2="85%" stroke="#334155" strokeWidth="16" strokeLinecap="round" />
                
                {/* Active Route Polyline from Tutor to Student */}
                <path
                  d="M 28% 68% Q 45% 62%, 55% 48% T 75% 35%"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="6"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                />

                {/* Lake / Green Area */}
                <path d="M 50 180 Q 90 220, 140 200 T 170 250 L 50 250 Z" fill="#064e3b" opacity="0.3" />
                <text x="70" y="225" fill="#34d399" fontSize="10" opacity="0.7">ধানমন্ডি লেক</text>
              </svg>

              {/* Tutor Moving Live Marker */}
              <div 
                className="absolute transition-all duration-1000 ease-in-out transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: currentStatus === 'arrived' || currentStatus === 'in_session' || currentStatus === 'completed' ? '75%' : '28%',
                  top: currentStatus === 'arrived' || currentStatus === 'in_session' || currentStatus === 'completed' ? '35%' : '68%'
                }}
              >
                <div className="relative flex flex-col items-center group">
                  {/* Radar Ping */}
                  <span className="absolute -inset-2 rounded-full bg-indigo-500/40 animate-ping" />
                  
                  {/* Tutor Avatar / Vehicle Pin */}
                  <div className="relative w-11 h-11 rounded-2xl bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-lg">
                    {currentStatus === 'arrived' || currentStatus === 'in_session' || currentStatus === 'completed' ? '👨‍🏫' : '🛵'}
                  </div>

                  {/* Tutor Tooltip Card */}
                  <div className="mt-1 bg-slate-900/90 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-lg border border-indigo-500/40 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>টিউটর: ড. রশিদুল করিম</span>
                  </div>
                </div>
              </div>

              {/* Student Destination Residence Marker */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: '75%', top: '35%' }}
              >
                <div className="relative flex flex-col items-center">
                  <span className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse" />
                  <div className="relative w-12 h-12 rounded-2xl bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xl">
                    🏠
                  </div>
                  <div className="mt-1 bg-emerald-950/90 text-emerald-200 px-3 py-1 rounded-xl text-[10px] font-bold shadow-lg border border-emerald-500/40 whitespace-nowrap backdrop-blur-sm">
                    শিক্ষার্থীর বাসা (তানভীর আহমেদ)
                  </div>
                </div>
              </div>

              {/* Live Status Overlay Pill on Map */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 text-white text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">লাইভ ট্র্যাকিং সক্রিয়</span>
                <span className="text-slate-400 text-[10px]">| সাত মসজিদ রোড • ধানমন্ডি</span>
              </div>

              {/* Speed & Direction Overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white text-[11px] flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-300">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <span>উত্তর-পূর্ব (NE)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Car className="w-3.5 h-3.5 text-indigo-400" />
                  <span>মোটরসাইকেল (Bike)</span>
                </div>
              </div>
            </div>

            {/* Address bar underneath map */}
            <div className="p-3.5 bg-slate-800/90 border-t border-slate-700/60 text-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">গন্তব্য ঠিকানা:</span>
                <span className="text-slate-300 truncate">{tracking?.destAddress || 'বাড়ি #৪৫, রোড #৮/এ, ধানমন্ডি, ঢাকা'}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>শেষ আপডেট: {new Date(tracking?.lastUpdated || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Real-time Tracking Steps / Progress Stepper */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              হোম টিউশন স্ট্যাটাস টাইমলাইন (Live Timeline)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-1">
              {[
                { key: 'scheduled', label: '১. নির্ধারিত শিডিউল', desc: 'আজ বিকেল ০৪:৩০', icon: Calendar },
                { key: 'on_the_way', label: '২. পথে রওনা হয়েছেন', desc: `${tracking?.distanceKm || 0.85} কি.মি. দূরত্বে`, icon: Navigation },
                { key: 'arrived', label: '৩. বাসায় পৌঁছেছেন', desc: tracking?.checkInTime ? `চেক-ইন: ${tracking.checkInTime}` : 'অপেক্ষমাণ', icon: MapPin },
                { key: 'completed', label: '৪. ক্লাস সম্পন্ন', desc: tracking?.checkOutTime ? `চেক-আউট: ${tracking.checkOutTime}` : 'চলমান', icon: CheckCircle2 }
              ].map((step, idx) => {
                const StepIcon = step.icon;
                const isPassed = 
                  (step.key === 'scheduled') ||
                  (step.key === 'on_the_way' && currentStatus !== 'scheduled') ||
                  (step.key === 'arrived' && (currentStatus === 'arrived' || currentStatus === 'in_session' || currentStatus === 'completed')) ||
                  (step.key === 'completed' && currentStatus === 'completed');

                return (
                  <div 
                    key={step.key} 
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isPassed 
                        ? 'bg-white border-indigo-300 shadow-sm' 
                        : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPassed ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`font-bold ${isPassed ? 'text-indigo-950' : 'text-slate-600'}`}>
                        {step.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-7">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher's Live Notes / Traffic Alert */}
          {tracking?.notes && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">শিক্ষকের বার্তা / ট্রাফিক আপডেট: </span>
                <span>{tracking.notes}</span>
              </div>
            </div>
          )}

          {/* Controls Section (Different for Teacher vs Student/Parent) */}
          {isTeacher ? (
            /* TEACHER CONTROLS */
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  শিক্ষকের লাইভ আপডেট প্যানেল (Tutor Check-In & Action Bar)
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  হোম টিউশন মোড
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('on_the_way', 'পথে রওনা হয়েছি, ট্রাফিকের কারণে ৮ মিনিটে পৌঁছাবো।', 8)}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>পথে রওনা হয়েছি (On the way)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>বাসায় পৌঁছেছি (Check-In)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ক্লাস সমাপ্ত (Check-Out)</span>
                </button>
              </div>

              {/* Custom message sender */}
              <div className="pt-1 flex gap-2">
                <input
                  type="text"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="অভিভাবক ও শিক্ষার্থীর জন্য তাৎক্ষণিক মেসেজ লিখুন (যেমন: ৫ মিনিট দেরি হবে)..."
                  className="flex-1 px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(currentStatus, customNotes, etaInput)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  বার্তা পাঠান
                </button>
              </div>
            </div>
          ) : (
            /* STUDENT / PARENT CONTROLS */
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isParent ? 'অভিভাবক সুরক্ষা নিশ্চিতকরণ' : 'শিক্ষার্থী ড্যাশবোর্ড ট্র্যাকিং'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    শিক্ষক বাসায় প্রবেশ করার সাথে সাথে ওটিপি/ডিজিটাল চেক-ইন রেকর্ড সম্পন্ন হয়।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+8801712345678"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>শিক্ষককে কল করুন</span>
                </a>

                {onOpenChat && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenChat();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>মেসেজ দিন</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>অফলাইন হোম টিউশন স্পেশাল মোড • ধানমন্ডি ব্রাঞ্চ</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-colors"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
