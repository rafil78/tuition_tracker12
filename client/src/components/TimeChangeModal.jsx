import React, { useState } from 'react';
import { X, Clock, Calendar, MessageSquare, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TimeChangeModal({ isOpen, onClose, classes, onSubmitted }) {
  const { currentUser } = useAuth();
  const [classId, setClassId] = useState(classes?.[0]?.id || '');
  
  // Tomorrow's date as default proposed date
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [proposedDate, setProposedDate] = useState(tomorrowStr);
  const [proposedSlot, setProposedSlot] = useState('06:30 PM - 08:00 PM');
  const [reason, setReason] = useState('কলেজ কোচিং ও যাতায়াতের সুবিধার জন্য এই ক্লাসের তারিখ ও সময় পরিবর্তনের অনুরোধ জানাচ্ছি।');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedClass = classes.find(c => c.id === classId) || classes?.[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classId || (!proposedSlot && !proposedDate)) return;
    setLoading(true);
    setError('');

    try {
      await api.createTimeRequest({
        studentId: currentUser.id,
        classId,
        proposedSlot,
        proposedDate,
        proposedDays: selectedClass?.scheduleDays || [],
        reason
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit time request:', err);
      setError('অনুরোধ পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-white/20">
              তারিখ ও সময় পরিবর্তন (Reschedule)
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight">
            ক্লাসের তারিখ ও সময় পরিবর্তনের অনুরোধ
          </h3>
          <p className="text-xs text-orange-100 mt-1">
            শিক্ষকের নিকট প্রস্তাবিত নতুন তারিখ ও সময় পাঠান। শিক্ষক অনুমোদন করলে ক্যালেন্ডার আপডেট হবে।
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-800">অনুরোধ সফলভাবে পাঠানো হয়েছে!</h4>
              <p className="text-xs text-slate-500">
                আপনার শিক্ষকের কাছে নোটিফিকেশন পৌঁছেছে। অনুমোদন পেলে স্বয়ংক্রিয়ভাবে শিডিউল আপডেট হবে।
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কোর্স / ব্যাচ নির্বাচন করুন (Select Tuition)
                </label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} • {c.type === 'individual' ? 'একক' : 'ব্যাচ'} ({c.timeSlot})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClass && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>বর্তমান ক্লাসের সময়:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedClass.timeSlot}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>নির্ধারিত দিনসমূহ:</span>
                    <span className="font-bold text-indigo-600">{selectedClass.scheduleDays?.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    প্রস্তাবিত নতুন তারিখ (Date)
                  </label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={e => setProposedDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    প্রস্তাবিত নতুন সময় (Time)
                  </label>
                  <input
                    type="text"
                    value={proposedSlot}
                    onChange={e => setProposedSlot(e.target.value)}
                    placeholder="06:30 PM - 08:00 PM"
                    required
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  পরিবর্তনের কারণ (Reason for Reschedule)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="যেমনঃ পরীক্ষার শিডিউল, জরুরি কাজ বা যাতায়াত বিলম্ব..."
                  required
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-2"
                >
                  {loading ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান (Send Request)'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
