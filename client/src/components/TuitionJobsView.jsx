import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle2, XCircle, Clock, MapPin, DollarSign, 
  Calendar, Phone, MessageSquare, User, Filter, AlertCircle, 
  Send, Check, X, ShieldCheck, ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TuitionJobsView({ onNavigateToChat, onRefresh }) {
  const { currentUser, lang, formatMoney } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'accepted' | 'rejected'
  const [loading, setLoading] = useState(true);

  // Response Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [responseAction, setResponseAction] = useState(null); // 'accept' | 'reject'
  const [responseNote, setResponseNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await api.getTuitionRequests({ teacherId: currentUser?.id });
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load tuition jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [currentUser?.id]);

  const handleOpenResponseModal = (job, action) => {
    setSelectedJob(job);
    setResponseAction(action);
    setResponseNote(
      action === 'accept'
        ? (lang === 'bn' ? 'আসসালামু আলাইকুম, আমি আপনার প্রস্তাবিত সময়ে পড়াতে পারব। আগামী রবিবার থেকে শুরু করতে পারি।' : 'Accepted. I can teach at your proposed schedule.')
        : (lang === 'bn' ? 'বর্তমানে সময়সূচী পূর্ণ থাকায় এই টিউশনটি গ্রহণ করতে পারছি না।' : 'Sorry, I am unable to accept due to schedule conflict.')
    );
  };

  const handleConfirmResponse = async () => {
    if (!selectedJob || !responseAction) return;
    setProcessing(true);
    try {
      await api.respondToTuitionRequest(selectedJob.id, {
        action: responseAction,
        responseNote,
        teacherId: currentUser?.id
      });
      setSelectedJob(null);
      await loadJobs();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to respond to tuition request:', err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'all') return true;
    return req.status === filterStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const totalOfferedSalary = requests
    .filter(r => r.status === 'pending' || r.status === 'accepted')
    .reduce((sum, r) => sum + (Number(r.salary) || 0), 0);

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{lang === 'bn' ? 'নতুন টিউশন জব ও প্রাইভেট অফার' : 'Home Tuition Jobs'}</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                {pendingCount} {lang === 'bn' ? 'নতুন জব' : 'New'}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'শিক্ষার্থীদের পাঠানো হোম টিউশন রিকোয়েস্ট যাচাই করুন এবং পছন্দমতো টিউশন গ্রহণ বা বাতিল করুন।' 
              : 'Review student tuition requests and accept or decline new home tutoring opportunities.'}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'নতুন রিকোয়েস্ট' : 'Pending Requests'}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {pendingCount} {lang === 'bn' ? 'টি জব' : 'Jobs'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'গৃহীত টিউশন' : 'Accepted Tuitions'}</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {acceptedCount} {lang === 'bn' ? 'টি' : 'Jobs'}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'মোট টিউশন পারিশ্রমিক' : 'Total Revenue Potential'}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {formatMoney(totalOfferedSalary)}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: lang === 'bn' ? 'সকল জব' : 'All Jobs', count: requests.length },
          { id: 'pending', label: lang === 'bn' ? 'নতুন রিকোয়েস্ট (অপেক্ষমান)' : 'Pending', count: pendingCount },
          { id: 'accepted', label: lang === 'bn' ? 'গৃহীত জব' : 'Accepted', count: acceptedCount },
          { id: 'rejected', label: lang === 'bn' ? 'বাতিল' : 'Declined', count: requests.filter(r => r.status === 'rejected').length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              filterStatus === f.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{f.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterStatus === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Jobs List Grid */}
      <div className="space-y-3.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
            {lang === 'bn' ? 'কোনো টিউশন জব পাওয়া যায়নি' : 'No tuition jobs found'}
          </div>
        ) : (
          filteredRequests.map(job => {
            const isPending = job.status === 'pending';
            const isAccepted = job.status === 'accepted';
            const isRejected = job.status === 'rejected';

            return (
              <div
                key={job.id}
                className={`bg-white rounded-xl border p-5 transition shadow-xs ${
                  isAccepted 
                    ? 'border-emerald-300 bg-emerald-50/10' 
                    : isPending 
                    ? 'border-amber-200 ring-1 ring-amber-100' 
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  {/* Left: Student info & details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={job.student?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {job.studentName}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">
                          • {job.grade}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isAccepted 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isRejected 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {isAccepted ? (lang === 'bn' ? '✓ গৃহীত' : 'Accepted') : isRejected ? (lang === 'bn' ? '✕ বাতিল' : 'Declined') : (lang === 'bn' ? 'নতুন রিকোয়েস্ট' : 'New Request')}
                        </span>
                      </div>

                      <h4 className="font-bold text-indigo-700 text-sm">
                        {job.subject}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          {formatMoney(job.salary)} / {lang === 'bn' ? 'মাস' : 'mo'}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{job.location}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.daysPerWeek}</span>
                        </span>

                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.timeSlot}</span>
                        </span>
                      </div>

                      {job.requirements && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 max-w-2xl">
                          <strong className="text-slate-700">{lang === 'bn' ? 'শিক্ষার্থীর চাহিদা:' : 'Student requirement:'}</strong> {job.requirements}
                        </p>
                      )}

                      {job.teacherResponseNote && (
                        <p className={`text-xs p-2 rounded-lg border mt-1.5 ${isAccepted ? 'bg-emerald-50 text-emerald-900 border-emerald-100' : 'bg-rose-50 text-rose-900 border-rose-100'}`}>
                          <strong>{lang === 'bn' ? 'আপনার উত্তর / নোট:' : 'Your Response:'}</strong> "{job.teacherResponseNote}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleOpenResponseModal(job, 'reject')}
                          className="px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>{lang === 'bn' ? 'বাতিল করুন' : 'Reject'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenResponseModal(job, 'accept')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>{lang === 'bn' ? 'টিউশন গ্রহণ করুন' : 'Accept Job'}</span>
                        </button>
                      </>
                    ) : isAccepted ? (
                      <div className="flex items-center gap-2">
                        {onNavigateToChat && (
                          <button
                            onClick={onNavigateToChat}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'চ্যাটে কথা বলুন' : 'Open Chat'}</span>
                          </button>
                        )}
                        <a
                          href={`tel:${job.studentPhone || '+8801819234567'}`}
                          className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{job.studentPhone || (lang === 'bn' ? 'কল করুন' : 'Call')}</span>
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        {lang === 'bn' ? 'এই রিকোয়েস্টটি বাতিল করা হয়েছে' : 'Declined'}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMATION / RESPONSE MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                {responseAction === 'accept' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  {responseAction === 'accept' 
                    ? (lang === 'bn' ? 'টিউশন জব গ্রহণ নিশ্চিত করুন' : 'Confirm Tuition Acceptance') 
                    : (lang === 'bn' ? 'টিউশন রিকোয়েস্ট বাতিল করুন' : 'Decline Tuition Request')}
                </span>
              </h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p><strong>{lang === 'bn' ? 'শিক্ষার্থী:' : 'Student:'}</strong> {selectedJob.studentName} ({selectedJob.grade})</p>
                <p><strong>{lang === 'bn' ? 'বিষয়:' : 'Subject:'}</strong> {selectedJob.subject}</p>
                <p><strong>{lang === 'bn' ? 'এলাকা:' : 'Location:'}</strong> {selectedJob.location}</p>
                <p><strong>{lang === 'bn' ? 'মাসিক বেতন:' : 'Salary:'}</strong> <span className="font-mono font-bold text-indigo-700">{formatMoney(selectedJob.salary)}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {responseAction === 'accept' 
                    ? (lang === 'bn' ? 'শিক্ষার্থী ও অভিভাবকের জন্য আপনার মেসেজ / নোট:' : 'Message to Student / Parent:') 
                    : (lang === 'bn' ? 'বাতিলের কারণ / নোট (ঐচ্ছিক):' : 'Reason / Note (Optional):')}
                </label>
                <textarea
                  rows={3}
                  value={responseNote}
                  onChange={e => setResponseNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  placeholder={responseAction === 'accept' ? 'কবে থেকে শুরু করবেন বা ক্লাসের নিয়মাবলী...' : 'কারণ উল্লেখ করুন...'}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  {lang === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleConfirmResponse}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 ${
                    responseAction === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {responseAction === 'accept' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{processing ? (lang === 'bn' ? 'প্রসেসিং...' : 'Processing...') : (responseAction === 'accept' ? (lang === 'bn' ? 'হ্যাঁ, গ্রহণ করুন' : 'Confirm Accept') : (lang === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Confirm Decline'))}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
