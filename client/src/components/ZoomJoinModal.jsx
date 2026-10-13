import React, { useState } from 'react';
import { 
  X, Video, ExternalLink, Copy, Check, ShieldCheck, 
  Clock, Users, BookOpen, AlertCircle, Sparkles, Monitor
} from 'lucide-react';

export default function ZoomJoinModal({ isOpen, onClose, targetClass }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !targetClass) return null;

  const zoomUrl = targetClass.zoomLink || targetClass.meetingLink || 'https://zoom.us/j/89214208912?pwd=edutrack';
  const meetingId = targetClass.zoomMeetingId || '892 1420 8912';
  const password = targetClass.zoomPassword || 'edutrack';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(zoomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDirectLaunch = () => {
    window.open(zoomUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-sans">
        
        {/* Zoom Blue Themed Header */}
        <div className="bg-gradient-to-r from-[#0b5cff] via-[#2d8cff] to-[#0e71eb] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white text-[#2d8cff] flex items-center justify-center shadow-md font-black text-sm">
              <Video className="w-4 h-4 fill-current" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
              Zoom Cloud Meetings • লাইভ অনলাইন ক্লাস
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            {targetClass.title}
          </h3>
          <p className="text-xs text-blue-100 mt-1 flex items-center gap-2">
            <span>{targetClass.type === 'individual' ? '👤 ১-অন-১ প্রাইভেট সেশন' : '👥 লাইভ ব্যাচ ক্লাস'}</span>
            <span>•</span>
            <span>{targetClass.timeSlot}</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 bg-slate-50/50">
          
          {/* Launch Buttons Banner */}
          <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm space-y-3">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                ক্লাসরুম সক্রিয় (Classroom Online)
              </span>
              <p className="text-xs text-slate-500">
                নিচের বোতামে ক্লিক করে অ্যাপ থেকে সরাসরি লাইভ জুমে যুক্ত হোন:
              </p>
            </div>

            <button
              onClick={handleDirectLaunch}
              className="w-full py-3.5 px-4 bg-[#2d8cff] hover:bg-[#1f7ae6] text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 group"
            >
              <Video className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
              <span>🚀 সরাসরি জুমে যুক্ত হন (Join Zoom Directly)</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={zoomUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>ওয়েব ব্রাউজারে খুলুন</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">লিঙ্ক কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>লিঙ্ক কপি করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Meeting Credentials Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">মিটিং আইডি (Meeting ID):</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{meetingId}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                  title="Copy ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">পাসকোড (Passcode):</span>
              <span className="font-mono font-bold text-slate-900">{password}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">নির্ধারিত দিনসমূহ (Schedule):</span>
              <span className="font-bold text-indigo-600">{targetClass.scheduleDays?.join(', ')}</span>
            </div>
          </div>

          {/* Quick Notice */}
          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            EduTrack নিরাপদ ক্লাসরুম লিংক • কোনো রেজিস্ট্রেশন ঝামেলা নেই
          </p>

        </div>

      </div>
    </div>
  );
}
