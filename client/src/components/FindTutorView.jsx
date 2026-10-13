import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, DollarSign, Calendar, Clock, Star, 
  CheckCircle2, XCircle, AlertCircle, Plus, Send, 
  MessageSquare, Phone, UserCheck, ShieldCheck, Filter, X
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function FindTutorView({ onNavigateToChat }) {
  const { currentUser, lang, formatMoney } = useAuth();
  const [activeTab, setActiveTab] = useState('tutors'); // 'tutors' | 'my-requests'
  const [tutors, setTutors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchSubject, setSearchSubject] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');

  // Request Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTutorForRequest, setSelectedTutorForRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // New Request Form fields
  const [formData, setFormData] = useState({
    subject: 'উচ্চতর গণিত ও পদার্থবিজ্ঞান',
    grade: 'দ্বাদশ শ্রেণী (Grade 12 / HSC)',
    location: 'ধানমন্ডি, ঢাকা',
    address: 'রোড #২৭, বাড়ি #১২, ধানমন্ডি',
    salary: 8000,
    daysPerWeek: '৩ দিন / সপ্তাহ (রবি, মঙ্গল, বৃহস্পতি)',
    timeSlot: '০৫:৩০ PM - ০৭:০০ PM',
    tuitionType: 'home',
    requirements: 'বাসায় এসে পড়াতে হবে। এইচএসসি বোর্ড পরীক্ষার সমস্যা সমাধান ও নিয়মিত রিভিশন প্রয়োজন।',
    studentPhone: currentUser?.phone || '+880 1711-223344'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tutorsData, requestsData] = await Promise.all([
        api.getTutors(),
        api.getTuitionRequests({ studentId: currentUser?.id })
      ]);
      setTutors(tutorsData || []);
      setMyRequests(requestsData || []);
    } catch (err) {
      console.error('Error loading tutors data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const handleOpenRequestModal = (tutor = null) => {
    setSelectedTutorForRequest(tutor);
    if (tutor) {
      setFormData(prev => ({
        ...prev,
        subject: tutor.subjects?.[0] ? `${tutor.subjects[0]} ও পদার্থবিজ্ঞান` : prev.subject
      }));
    }
    setSubmitSuccess(false);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.location) return;

    setSubmitting(true);
    try {
      await api.createTuitionRequest({
        ...formData,
        studentId: currentUser?.id,
        teacherId: selectedTutorForRequest?.id || null,
        studentName: currentUser?.name || 'শিক্ষার্থী',
        studentPhone: formData.studentPhone || currentUser?.phone || '+880 1700-000000'
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setActiveTab('my-requests');
        loadData();
      }, 1200);
    } catch (err) {
      console.error('Failed to create tuition request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTutors = tutors.filter(t => {
    const matchesSubject = selectedSubjectFilter === 'all' || 
      t.subjects?.some(s => s.toLowerCase().includes(selectedSubjectFilter.toLowerCase())) ||
      t.title?.toLowerCase().includes(selectedSubjectFilter.toLowerCase());

    const matchesArea = selectedArea === 'all' || 
      t.preferredAreas?.some(a => a.toLowerCase().includes(selectedArea.toLowerCase()));

    const matchesSearch = !searchSubject || 
      t.name.toLowerCase().includes(searchSubject.toLowerCase()) ||
      t.subjects?.some(s => s.toLowerCase().includes(searchSubject.toLowerCase())) ||
      t.title?.toLowerCase().includes(searchSubject.toLowerCase());

    return matchesSubject && matchesArea && matchesSearch;
  });

  const pendingRequestsCount = myRequests.filter(r => r.status === 'pending').length;
  const acceptedRequestsCount = myRequests.filter(r => r.status === 'accepted').length;

  return (
    <div className="space-y-5">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{lang === 'bn' ? 'হোম টিউটর ও গৃহশিক্ষক পোর্টাল' : 'Home Tutor Directory'}</span>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {lang === 'bn' ? 'বাসায় পড়ার শিক্ষক' : 'Home Tuition'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'আপনার এলাকার অভিজ্ঞ শিক্ষকদের প্রোফাইল দেখে বাসায় এসে পড়ানোর জন্য রিকোয়েস্ট পাঠান।' 
              : 'Browse verified tutors and hire for home tuition in your neighborhood.'}
          </p>
        </div>

        <button
          onClick={() => handleOpenRequestModal(null)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন টিউশন জব পোস্ট করুন' : 'Post Tuition Job'}</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tutors')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'tutors'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {lang === 'bn' ? 'ভেরিফাইড শিক্ষক তালিকা' : 'Available Tutors'} ({tutors.length})
        </button>

        <button
          onClick={() => setActiveTab('my-requests')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'my-requests'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>{lang === 'bn' ? 'আমার পাঠানো রিকোয়েস্টসমূহ' : 'My Tuition Requests'}</span>
          {myRequests.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              acceptedRequestsCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {myRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TUTORS DIRECTORY */}
      {activeTab === 'tutors' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Subject quick filter */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'all', label: lang === 'bn' ? 'সকল বিষয়' : 'All' },
                  { id: 'গণিত', label: lang === 'bn' ? 'উচ্চতর গণিত' : 'Math' },
                  { id: 'পদার্থবিজ্ঞান', label: lang === 'bn' ? 'পদার্থবিজ্ঞান' : 'Physics' },
                  { id: 'রসায়ন', label: lang === 'bn' ? 'রসায়ন' : 'Chemistry' },
                  { id: 'আইসিটি', label: lang === 'bn' ? 'আইসিটি' : 'ICT' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSubjectFilter(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      selectedSubjectFilter === item.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Area select */}
              <select
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="all">{lang === 'bn' ? 'সকল এলাকা' : 'All Areas'}</option>
                <option value="ধানমন্ডি">ধানমন্ডি (Dhanmondi)</option>
                <option value="মোহাম্মদপুর">মোহাম্মদপুর (Mohammadpur)</option>
                <option value="মিরপুর">মিরপুর (Mirpur)</option>
                <option value="উত্তরা">উত্তরা (Uttara)</option>
                <option value="গুলশান">গুলশান / বনানী (Gulshan)</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchSubject}
                onChange={e => setSearchSubject(e.target.value)}
                placeholder={lang === 'bn' ? 'শিক্ষক বা বিষয়ের নাম...' : 'Search tutor or subject...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Tutors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTutors.map(tutor => (
              <div
                key={tutor.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition flex flex-col justify-between gap-3.5"
              >
                {/* Header Profile */}
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={tutor.avatar}
                      alt={tutor.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {tutor.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {tutor.title}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{tutor.rating}</span>
                          <span className="text-slate-400 text-[10px]">({tutor.reviewCount})</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100">
                          {tutor.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {tutor.bio || 'উচ্চতর গণিত ও পদার্থবিজ্ঞানে বোর্ড পরীক্ষার স্পেশাল প্রস্তুতি।'}
                  </p>

                  {/* Subject Badges */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {tutor.subjects?.map((sub, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  {/* Areas & Details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate text-[11px]">
                        {tutor.preferredAreas?.slice(0, 3).join(', ')}...
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lang === 'bn' ? 'বেতন / পারিশ্রমিক:' : 'Estimated Fee:'}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(tutor.hourlyRate)} {lang === 'bn' ? '/ ঘণ্টা' : '/ hr'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRequestModal(tutor)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'হোম টিউটর রিকোয়েস্ট' : 'Hire Home Tutor'}</span>
                  </button>

                  {onNavigateToChat && (
                    <button
                      onClick={onNavigateToChat}
                      title={lang === 'bn' ? 'মেসেজ পাঠান' : 'Chat with Tutor'}
                      className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY SENT TUITION REQUESTS */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'bn' ? 'আপনি এখনো কোনো হোম টিউশন রিকোয়েস্ট পাঠাননি' : 'No tuition requests sent yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {lang === 'bn' 
                  ? 'উপরে শিক্ষক তালিকা থেকে আপনার পছন্দের শিক্ষককে নির্বাচন করে রিকোয়েস্ট পাঠান বা নতুন টিউশন পোস্ট করুন।' 
                  : 'Browse available tutors and send them a tuition request.'}
              </p>
              <button
                onClick={() => handleOpenRequestModal(null)}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'টিউশন রিকোয়েস্ট পাঠান' : 'Send New Request'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRequests.map(req => {
                const isAccepted = req.status === 'accepted';
                const isRejected = req.status === 'rejected';
                const isPending = req.status === 'pending';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl border p-4.5 space-y-3 transition shadow-sm ${
                      isAccepted 
                        ? 'border-emerald-300 bg-emerald-50/20' 
                        : isRejected 
                        ? 'border-rose-200 bg-rose-50/20' 
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Status & Date */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isAccepted 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : isRejected 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                      }`}>
                        {isAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>
                          {isAccepted 
                            ? (lang === 'bn' ? '🎉 শিক্ষক রিকোয়েস্ট গ্রহণ করেছেন' : 'Accepted by Teacher') 
                            : isRejected 
                            ? (lang === 'bn' ? 'বাতিল করা হয়েছে' : 'Declined') 
                            : (lang === 'bn' ? 'শিক্ষকের উত্তরের অপেক্ষায় (Pending)' : 'Pending Response')}
                        </span>
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Subject & Details */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {req.subject}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {req.grade} • {req.tuitionType === 'home' ? (lang === 'bn' ? 'বাসায় গিয়ে পড়ানো' : 'Home Tuition') : 'Online'}
                      </p>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">{lang === 'bn' ? 'এলাকা / ঠিকানা:' : 'Location:'}</span>
                        <span className="font-semibold text-slate-800">{req.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">{lang === 'bn' ? 'প্রস্তাবিত বেতন:' : 'Offered Salary:'}</span>
                        <span className="font-mono font-bold text-indigo-700">{formatMoney(req.salary)} / {lang === 'bn' ? 'মাস' : 'mo'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">{lang === 'bn' ? 'শিডিউল:' : 'Schedule:'}</span>
                        <span className="text-slate-700">{req.daysPerWeek}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">{lang === 'bn' ? 'সময়সূচী:' : 'Time Slot:'}</span>
                        <span className="text-slate-700 font-mono">{req.timeSlot}</span>
                      </div>
                    </div>

                    {/* Student note */}
                    {req.requirements && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                        <strong className="text-slate-700">{lang === 'bn' ? 'আমার নোট:' : 'My Note:'}</strong> {req.requirements}
                      </p>
                    )}

                    {/* Teacher feedback response note */}
                    {req.teacherResponseNote && (
                      <div className={`p-2.5 rounded-lg text-xs ${isAccepted ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                        <div className="font-semibold flex items-center gap-1 mb-0.5">
                          <span>{req.teacher?.name || 'শিক্ষক'}-এর প্রতিক্রিয়া:</span>
                        </div>
                        <p className="italic">"{req.teacherResponseNote}"</p>
                      </div>
                    )}

                    {/* Actions if accepted */}
                    {isAccepted && (
                      <div className="pt-2 border-t border-emerald-100 flex items-center gap-2">
                        {onNavigateToChat && (
                          <button
                            onClick={onNavigateToChat}
                            className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'শিক্ষকের সাথে চ্যাট করুন' : 'Chat with Teacher'}</span>
                          </button>
                        )}
                        <a
                          href={`tel:${req.teacher?.phone || '+8801712345678'}`}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'bn' ? 'কল করুন' : 'Call'}</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: POST TUITION JOB / HIRE TEACHER */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedTutorForRequest 
                    ? (lang === 'bn' ? `হোম টিউশন রিকোয়েস্ট পাঠান` : `Send Tuition Request`)
                    : (lang === 'bn' ? `নতুন হোম টিউশন জব পোস্ট করুন` : `Post a Home Tuition Job`)}
                </h3>
                {selectedTutorForRequest && (
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">
                    {lang === 'bn' ? 'শিক্ষক:' : 'Tutor:'} {selectedTutorForRequest.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {lang === 'bn' ? 'টিউশন রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!' : 'Tuition Request Sent Successfully!'}
                </h4>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' 
                    ? 'শিক্ষকের নিকট নতুন জব হিসেবে নোটিফিকেশন পৌঁছে গেছে। শিক্ষক গ্রহণ করলে আপনাকে জানিয়ে দেওয়া হবে।' 
                    : 'The tutor will review and respond to your request.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="mt-4 space-y-3.5">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পড়ার বিষয় ও কোর্স *' : 'Subject & Curriculum *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="যেমন: উচ্চতর গণিত ও পদার্থবিজ্ঞান"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'bn' ? 'শ্রেণী / গ্রেড *' : 'Grade / Level *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.grade}
                      onChange={e => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="যেমন: দ্বাদশ শ্রেণী (HSC 2026)"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'bn' ? 'প্রস্তাবিত মাসিক বেতন (টাকা) *' : 'Monthly Salary (BDT) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="500"
                      value={formData.salary}
                      onChange={e => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'bn' ? 'এলাকা / শহর *' : 'Area / City *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="যেমন: ধানমন্ডি, ঢাকা"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'bn' ? 'সাপ্তাহিক দিনসংখ্যা *' : 'Days per Week *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.daysPerWeek}
                      onChange={e => setFormData({ ...formData, daysPerWeek: e.target.value })}
                      placeholder="যেমন: ৩ দিন/সপ্তাহ (রবি, মঙ্গল, বৃহস্পতি)"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'bn' ? 'পড়ার সময়সূচী *' : 'Preferred Time Slot *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.timeSlot}
                      onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                      placeholder="যেমন: ০৫:৩০ PM - ০৭:০০ PM"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'bn' ? 'যোগাযোগের ফোন নম্বর *' : 'Contact Phone *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.studentPhone}
                      onChange={e => setFormData({ ...formData, studentPhone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'বাড়ির সুনির্দিষ্ট ঠিকানা' : 'Home Address'}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="রোড নম্বর, বাড়ি নম্বর, ফ্ল্যাট (শিক্ষক গ্রহণ করার পর যোগাযোগের জন্য)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'বিশেষ প্রয়োজনীয়তা / নোট' : 'Special Notes / Requirements'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.requirements}
                    onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="পড়ার ধরন বা শিক্ষকের নিকট কোনো বিশেষ প্রত্যাশা..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? 'রিকোয়েস্ট কনফার্ম করুন' : 'Confirm Request')}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
