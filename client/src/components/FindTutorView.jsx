import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, DollarSign, Calendar, Clock, Star, 
  CheckCircle2, XCircle, AlertCircle, Plus, Send, 
  MessageSquare, Phone, UserCheck, ShieldCheck, Filter, X,
  Briefcase, Sparkles, ArrowRight, RotateCcw, Check
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import TeacherReviewsModal from './TeacherReviewsModal';

export default function FindTutorView({ onNavigateToChat }) {
  const { currentUser, lang, formatMoney } = useAuth();
  const [activeTab, setActiveTab] = useState('tutors'); // 'tutors' | 'my-requests'
  const [tutors, setTutors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [searchSubject, setSearchSubject] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedSalaryFilter, setSelectedSalaryFilter] = useState('all'); // 'all' | '5000' | '8000' | '10000' | '12000' | '15000' | '20000'
  const [selectedDaysFilter, setSelectedDaysFilter] = useState('all'); // 'all' | '3' | '4' | 'sat_mon_wed' | 'sun_tue_thu' | 'weekend'
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'evening' | 'night'

  // Request Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTutorForRequest, setSelectedTutorForRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reviews Modal state
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedTutorForReview, setSelectedTutorForReview] = useState(null);

  const handleOpenReviews = (tutor) => {
    setSelectedTutorForReview(tutor);
    setShowReviewsModal(true);
  };

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
      const preferredArea = (selectedArea !== 'all' ? selectedArea : tutor.preferredAreas?.[0]) || 'ধানমন্ডি, ঢাকা';
      const monthlyBudget = tutor.monthlyRate || 8000;
      const scheduleDays = tutor.availableScheduleDays?.[0] || '৩ দিন / সপ্তাহ (রবি, মঙ্গল, বৃহস্পতি)';
      const slot = tutor.availableTimeSlots?.[0] || '০৫:৩০ PM - ০৭:০০ PM';

      setFormData(prev => ({
        ...prev,
        subject: tutor.subjects?.[0] ? `${tutor.subjects[0]} ও পদার্থবিজ্ঞান` : prev.subject,
        location: preferredArea,
        salary: monthlyBudget,
        daysPerWeek: scheduleDays,
        timeSlot: slot
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        location: selectedArea !== 'all' ? selectedArea : prev.location,
        salary: selectedSalaryFilter !== 'all' ? Number(selectedSalaryFilter) : prev.salary
      }));
    }
    setSubmitSuccess(false);
    setShowRequestModal(true);
  };

  const handleResetFilters = () => {
    setSearchSubject('');
    setSelectedArea('all');
    setSelectedSubjectFilter('all');
    setSelectedSalaryFilter('all');
    setSelectedDaysFilter('all');
    setSelectedTimeFilter('all');
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

  // Client-side filtering across Salary, Location, Schedule, and Subject
  const filteredTutors = tutors.filter(t => {
    // Subject filter
    const matchesSubject = selectedSubjectFilter === 'all' || 
      t.subjects?.some(s => s.toLowerCase().includes(selectedSubjectFilter.toLowerCase())) ||
      t.title?.toLowerCase().includes(selectedSubjectFilter.toLowerCase());

    // Location / Area filter
    const matchesArea = selectedArea === 'all' || 
      t.preferredAreas?.some(a => a.toLowerCase().includes(selectedArea.toLowerCase()));

    // Salary filter (Budget max)
    const monthlyRate = t.monthlyRate || (t.hourlyRate ? t.hourlyRate * 12 : 7000);
    const matchesSalary = selectedSalaryFilter === 'all' || monthlyRate <= Number(selectedSalaryFilter);

    // Schedule days filter
    const matchesDays = selectedDaysFilter === 'all' || (() => {
      const daysStr = (t.availableScheduleDays || []).join(' ').toLowerCase();
      if (selectedDaysFilter === '3') return daysStr.includes('৩ দিন') || daysStr.includes('3');
      if (selectedDaysFilter === '4') return daysStr.includes('৪ দিন') || daysStr.includes('4');
      if (selectedDaysFilter === 'sat_mon_wed') return daysStr.includes('শনি') || daysStr.includes('সোম');
      if (selectedDaysFilter === 'sun_tue_thu') return daysStr.includes('রবি') || daysStr.includes('মঙ্গল');
      if (selectedDaysFilter === 'weekend') return daysStr.includes('শুক্র') || daysStr.includes('weekend');
      return true;
    })();

    // Schedule time slot filter
    const matchesTime = selectedTimeFilter === 'all' || (() => {
      const timesStr = (t.availableTimeSlots || []).join(' ').toLowerCase();
      if (selectedTimeFilter === 'morning') return timesStr.includes('সকাল') || timesStr.includes('am');
      if (selectedTimeFilter === 'afternoon') return timesStr.includes('দুপুর');
      if (selectedTimeFilter === 'evening') return timesStr.includes('বিকাল') || timesStr.includes('সন্ধ্যা') || timesStr.includes('pm');
      if (selectedTimeFilter === 'night') return timesStr.includes('রাত');
      return true;
    })();

    // General text search
    const matchesSearch = !searchSubject || 
      t.name.toLowerCase().includes(searchSubject.toLowerCase()) ||
      t.subjects?.some(s => s.toLowerCase().includes(searchSubject.toLowerCase())) ||
      t.title?.toLowerCase().includes(searchSubject.toLowerCase()) ||
      t.preferredAreas?.some(a => a.toLowerCase().includes(searchSubject.toLowerCase()));

    return matchesSubject && matchesArea && matchesSalary && matchesDays && matchesTime && matchesSearch;
  });

  const isFilterActive = selectedArea !== 'all' || selectedSubjectFilter !== 'all' || selectedSalaryFilter !== 'all' || selectedDaysFilter !== 'all' || selectedTimeFilter !== 'all' || Boolean(searchSubject);

  const pendingRequestsCount = myRequests.filter(r => r.status === 'pending').length;
  const acceptedRequestsCount = myRequests.filter(r => r.status === 'accepted').length;

  return (
    <div className="space-y-5">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{lang === 'bn' ? 'হোম টিউটর ও গৃহশিক্ষক পোর্টাল' : 'Home Tutor Directory'}</span>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
              {lang === 'bn' ? 'বেতন, লোকেশন ও শিডিউল ফিল্টার' : 'Salary, Location & Schedule'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'আপনার বাজেট, এলাকা ও সুবিধাজনক সময় অনুযায়ী অভিজ্ঞ গৃহশিক্ষক খুঁজে বাসায় পড়ার রিকোয়েস্ট পাঠান।' 
              : 'Filter verified tutors by salary budget, neighborhood, and days/time slot to request home tutoring.'}
          </p>
        </div>

        <button
          onClick={() => handleOpenRequestModal(null)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'গৃহশিক্ষক রিকোয়েস্ট পাঠান' : 'Request Home Tutor'}</span>
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
          {lang === 'bn' ? 'গৃহশিক্ষক তালিকা' : 'Available Tutors'} ({filteredTutors.length})
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

      {/* TAB 1: TUTORS DIRECTORY & ADVANCED FILTERS */}
      {activeTab === 'tutors' && (
        <div className="space-y-4">
          
          {/* Main Advanced Filter Bar: Salary, Location & Schedule */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            
            {/* Search and Primary Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* 1. Keyword / Subject Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchSubject}
                  onChange={e => setSearchSubject(e.target.value)}
                  placeholder={lang === 'bn' ? 'শিক্ষক বা বিষয় খুঁজুন...' : 'Search tutor or subject...'}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>

              {/* 2. Location / Area Filter */}
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-rose-500 absolute left-3 top-2.5" />
                <select
                  value={selectedArea}
                  onChange={e => setSelectedArea(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none font-medium"
                >
                  <option value="all">{lang === 'bn' ? 'সকল এলাকা (All Locations)' : 'All Locations'}</option>
                  <option value="ধানমন্ডি">ধানমন্ডি (Dhanmondi)</option>
                  <option value="মোহাম্মদপুর">মোহাম্মদপুর (Mohammadpur)</option>
                  <option value="মিরপুর">মিরপুর (Mirpur)</option>
                  <option value="উত্তরা">উত্তরা (Uttara)</option>
                  <option value="গুলশান">গুলশান / বনানী (Gulshan/Banani)</option>
                  <option value="বাড্ডা">বাড্ডা / রামপুরা (Badda/Rampura)</option>
                  <option value="বসুন্ধরা">বসুন্ধরা আবাসিক এলাকা (Bashundhara)</option>
                  <option value="লালমাটিয়া">লালমাটিয়া (Lalmatia)</option>
                  <option value="অনলাইন">অনলাইন সারা বাংলাদেশ (Online)</option>
                </select>
              </div>

              {/* 3. Salary Budget Filter */}
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-2.5" />
                <select
                  value={selectedSalaryFilter}
                  onChange={e => setSelectedSalaryFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none font-medium"
                >
                  <option value="all">{lang === 'bn' ? 'সকল বাজেট (Any Budget)' : 'Any Budget'}</option>
                  <option value="5000">সর্বোচ্চ ৳৫,০০০ / মাস</option>
                  <option value="8000">সর্বোচ্চ ৳৮,০০০ / মাস</option>
                  <option value="10000">সর্বোচ্চ ৳১০,০০০ / মাস</option>
                  <option value="15000">সর্বোচ্চ ৳১৫,০০০ / মাস</option>
                  <option value="20000">সর্বোচ্চ ৳২০,০০০ / মাস</option>
                </select>
              </div>

              {/* 4. Schedule Days Filter */}
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-2.5" />
                <select
                  value={selectedDaysFilter}
                  onChange={e => setSelectedDaysFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none font-medium"
                >
                  <option value="all">{lang === 'bn' ? 'সাপ্তাহিক শিডিউল (Any Days)' : 'Any Schedule'}</option>
                  <option value="3">৩ দিন / সপ্তাহ (3 Days/Week)</option>
                  <option value="4">৪ দিন / সপ্তাহ (4 Days/Week)</option>
                  <option value="sat_mon_wed">শনি-সোম-বুধ (Sat-Mon-Wed)</option>
                  <option value="sun_tue_thu">রবি-মঙ্গল-বৃহস্পতি (Sun-Tue-Thu)</option>
                  <option value="weekend">উইকেন্ড (শুক্র ও শনি)</option>
                </select>
              </div>

            </div>

            {/* Secondary Controls: Shift/Time and Subject Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">বিষয়:</span>
                {[
                  { id: 'all', label: 'সকল' },
                  { id: 'গণিত', label: 'উচ্চতর গণিত' },
                  { id: 'পদার্থবিজ্ঞান', label: 'পদার্থবিজ্ঞান' },
                  { id: 'রসায়ন', label: 'রসায়ন' },
                  { id: 'আইসিটি', label: 'আইসিটি' },
                  { id: 'ইংরেজি', label: 'ইংরেজি' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSubjectFilter(item.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                      selectedSubjectFilter === item.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Time Slot / Shift Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <select
                    value={selectedTimeFilter}
                    onChange={e => setSelectedTimeFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none font-medium"
                  >
                    <option value="all">পড়ার সময় (Any Shift)</option>
                    <option value="morning">সকাল (০৮:০০ AM - ১২:০০ PM)</option>
                    <option value="afternoon">দুপুর (১২:০০ PM - ০৪:০০ PM)</option>
                    <option value="evening">বিকাল/সন্ধ্যা (০৪:০০ PM - ০৮:০০ PM)</option>
                    <option value="night">রাত (০৮:০০ PM - ১০:০০ PM)</option>
                  </select>
                </div>

                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>রিসেট</span>
                  </button>
                )}
              </div>

            </div>

            {/* Active Filter Summary Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                ফিল্টারে মোট <strong>{filteredTutors.length}</strong> জন উপযুক্ত শিক্ষক পাওয়া গেছে
              </span>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
                হোম টিউশন & অনলাইন ১-অন-১
              </span>
            </div>

          </div>

          {/* Tutors Grid */}
          {filteredTutors.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">আপনার ফিল্টারে কোনো শিক্ষক পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                অনুগ্রহ করে বাজেট, এলাকা বা সময় ফিল্টার কিছুটা পরিবর্তন করে আবার চেষ্টা করুন, অথবা সরাসরি নতুন টিউশন রিকোয়েস্ট পাঠান।
              </p>
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>সব ফিল্টার ক্লিয়ার করুন</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTutors.map(tutor => {
                const monthlySalary = tutor.monthlyRate || (tutor.hourlyRate * 12);

                return (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition flex flex-col justify-between gap-3.5"
                  >
                    {/* Header Profile */}
                    <div>
                      <div className="flex items-start gap-3">
                        <img
                          src={tutor.avatar}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{tutor.name}</h4>
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              {tutor.badge || 'ভেরিফাইড'}
                            </span>
                          </div>
                          
                          {/* Live Star Rating Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReviews(tutor)}
                            className="flex items-center gap-1 mt-0.5 text-xs text-amber-600 hover:text-amber-700 font-bold group"
                            title="শিক্ষার্থী রিভিউ ও রেটিং দেখুন"
                          >
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-mono text-slate-900">{tutor.rating || '5.0'}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 group-hover:underline font-normal">
                              ({tutor.reviewCount || 0} রিভিউ)
                            </span>
                          </button>

                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tutor.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{tutor.education}</p>
                        </div>
                      </div>

                      {/* Highlighted Meta: Salary, Location, Schedule */}
                      <div className="mt-3 space-y-1.5 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                        {/* Salary */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span>মাসিক বেতন:</span>
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            {formatMoney(monthlySalary)} <span className="text-[10px] text-slate-400 font-normal">/ মাস</span>
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-start justify-between text-[11px] gap-2">
                          <span className="text-slate-500 flex items-center gap-1 shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>এলাকা:</span>
                          </span>
                          <span className="text-slate-700 text-right truncate">
                            {tutor.preferredAreas?.slice(0, 3).join(', ')}
                          </span>
                        </div>

                        {/* Schedule */}
                        <div className="flex items-start justify-between text-[11px] gap-2">
                          <span className="text-slate-500 flex items-center gap-1 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>শিডিউল:</span>
                          </span>
                          <span className="text-slate-700 text-right truncate">
                            {tutor.availableScheduleDays?.[0] || '৩ দিন/সপ্তাহ'} • {tutor.availableTimeSlots?.[0]?.split(' ')[0] || 'বিকাল'}
                          </span>
                        </div>
                      </div>

                      {/* Subjects pills */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {tutor.subjects?.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRequestModal(tutor)}
                        className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>বাসায় পড়াতে বলুন</span>
                      </button>

                      <button
                        onClick={() => handleOpenReviews(tutor)}
                        title="শিক্ষার্থী রিভিউ ও রেটিং"
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>রিভিউ</span>
                      </button>

                      {onNavigateToChat && (
                        <button
                          onClick={onNavigateToChat}
                          title="Message Tutor"
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MY TUITION REQUESTS */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'bn' ? 'আমার প্রেরিত হোম টিউশন রিকোয়েস্টসমূহ' : 'My Home Tuition Requests'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'শিক্ষকের নিকট পাঠানো প্রস্তাবের অগ্রগতি ও প্রতিক্রিয়া দেখুন।' : 'Track status of your sent tuition requests.'}
              </p>
            </div>
            <button
              onClick={() => handleOpenRequestModal(null)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নতুন রিকোয়েস্ট' : 'New Request'}</span>
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">কোনো টিউশন রিকোয়েস্ট পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                আপনি এখনো কোনো গৃহশিক্ষককে রিকোয়েস্ট পাঠাননি। "গৃহশিক্ষক তালিকা" থেকে আপনার পছন্দের শিক্ষককে নির্বাচন করে রিকোয়েস্ট পাঠান।
              </p>
              <button
                onClick={() => setActiveTab('tutors')}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                শিক্ষক তালিকা দেখুন
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map(req => {
                const isAccepted = req.status === 'accepted';
                const isRejected = req.status === 'rejected';
                const isPending = req.status === 'pending';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl border p-4 transition ${
                      isAccepted ? 'border-emerald-200 bg-emerald-50/20' : isRejected ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{req.subject}</h4>
                          <span className="text-xs text-slate-500">({req.grade})</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          পাঠানো হয়েছে: {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                        isAccepted 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : isRejected 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                      }`}>
                        {isAccepted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>গৃহীত (Accepted)</span>
                          </>
                        ) : isRejected ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>প্রত্যাখ্যাত (Declined)</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>অপেক্ষমাণ (Pending Review)</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>প্রস্তাবিত বেতন: <strong className="text-slate-900 font-mono font-bold">{formatMoney(req.salary)}/মাস</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>এলাকা: <strong className="text-slate-900">{req.location}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>শিডিউল: <strong className="text-slate-900">{req.daysPerWeek}</strong> ({req.timeSlot})</span>
                      </div>
                    </div>

                    {req.teacherResponseNote && (
                      <div className={`p-2.5 rounded-lg text-xs mt-1 ${
                        isAccepted ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-rose-50 text-rose-900 border border-rose-100'
                      }`}>
                        <span className="font-bold block text-[11px]">শিক্ষকের প্রতিক্রিয়া:</span>
                        <p className="mt-0.5 italic">"{req.teacherResponseNote}"</p>
                      </div>
                    )}

                    {isAccepted && onNavigateToChat && (
                      <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={onNavigateToChat}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>শিক্ষকের সাথে চ্যাট শুরু করুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* REQUEST HOME TUTOR MODAL (Based on Salary, Location & Schedule) */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-700" />
                  <span>
                    {selectedTutorForRequest 
                      ? `${selectedTutorForRequest.name}-কে পড়ার রিকোয়েস্ট পাঠান` 
                      : 'হোম টিউটর রিকোয়েস্ট ফর্ম'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  বেতন, এলাকা ও সাপ্তাহিক শিডিউল উল্লেখ করে রিকোয়েস্ট জমা দিন।
                </p>
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
                    ? 'শিক্ষকের নিকট নতুন জব হিসেবে নোটিফিকেশন পৌঁছে গেছে। শিক্ষক গ্রহণ করলে ইনবক্সে জানিয়ে দেওয়া হবে।' 
                    : 'The tutor will review and respond to your request.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="mt-4 space-y-3.5">
                
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পড়ার বিষয় ও সিলেবাস *
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

                {/* Grade and Tuition Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      শ্রেণী / গ্রেড *
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
                      টিউশন মাধ্যম *
                    </label>
                    <select
                      value={formData.tuitionType}
                      onChange={e => setFormData({ ...formData, tuitionType: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-medium"
                    >
                      <option value="home">হোম টিউশন (শিক্ষক বাসায় আসবেন)</option>
                      <option value="online">অনলাইন ১-অন-১ (Zoom Live)</option>
                    </select>
                  </div>
                </div>

                {/* Salary Section with Quick Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      প্রস্তাবিত মাসিক বেতন (টাকা) *
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-700">
                      {formatMoney(formData.salary)} / মাস
                    </span>
                  </div>
                  
                  <input
                    type="number"
                    required
                    min="2000"
                    step="500"
                    value={formData.salary}
                    onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-mono font-bold"
                  />

                  {/* Quick salary chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">কুইক বাজেট:</span>
                    {[5000, 8000, 10000, 12000, 15000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormData({ ...formData, salary: amt })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                          formData.salary === amt
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        ৳{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      এলাকা / লোকেশন *
                    </label>
                    <select
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-medium"
                    >
                      <option value="ধানমন্ডি, ঢাকা">ধানমন্ডি, ঢাকা</option>
                      <option value="মোহাম্মদপুর, ঢাকা">মোহাম্মদপুর, ঢাকা</option>
                      <option value="মিরপুর, ঢাকা">মিরপুর, ঢাকা</option>
                      <option value="উত্তরা, ঢাকা">উত্তরা, ঢাকা</option>
                      <option value="গুলশান / বনানী, ঢাকা">গুলশান / বনানী, ঢাকা</option>
                      <option value="বাড্ডা / রামপুরা, ঢাকা">বাড্ডা / রামপুরা, ঢাকা</option>
                      <option value="বসুন্ধরা আবাসিক এলাকা, ঢাকা">বসুন্ধরা আবাসিক এলাকা, ঢাকা</option>
                      <option value="লালমাটিয়া, ঢাকা">লালমাটিয়া, ঢাকা</option>
                      <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                      <option value="অনলাইন সারা বাংলাদেশ">অনলাইন সারা বাংলাদেশ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      সাপ্তাহিক দিনসংখ্যা *
                    </label>
                    <select
                      value={formData.daysPerWeek}
                      onChange={e => setFormData({ ...formData, daysPerWeek: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-medium"
                    >
                      <option value="৩ দিন / সপ্তাহ (রবি, মঙ্গল, বৃহস্পতি)">৩ দিন / সপ্তাহ (রবি, মঙ্গল, বৃহস্পতি)</option>
                      <option value="৩ দিন / সপ্তাহ (শনি, সোম, বুধ)">৩ দিন / সপ্তাহ (শনি, সোম, বুধ)</option>
                      <option value="৪ দিন / সপ্তাহ (শনি, সোম, মঙ্গল, বৃহস্পতি)">৪ দিন / সপ্তাহ (শনি, সোম, মঙ্গল, বৃহস্পতি)</option>
                      <option value="৫ দিন / সপ্তাহ (রবি থেকে বৃহস্পতি)">৫ দিন / সপ্তাহ (রবি থেকে বৃহস্পতি)</option>
                      <option value="উইকেন্ড (শুক্রবার ও শনিবার)">উইকেন্ড (শুক্রবার ও শনিবার)</option>
                    </select>
                  </div>
                </div>

                {/* Schedule Time & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      পড়ার সময়সূচী *
                    </label>
                    <select
                      value={formData.timeSlot}
                      onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 font-medium font-mono"
                    >
                      <option value="০৮:০০ AM - ০৯:৩০ AM">সকাল ০৮:০০ AM - ০৯:৩০ AM</option>
                      <option value="১০:০০ AM - ১১:৩০ AM">সকাল ১০:০০ AM - ১১:৩০ AM</option>
                      <option value="০৪:০০ PM - ০৫:৩০ PM">বিকাল ০৪:০০ PM - ০৫:৩০ PM</option>
                      <option value="০৫:৩০ PM - ০৭:০০ PM">সন্ধ্যা ০৫:৩০ PM - ০৭:০০ PM</option>
                      <option value="০৭:০০ PM - ০৮:৩০ PM">রাত ০৭:০০ PM - ০৮:৩০ PM</option>
                      <option value="০৮:০০ PM - ০৯:৩০ PM">রাত ০৮:০০ PM - ০৯:৩০ PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      শিক্ষার্থীর ফোন নম্বর *
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

                {/* Specific Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বাসার সুনির্দিষ্ট ঠিকানা / ল্যান্ডমার্ক
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="রোড নম্বর, বাড়ি নম্বর, ফ্ল্যাট (শিক্ষক গ্রহণ করার পর যোগাযোগের জন্য)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>

                {/* Requirements / Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিশেষ প্রয়োজনীয়তা / প্রত্যাশা
                  </label>
                  <textarea
                    rows={2}
                    value={formData.requirements}
                    onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="পড়ার ধরন বা শিক্ষকের নিকট কোনো বিশেষ প্রত্যাশা..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'পাঠানো হচ্ছে...' : 'রিকোয়েস্ট কনফার্ম করুন'}</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* Teacher Reviews & Star Rating Modal */}
      <TeacherReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        teacher={selectedTutorForReview}
        onReviewAdded={() => loadData()}
      />

    </div>
  );
}
