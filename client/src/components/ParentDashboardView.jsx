import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, CalendarCheck, CreditCard, Navigation, Award, 
  Clock, CheckCircle2, AlertTriangle, ArrowRight, Phone, MessageSquare, 
  ExternalLink, FileText, ChevronRight, Sparkles, Flame, Check, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import SSLCommerzModal from './SSLCommerzModal';
import HomeTuitionLocationModal from './HomeTuitionLocationModal';

export default function ParentDashboardView({ classes, invoices, onNavigate, onRefresh }) {
  const { 
    currentUser, parentStudents, activeStudentId, setActiveStudentId, 
    activeStudent, formatMoney, currencySymbol 
  } = useAuth();

  const [studentRewards, setStudentRewards] = useState(null);
  const [timeRequests, setTimeRequests] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  const selectedChild = activeStudent || parentStudents[0] || {
    id: 'student-1',
    name: 'তানভীর আহমেদ (Alex Rivera)',
    email: 'alex.rivera@student.edu',
    grade: 'একাদশ শ্রেণী (Grade 11)'
  };

  const loadParentData = async () => {
    try {
      setLoading(true);
      const [rew, reqs, locs] = await Promise.all([
        api.getRewards(selectedChild.id),
        api.getTimeRequests({ studentId: selectedChild.id }),
        api.getTuitionLocations({ studentId: selectedChild.id })
      ]);
      setStudentRewards(rew);
      setTimeRequests(reqs || []);
      if (Array.isArray(locs) && locs.length > 0) {
        setTrackingData(locs[0]);
      }
    } catch (err) {
      console.error('Failed to load parent dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParentData();
  }, [selectedChild.id]);

  const handleParentApproveRequest = async (requestId) => {
    setApprovingId(requestId);
    try {
      await api.parentApproveReschedule(requestId, currentUser?.id, 'অভিভাবক কর্তৃক যাচাইকৃত ও অনুমোদিত');
      await loadParentData();
      alert('✅ শিডিউল পরিবর্তনের অনুরোধে অভিভাবকের অনুমোদন সফলভাবে যুক্ত হয়েছে!');
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setApprovingId(null);
    }
  };

  // Filter invoices for this student
  const childInvoices = invoices.filter(i => i.studentId === selectedChild.id);
  const pendingInvoices = childInvoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const totalPendingDue = pendingInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Home tuition class for this student
  const homeTuitionClass = classes.find(c => c.mode === 'home') || classes[1] || classes[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Guardian Welcome Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>প্যারেন্ট ও অভিভাবক পোর্টাল (Parent Guardian Dashboard)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            স্বাগতম, {currentUser?.name || 'অভিভাবক'}!
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            এখানে আপনার সন্তানের সকল টিউশন ক্লাস, শিক্ষকের আগমন ট্র্যাকিং, উপস্থিতি, 
            ইনভয়েস ফি পরিশোধ ও অগ্রগতি প্রতিবেদন এক নজরে পর্যবেক্ষণ করতে পারেন।
          </p>
        </div>

        {/* Child Selector Pill */}
        {parentStudents.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shrink-0">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>পর্যবেক্ষণাধীন শিক্ষার্থী (Selected Child):</span>
            </label>
            <div className="flex gap-2">
              {parentStudents.map(child => (
                <button
                  key={child.id}
                  onClick={() => setActiveStudentId(child.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedChild.id === child.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  <img src={child.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span>{child.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Home Tuition Alert Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base">হোম টিউশন লাইভ ট্র্যাকার</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800">
                {trackingData?.statusBn || 'পথে আছেন (On the way)'}
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              পদার্থবিজ্ঞান হোম টিউশন • শিক্ষক ড. রশিদুল করিম ধানমন্ডি ২৭ থেকে রওনা হয়েছেন (দূরত্ব: ৮৫০ মিটার, ৬ মিনিটে পৌঁছাবেন)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLocationModal(true)}
          className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          <Navigation className="w-4 h-4 text-emerald-700" />
          <span>লাইভ ম্যাপে ট্র্যাক করুন</span>
        </button>
      </div>

      {/* Guardian Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Pending Tuition Due */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">বকেয়া টিউশন ফি</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ৳
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {formatMoney(totalPendingDue)}
          </p>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">{pendingInvoices.length}টি ইনভয়েস অপেক্ষমাণ</span>
            {pendingInvoices.length > 0 && (
              <button
                onClick={() => setSelectedInvoiceForPayment(pendingInvoices[0])}
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                পরিশোধ করুন →
              </button>
            )}
          </div>
        </div>

        {/* Metric 2: Attendance Rate */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">উপস্থিতির হার</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ১০০%
          </p>
          <p className="text-xs text-slate-500">
            চলতি মাসে কোনো ক্লাস মিস হয়নি (টানা ৯ দিন স্ট্রিক 🔥)
          </p>
        </div>

        {/* Metric 3: Teacher Skip Protection */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">শিক্ষক অনুপস্থিতি ক্রেডিট</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700">
            ৳৪৫০ ছাড়
          </p>
          <p className="text-xs text-slate-500">
            শিক্ষক বাদ দিলে স্বয়ংক্রিয় ইনভয়েস কর্তন কার্যকর
          </p>
        </div>

        {/* Metric 4: Academic Reward XP */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">পারফরম্যান্স রিওয়ার্ড</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {studentRewards?.xp || 1450} XP
          </p>
          <p className="text-xs text-slate-500">
            স্বর্ণ স্কলার • কুপনে ৳৫০০ ফি ডিসকাউন্ট কার্যকরযোগ্য
          </p>
        </div>

      </div>

      {/* Main 2-Column Split: Invoices/Fee Pay & Schedule Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Invoices & Payment Portal */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>টিউশন ফি ইনভয়েস ও অনলাইন পেমেন্ট (Digital Invoices)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                বিকাশ, নগদ, রকেট ও ভিসা কার্ডের মাধ্যমে তাত্ক্ষণিক ফি প্রদান করুন
              </p>
            </div>

            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              সব দেখুন →
            </button>
          </div>

          <div className="space-y-3">
            {childInvoices.map(inv => {
              const cls = classes.find(c => c.id === inv.classId);
              const isPaid = inv.status === 'paid';

              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">
                        {inv.title || cls?.title || 'টিউশন ফি ইনভয়েস'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isPaid ? 'পরিশোধিত (Paid)' : 'বকেয়া (Pending)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      ইনভয়েস আইডি: <span className="font-mono text-slate-700 font-bold">{inv.invoiceNumber}</span> • শেষ তারিখ: {inv.dueDate}
                    </p>
                    {inv.discountAmount > 0 && (
                      <p className="text-[11px] text-purple-700 font-semibold">
                        * শিক্ষক অনুপস্থিতি বা রিওয়ার্ডে ৳{inv.discountAmount} সমন্বয় করা হয়েছে
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">মোট প্রদেয়</span>
                      <span className="text-base font-black text-slate-900">
                        {formatMoney(inv.amount)}
                      </span>
                    </div>

                    {!isPaid && (
                      <button
                        onClick={() => setSelectedInvoiceForPayment(inv)}
                        className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 flex items-center gap-1.5"
                      >
                        <span>বিকাশ / SSLCommerz ৳</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Parent Reschedule Approval & Guardian Actions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <span>শিডিউল পরিবর্তন অভিভাবক অনুমোদন</span>
            </h3>
          </div>

          <div className="space-y-3">
            {timeRequests.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                এই মুহূর্তে কোনো শিডিউল পরিবর্তনের অনুরোধ অপেক্ষমাণ নেই।
              </div>
            ) : (
              timeRequests.map(req => (
                <div key={req.id} className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-950 truncate">
                      {req.class?.title || 'উচ্চতর গণিত'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">প্রস্তাবিত নতুন সময়:</span> {req.proposedSlot}
                    {req.proposedDate && ` (${req.proposedDate})`}
                  </p>
                  {req.reason && (
                    <p className="text-[11px] text-slate-500 italic">
                      "কারণ: {req.reason}"
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    {req.parentApproved ? (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>অভিভাবক অনুমোদন সম্পন্ন</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleParentApproveRequest(req.id)}
                        disabled={approvingId === req.id}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        {approvingId === req.id ? 'অনুমোদন হচ্ছে...' : 'অভিভাবক হিসেবে অনুমোদন দিন'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Contact & Emergency Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>জরুরি যোগাযোগ ও সহায়তা</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              প্রধান শিক্ষক: ড. রশিদুল করিম (+880 1712-345678)
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:+8801712345678"
                className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-center text-xs font-bold"
              >
                সরাসরি কল
              </a>
              <button
                onClick={() => onNavigate('messages')}
                className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-center text-xs font-bold"
              >
                ডাউট চ্যাট
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* SSLCommerz Modal */}
      {selectedInvoiceForPayment && (
        <SSLCommerzModal
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          onPaymentSuccess={() => {
            setSelectedInvoiceForPayment(null);
            onRefresh();
            loadParentData();
          }}
        />
      )}

      {/* Home Tuition Location Tracking Modal */}
      {showLocationModal && (
        <HomeTuitionLocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          selectedClass={homeTuitionClass}
          onOpenChat={() => onNavigate('messages')}
        />
      )}

    </div>
  );
}
