import React from 'react';
import { 
  X, Sparkles, Users, MessageSquare, ShieldCheck, 
  CreditCard, Calendar, Clock, Star, ArrowRight, BookOpen, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NewBatchPopupModal({ isOpen, onClose, batch, onEnrollWithSSLCommerz }) {
  if (!isOpen || !batch) return null;

  const { formatMoney, lang } = useAuth();
  const teacher = batch.teacher || {
    name: batch.teacherName || 'ড. রশিদুল করিম (Prof. David Miller)',
    avatar: batch.teacherAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    title: batch.teacherTitle || 'উচ্চতর গণিত ও পদার্থবিজ্ঞান বিশেষজ্ঞ'
  };

  const scheduleDays = Array.isArray(batch.scheduleDays) ? batch.scheduleDays.join(', ') : (batch.scheduleDays || 'সোম, বুধ, শুক্র');
  const timeSlot = batch.timeSlot || '০৫:০০ PM - ০৬:৩০ PM';
  const monthlyFee = batch.monthlyFee || 3000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
        
        {/* Dynamic Gradient Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white p-6 relative overflow-hidden shadow-md">
          {/* Background ambient pattern */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black bg-amber-400 text-slate-950 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>{lang === 'bn' ? 'নতুন ব্যাচ উন্মোচিত' : 'New Batch Available'}</span>
            </span>
            <span className="text-[11px] text-indigo-100 font-medium">
              {lang === 'bn' ? 'অনলাইন লাইভ গ্রুপ ব্যাচ' : 'Live Group Batch'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {batch.title}
          </h3>
          <p className="text-xs text-indigo-100 mt-1 font-medium flex items-center gap-2">
            <span className="font-semibold">{batch.subject}</span>
            <span>•</span>
            <span>{batch.gradeLevel || 'একাদশ - দ্বাদশ শ্রেণী'}</span>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
          
          {/* Teacher Profile Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <img 
              src={teacher.avatar} 
              alt={teacher.name} 
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 truncate">{teacher.name}</h4>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold shrink-0">
                  {lang === 'bn' ? 'ব্যাচ শিক্ষক' : 'Teacher'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{teacher.title}</p>
              <div className="flex items-center gap-1 mt-1 text-xs">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold text-slate-800 font-mono">4.8</span>
                <span className="text-[11px] text-slate-400">({lang === 'bn' ? 'যাচাইকৃত শিক্ষক রেটিং' : 'Verified Tutor'})</span>
              </div>
            </div>
          </div>

          {/* Schedule & Fee Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'bn' ? 'ক্লাসের দিনসমূহ' : 'Schedule Days'}</span>
              </span>
              <p className="font-bold text-slate-800 text-xs sm:text-sm">{scheduleDays}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{timeSlot}</span>
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'bn' ? 'টিউশন ও ভর্তি ফি' : 'Monthly Fee'}</span>
              </span>
              <p className="text-lg font-black text-emerald-600 font-mono">
                {formatMoney(monthlyFee)}
              </p>
              <p className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'প্রতি মাসের জন্য নির্ধারিত' : 'Per month'}
              </p>
            </div>
          </div>

          {/* Special Feature Highlight: Batch Group Chat */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 rounded-2xl border border-indigo-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs sm:text-sm">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span>{lang === 'bn' ? 'এক্সক্লুসিভ ব্যাচ গ্রুপ চ্যাট সুবিধা' : 'Batch Group Chat Included'}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-9">
              {lang === 'bn' 
                ? 'এসএসএলকমার্সে ফি পে করে ব্যাচে এনরোল করার সাথে সাথে আপনি স্বয়ংক্রিয়ভাবে এই ব্যাচের প্রাইভেট গ্রুপ চ্যাটে যুক্ত হবেন। সেখানে শিক্ষক ও সহপাঠীদের সাথে সরাসরি লাইভ প্রশ্ন-উত্তর, ক্লাস আলোচনা ও নোট শেয়ার করতে পারবেন!'
                : 'Enrolling with SSLCommerz instantly adds you to the official Batch Group Chat! Chat directly with the tutor and your fellow enrolled classmates.'
              }
            </p>
          </div>

          {/* Secure SSLCommerz badge */}
          <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 flex items-center gap-2.5 text-xs text-red-900">
            <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {lang === 'bn' 
                ? 'নিরাপদ SSLCommerz গেটওয়ে (বিকাশ, নগদ, রকেট ও কার্ড) এর মাধ্যমে তাৎক্ষণিক ভেরিফাইড পেমেন্ট।' 
                : 'Instant secure payment via SSLCommerz (bKash, Nagad, Rocket, Cards).'}
            </span>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors order-2 sm:order-1"
          >
            {lang === 'bn' ? 'পরে দেখব' : 'Later'}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onEnrollWithSSLCommerz) onEnrollWithSSLCommerz(batch);
            }}
            className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 group"
          >
            <CreditCard className="w-4 h-4" />
            <span>{lang === 'bn' ? `এসএসএলকমার্সে ফি পে করে এনরোল করুন (${formatMoney(monthlyFee)})` : `Enroll with SSLCommerz (${formatMoney(monthlyFee)})`}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
