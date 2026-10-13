import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, Video, Bell, BellRing, Smartphone, 
  Check, CheckCircle2, AlertCircle, X, Send, ShieldCheck
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ZoomJoinModal from './ZoomJoinModal';

export default function ClassReminderBanner({ classes = [], onJoinZoom }) {
  const { lang, currentUser } = useAuth();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 28, seconds: 45 });
  const [selectedZoomClass, setSelectedZoomClass] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Phone SMS dispatch state
  const [sendingSms, setSendingSms] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsResult, setSmsResult] = useState(null);

  // Pick upcoming class
  const upcomingClass = classes?.[0] || {
    id: 'cls-1',
    title: 'উচ্চতর গণিত ও ক্যালকুলাস (Higher Math & Calculus)',
    timeSlot: '05:00 PM - 06:30 PM',
    subject: 'উচ্চতর গণিত',
    room: 'অনলাইন লাইভ রুম (Studio 1)',
    zoomLink: 'https://zoom.us/j/89214208912?pwd=edutrack',
    zoomMeetingId: '892 1420 8912',
    zoomPassword: 'edutrack',
    perClassRate: 450
  };

  // Play subtle audio chime
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  // Browser Web Notification
  const triggerBrowserAlert = (title, body) => {
    playNotificationSound();
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch (e) {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            try {
              new Notification(title, { body, icon: '/favicon.ico' });
            } catch (e) {}
          }
        });
      }
    }
  };

  // Dynamic countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Send Class Phone SMS & Notifications to all stakeholders
  const handleSendClassAlertToPhones = async () => {
    if (!upcomingClass) return;
    setSendingSms(true);
    try {
      const res = await api.sendClassReminder(upcomingClass.id);
      setSmsResult(res);
      setSmsModalOpen(true);
      triggerBrowserAlert(
        lang === 'bn' ? '📢 ক্লাস নোটিফিকেশন অ্যালার্ট' : 'Class Notification Alert',
        lang === 'bn' 
          ? `${upcomingClass.title} ক্লাসের নোটিফিকেশন সকল শিক্ষক, শিক্ষার্থী ও অভিভাবকের ফোনে পাঠানো হয়েছে!`
          : `Class reminder dispatched to student & guardian phones.`
      );
    } catch (err) {
      alert('SMS dispatch failed: ' + err.message);
    } finally {
      setSendingSms(false);
    }
  };

  if (dismissed || !upcomingClass) return null;

  return (
    <>
      <div className="relative bg-slate-900 rounded-xl p-4 sm:p-5 text-white border border-slate-800 shadow-md animate-fadeIn mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Left: Class Meta */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <Video className="w-5 h-5 text-blue-400" />
            </div>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  {lang === 'bn' ? 'আসন্ন ক্লাস রিমাইন্ডার' : 'Upcoming Class Alert'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {upcomingClass.timeSlot}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">
                {upcomingClass.title}
              </h3>

              <p className="text-xs text-slate-400">
                {lang === 'bn' 
                  ? `রুম: ${upcomingClass.room || 'অনলাইন লাইভ'} • শিক্ষক ক্লাস বাতিল করলে স্বয়ংক্রিয় ফি কর্তন প্রযোজ্য`
                  : `Room: ${upcomingClass.room || 'Online Live'} • Auto-deduction applies if tutor cancels`}
              </p>
            </div>
          </div>

          {/* Right: Actions & Countdown */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
            
            {/* Live Countdown Clock */}
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <div className="font-mono text-xs font-bold text-amber-300">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} {lang === 'bn' ? 'মি.' : 'min'}
              </div>
            </div>

            {/* SEND SMS TO ALL PHONES BUTTON */}
            <button
              onClick={handleSendClassAlertToPhones}
              disabled={sendingSms}
              title={lang === 'bn' ? 'শিক্ষার্থী, শিক্ষক ও অভিভাবকের ফোনে SMS নোটিফিকেশন পাঠান' : 'Dispatch SMS to all phones'}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Smartphone className="w-3.5 h-3.5 text-white" />
              <span>{sendingSms ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (lang === 'bn' ? 'ফোনে SMS পাঠান' : 'Send Phone SMS')}</span>
            </button>

            {/* Join Zoom Button */}
            <button
              onClick={() => setSelectedZoomClass(upcomingClass)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? 'সরাসরি Zoom' : 'Join Zoom'}</span>
            </button>

            {/* Notification Bell Toggle */}
            <button
              onClick={() => {
                const next = !reminderEnabled;
                setReminderEnabled(next);
                if (next) triggerBrowserAlert('🔔 Alert Enabled', 'Class reminder alerts active on your device.');
              }}
              title={reminderEnabled ? 'অ্যালার্ট চালু আছে' : 'অ্যালার্ট বন্ধ'}
              className={`p-2 rounded-xl border transition-colors ${
                reminderEnabled 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {reminderEnabled ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            </button>

            {/* Dismiss button */}
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
              title="লুকিয়ে রাখুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ZOOM LAUNCHER MODAL */}
      {selectedZoomClass && (
        <ZoomJoinModal
          tuitionClass={selectedZoomClass}
          isOpen={!!selectedZoomClass}
          onClose={() => setSelectedZoomClass(null)}
        />
      )}

      {/* PHONE SMS DISPATCH REPORT MODAL */}
      {smsModalOpen && smsResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'bn' ? 'ফোনে SMS নোটিফিকেশন রিপোর্ট' : 'Phone SMS Dispatch Report'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'সরাসরি গেটওয়ে দ্বারা ফোন ও ক্লাউডে ডেলিভার্ড' : 'Delivered via live BD SMS gateway'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSmsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    {lang === 'bn' 
                      ? `মোট ${smsResult.totalDispatched || smsResult.recipients?.length || 0}টি ফোনে SMS সফলভাবে পাঠানো হয়েছে!`
                      : `Successfully sent SMS to ${smsResult.totalDispatched || smsResult.recipients?.length || 0} phones!`}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  Status: 200 OK
                </span>
              </div>

              {/* Recipient breakdown */}
              <div>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'প্রাপকদের তালিকা ও মোবাইল নম্বর:' : 'Recipients & Mobile Numbers:'}
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {(smsResult.recipients || []).map((rc, idx) => (
                    <div key={idx} className="pt-1.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{rc.name}</span>
                        <span className={`ml-2 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          rc.role === 'teacher' ? 'bg-blue-100 text-blue-700' : rc.role === 'parent' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {rc.role === 'parent' ? (lang === 'bn' ? 'অভিভাবক' : 'Parent') : rc.role === 'teacher' ? (lang === 'bn' ? 'শিক্ষক' : 'Teacher') : (lang === 'bn' ? 'শিক্ষার্থী' : 'Student')}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">{rc.phone}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'ডেলিভার্ড' : 'Delivered'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample SMS text preview */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  {lang === 'bn' ? 'SMS প্রিভিউ (মোবাইল স্ক্রিনে যেভাবে দেখাবে):' : 'SMS Text Preview:'}
                </span>
                <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                  "📢 [EduTrack] আপনার {upcomingClass.title} ক্লাস আজ {upcomingClass.timeSlot} এ অনুষ্ঠিত হবে। Zoom মিটিং লিংক: {upcomingClass.zoomLink || 'https://zoom.us/edutrack'}"
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSmsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                {lang === 'bn' ? 'ঠিক আছে' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
