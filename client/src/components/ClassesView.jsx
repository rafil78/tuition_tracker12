import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Video, Users, Clock, DollarSign, Plus, 
  MapPin, CheckCircle, ExternalLink, Calendar as CalendarIcon, Trash2, 
  Edit3, AlertCircle, Check, X, ArrowRight, MessageSquare, 
  Sparkles, ShieldCheck, ChevronLeft, ChevronRight, UserCheck, User, Smartphone,
  CreditCard, CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import TimeChangeModal from './TimeChangeModal';
import ZoomJoinModal from './ZoomJoinModal';
import { autoDeleteRecord } from '../firestoreSync';

export default function ClassesView({ classes, enrollments, onRefresh, onEnrollInBatch }) {
  const { currentUser, isTeacher, formatMoney, currencySymbol, lang } = useAuth();
  
  // View mode: 'list' (কোর্স ও ব্যাচ তালিকা) | 'calendar' (টিউশন ক্যালেন্ডার) | 'requests' (পরিবর্তনের অনুরোধ)
  const [activeTab, setActiveTab] = useState('list');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showTimeRequestModal, setShowTimeRequestModal] = useState(false);
  const [selectedRescheduleClass, setSelectedRescheduleClass] = useState(null);
  const [selectedZoomClass, setSelectedZoomClass] = useState(null);

  // Time change requests state
  const [timeRequests, setTimeRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Form state
  const [tuitionType, setTuitionType] = useState('batch'); // 'batch' | 'individual'
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('উচ্চতর গণিত');
  const [gradeLevel, setGradeLevel] = useState('একাদশ - দ্বাদশ শ্রেণী (Grade 11 - 12)');
  const [scheduleDays, setScheduleDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [timeSlot, setTimeSlot] = useState('05:00 PM - 06:30 PM');
  const [monthlyFee, setMonthlyFee] = useState('3200');
  const [perClassRate, setPerClassRate] = useState('500');
  const [zoomLink, setZoomLink] = useState('https://zoom.us/j/89214208912?pwd=edutrack');
  const [zoomMeetingId, setZoomMeetingId] = useState('892 1420 8912');
  const [zoomPassword, setZoomPassword] = useState('edutrack');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Calendar State (Current month)
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = [
    { key: 'Sunday', name: 'রবিবার (Sun)' },
    { key: 'Monday', name: 'সোমবার (Mon)' },
    { key: 'Tuesday', name: 'মঙ্গলবার (Tue)' },
    { key: 'Wednesday', name: 'বুধবার (Wed)' },
    { key: 'Thursday', name: 'বৃহস্পতিবার (Thu)' },
    { key: 'Friday', name: 'শুক্রবার (Fri)' },
    { key: 'Saturday', name: 'শনিবার (Sat)' }
  ];

  const loadTimeRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await api.getTimeRequests();
      setTimeRequests(data);
    } catch (err) {
      console.error('Failed to load time change requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadTimeRequests();
  }, []);

  const toggleDay = (dayKey) => {
    if (scheduleDays.includes(dayKey)) {
      setScheduleDays(scheduleDays.filter(d => d !== dayKey));
    } else {
      setScheduleDays([...scheduleDays, dayKey]);
    }
  };

  const openAddModal = (type = 'batch') => {
    setEditingClass(null);
    setTuitionType(type);
    setTitle(type === 'individual' ? 'ব্যক্তিগত ১-অন-১ প্রাইভেট কোচিং' : 'এইচএসসি উচ্চতর গণিত লাইভ ব্যাচ');
    setSubject('উচ্চতর গণিত');
    setMonthlyFee(type === 'individual' ? '4500' : '3000');
    setPerClassRate(type === 'individual' ? '600' : '450');
    setScheduleDays(['Monday', 'Wednesday']);
    setTimeSlot('05:00 PM - 06:30 PM');
    setZoomLink('https://zoom.us/j/89214208912?pwd=edutrack');
    setZoomMeetingId('892 1420 8912');
    setZoomPassword('edutrack');
    setDescription(type === 'individual' ? 'একক শিক্ষার্থীর জন্য নিবিড় তত্ত্বীয় ও সমস্যা সমাধান সেশন।' : 'লাইভ ইন্টারঅ্যাক্টিভ ব্যাচ ক্লাস ও বোর্ড পরীক্ষার প্রস্তুতি।');
    setShowAddModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setTuitionType(cls.type || 'batch');
    setTitle(cls.title);
    setSubject(cls.subject);
    setGradeLevel(cls.gradeLevel);
    setScheduleDays(cls.scheduleDays || []);
    setTimeSlot(cls.timeSlot);
    setMonthlyFee(String(cls.monthlyFee));
    setPerClassRate(String(cls.perClassRate || Math.round(cls.monthlyFee / 8)));
    setZoomLink(cls.zoomLink || cls.meetingLink || '');
    setZoomMeetingId(cls.zoomMeetingId || '892 1420 8912');
    setZoomPassword(cls.zoomPassword || 'edutrack');
    setDescription(cls.description || '');
    setShowAddModal(true);
  };

  const handleCreateOrUpdateClass = async (e) => {
    e.preventDefault();
    if (!title || !subject) return;
    setLoading(true);

    try {
      const payload = {
        type: tuitionType,
        title,
        subject,
        gradeLevel,
        scheduleDays,
        timeSlot,
        monthlyFee: Number(monthlyFee),
        perClassRate: Number(perClassRate),
        hourlyRate: Math.round(Number(perClassRate) * 0.8),
        zoomLink,
        zoomMeetingId,
        zoomPassword,
        meetingLink: zoomLink,
        description,
        teacherId: currentUser?.id || 'teacher-1'
      };

      if (editingClass) {
        await api.updateClass(editingClass.id, payload);
      } else {
        await api.createClass(payload);
      }

      setShowAddModal(false);
      setEditingClass(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to save tuition schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId, classTitle) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${classTitle}" কোর্সটি মুছে ফেলতে চান? এটি Firebase থেকেও মুছে যাবে।`)) return;

    try {
      await api.deleteClass(classId);
      await autoDeleteRecord('classes', classId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete class:', err);
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await api.respondTimeRequest(requestId, status);
      await loadTimeRequests();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to respond to time request:', err);
    }
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const monthNames = [
    'জানুয়ারি (January)', 'ফেব্রুয়ারি (February)', 'মার্চ (March)', 
    'এপ্রিল (April)', 'মে (May)', 'জুন (June)', 'জুলাই (July)', 
    'আগস্ট (August)', 'সেপ্টেম্বর (September)', 'অক্টোবর (October)', 
    'নভেম্বর (November)', 'ডিসেম্বর (December)'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getClassesForDate = (dateObj) => {
    const dayName = fullWeekdays[dateObj.getDay()];
    const dateStr = dateObj.toISOString().split('T')[0];

    return classes.filter(cls => {
      // 1. Matches fixed recurring days of week
      const matchesRecurring = Array.isArray(cls.scheduleDays) && cls.scheduleDays.includes(dayName);
      // 2. Matches specific calendar date slots / reschedules
      const matchesSpecificSlot = Array.isArray(cls.calendarSlots) && cls.calendarSlots.some(s => s.date === dateStr);
      return matchesRecurring || matchesSpecificSlot;
    });
  };

  const pendingRequestsCount = timeRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === 'bn' ? 'টিউশন শিডিউল ও ক্লাসরুম' : 'Schedule & Live Classes'}
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {lang === 'bn' ? 'ব্যাচ ও ১-অন-১' : 'Batch & 1-on-1'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'ব্যাচ ও একক টিউশন শিডিউল, অনলাইন ক্লাস এবং সময় পরিবর্তনের অনুরোধ'
              : 'Tutoring schedule, Zoom live meetings and reschedule requests'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isTeacher && (
            <>
              <button
                onClick={() => openAddModal('individual')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'bn' ? '+ ১-অন-১ একক' : '+ 1-on-1'}</span>
              </button>

              <button
                onClick={() => openAddModal('batch')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-slate-300" />
                <span>{lang === 'bn' ? '+ নতুন ব্যাচ' : '+ New Batch'}</span>
              </button>
            </>
          )}

          {!isTeacher && (
            <button
              onClick={() => {
                setSelectedRescheduleClass(classes[0]);
                setShowTimeRequestModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? 'সময় পরিবর্তনের অনুরোধ' : 'Request Reschedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs: List View vs Interactive Calendar vs Reschedule Requests */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'list'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? `কোর্স ও ব্যাচ (${classes.length})` : `Batches (${classes.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'calendar'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ক্যালেন্ডার ও লাইভ' : 'Calendar & Live'}</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'পরিবর্তন অনুরোধ' : 'Reschedule Requests'}</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1: TUITION BATCH & INDIVIDUAL LIST ================= */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map(cls => {
            const isIndividual = cls.type === 'individual';
            const enrolledList = enrollments.filter(e => e.classId === cls.id);

            return (
              <div 
                key={cls.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header Strip */}
                  <div className={`p-4 ${isIndividual ? 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white' : 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white'} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                        {isIndividual ? '👤 ১-অন-১ একক' : '👥 লাইভ ব্যাচ'}
                      </span>
                      <span className="text-[11px] font-medium text-white/90">
                        {cls.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isTeacher && (
                        <>
                          <button
                            onClick={() => openEditModal(cls)}
                            className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                            title="Edit Tuition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id, cls.title)}
                            className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                            title="Delete Tuition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3.5">
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                        {cls.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {cls.description || 'বোর্ড ও ভর্তি পরীক্ষার স্পেশাল অনলাইন টিউশন প্রোগ্রাম।'}
                      </p>
                    </div>

                    {/* Schedule & Timing Box */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>সময় (Time):</span>
                        </span>
                        <span className="font-mono font-bold text-slate-800">{cls.timeSlot}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>দিন (Days):</span>
                        </span>
                        <span className="font-bold text-indigo-600">{cls.scheduleDays?.join(', ')}</span>
                      </div>
                    </div>

                    {/* Money Setup Card */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase block">মাসিক ফি (Monthly)</span>
                        <span className="text-base font-black font-mono text-emerald-800">
                          {formatMoney(cls.monthlyFee)}
                        </span>
                      </div>

                      <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                        <span className="text-[10px] text-amber-700 font-bold uppercase block">ক্লাস প্রতি রেট</span>
                        <span className="text-base font-black font-mono text-amber-800">
                          {formatMoney(cls.perClassRate || Math.round(cls.monthlyFee / 8))}
                        </span>
                      </div>
                    </div>

                    {/* Zoom Direct Join & Phone SMS Notification Card */}
                    <div className="pt-1 space-y-2">
                      <button
                        onClick={() => setSelectedZoomClass(cls)}
                        className="w-full py-2.5 px-3 bg-[#2d8cff] hover:bg-[#1f7ae6] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4 fill-current" />
                        <span>{lang === 'bn' ? '🎥 জুমে সরাসরি যুক্ত হন (Zoom Live)' : 'Join Zoom Meeting'}</span>
                      </button>

                      {(isTeacher || currentUser?.role === 'admin') && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.sendClassReminder(cls.id);
                              alert(lang === 'bn' 
                                ? `✅ "${cls.title}" ক্লাসের নোটিফিকেশন ${res.totalDispatched || res.recipients?.length || 0} জনের ফোনে SMS পাঠানো হয়েছে!`
                                : `✅ Class reminder SMS dispatched to ${res.totalDispatched || res.recipients?.length || 0} phones!`);
                            } catch (e) {
                              alert('SMS dispatch failed: ' + e.message);
                            }
                          }}
                          className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                          <span>{lang === 'bn' ? '📱 সবার ফোনে SMS নোটিফিকেশন' : 'Notify All Phones (SMS)'}</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* Card Footer: Student Roster & Reschedule/Enroll Action */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-bold">{enrolledList.length} জন শিক্ষার্থী</span>
                  </div>

                  {!isTeacher && (
                    enrolledList.some(e => e.studentId === currentUser?.id) ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>এনরোল্ড • গ্রুপে যুক্ত</span>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedRescheduleClass(cls);
                            setShowTimeRequestModal(true);
                          }}
                          className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                        >
                          সময় পরিবর্তন →
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (onEnrollInBatch) onEnrollInBatch(cls);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>এনরোল করুন ({formatMoney(cls.monthlyFee)})</span>
                      </button>
                    )
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ================= TAB 2: INTERACTIVE CALENDAR & SCHEDULE ================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          
          {/* Calendar Header with Navigation */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {monthNames[month]} {year}
                </h3>
                <p className="text-xs text-slate-400">
                  নির্দিষ্ট দিন ও ক্যালেন্ডারের শিডিউল • এক ক্লিকে জুম ক্লাসে যোগদান
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
              >
                আজকে (Today)
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar 7-Day Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            
            {/* Weekday Titles Bar */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-2.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              {daysOfWeek.map(d => (
                <div key={d.key} className="truncate px-1">
                  {d.name}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
              
              {/* Blank offset days before first of month */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="bg-slate-50/40 p-2 min-h-[110px]" />
              ))}

              {/* Day cells for month */}
              {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const cellDate = new Date(year, month, dayNum);
                const isToday = new Date().toDateString() === cellDate.toDateString();
                const dayClasses = getClassesForDate(cellDate);

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`p-2 min-h-[110px] flex flex-col justify-between transition-colors ${
                      isToday ? 'bg-indigo-50/40 font-bold' : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-800'
                      }`}>
                        {dayNum}
                      </span>
                      {dayClasses.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {dayClasses.length} ক্লাস
                        </span>
                      )}
                    </div>

                    {/* Classes Scheduled on this date */}
                    <div className="space-y-1.5 flex-1">
                      {dayClasses.map(cls => (
                        <div
                          key={cls.id}
                          className={`p-1.5 rounded-xl border text-[11px] space-y-1 ${
                            cls.type === 'individual'
                              ? 'bg-purple-50/80 border-purple-200 text-purple-900'
                              : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate text-[10px]">
                              {cls.title}
                            </span>
                            <span className={`text-[8px] px-1 py-0.2 rounded font-black uppercase ${
                              cls.type === 'individual' ? 'bg-purple-200 text-purple-800' : 'bg-indigo-200 text-indigo-800'
                            }`}>
                              {cls.type === 'individual' ? 'একক' : 'ব্যাচ'}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono">
                            {cls.timeSlot}
                          </div>

                          {/* Direct Zoom Button inside calendar cell */}
                          <button
                            onClick={() => setSelectedZoomClass(cls)}
                            className="w-full py-1 px-1.5 bg-[#2d8cff] hover:bg-[#1a76e0] text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1 shadow-sm transition-colors"
                          >
                            <Video className="w-3 h-3 fill-current" />
                            <span>জুম ক্লাস</span>
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 3: RESCHEDULE REQUESTS ================= */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                শিক্ষার্থীদের শিডিউল ও সময় পরিবর্তনের অনুরোধসমূহ (Reschedule Requests)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                শিক্ষার্থী প্রস্তাবিত নতুন তারিখ ও সময় পর্যালোচনা করে অনুমোদন করুন
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              মোট অনুরোধ: {timeRequests.length} টি
            </span>
          </div>

          {timeRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              এখনো কোনো সময় পরিবর্তনের অনুরোধ নেই।
            </div>
          ) : (
            <div className="space-y-3">
              {timeRequests.map(req => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">
                          {req.student?.name || 'শিক্ষার্থী'}
                        </span>
                        <span className="text-xs text-slate-400">কোর্স:</span>
                        <span className="text-xs font-bold text-indigo-700">
                          {req.class?.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' :
                          isPending ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isApproved ? '✓ অনুমোদিত' : isPending ? 'অপেক্ষমাণ (Pending)' : 'প্রত্যাখ্যাত'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                        <span>বর্তমান সময়: <strong className="font-mono text-slate-800">{req.currentSlot}</strong></span>
                        <span>➔</span>
                        <span>প্রস্তাবিত নতুন সময়: <strong className="font-mono text-amber-700">{req.proposedSlot}</strong></span>
                        {req.proposedDate && (
                          <span className="text-indigo-600 font-bold">(তারিখ: {req.proposedDate})</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 italic">
                        কারণ: "{req.reason}"
                      </p>
                    </div>

                    {isTeacher && isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondRequest(req.id, 'approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>অনুমোদন করুন (Approve)</span>
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req.id, 'declined')}
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          বাতিল
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

      {/* ================= MODAL: CREATE / EDIT TUITION SCHEDULE ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-sans max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-6 relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                  {tuitionType === 'individual' ? '👤 ১-অন-১ একক টিউশন' : '👥 লাইভ ব্যাচ শিডিউল'}
                </span>
              </div>

              <h3 className="text-xl font-black tracking-tight">
                {editingClass ? 'টিউশন শিডিউল ও সেটিংস সম্পাদনা' : 'নতুন টিউশন শিডিউল সেটআপ করুন'}
              </h3>
              <p className="text-xs text-indigo-100 mt-1">
                ব্যাচ বা একক নির্বাচন করুন, অর্থ/সম্মানী নির্ধারণ করুন এবং ক্যালেন্ডারের দিন ফিক্স করুন।
              </p>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateOrUpdateClass} className="p-6 overflow-y-auto space-y-4">
              
              {/* Type Toggle: Batch vs Individual */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  টিউশনের ধরন নির্বাচন করুন (Tuition Type)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTuitionType('batch')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      tuitionType === 'batch'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">👥</span>
                    <div>
                      <p className="text-xs font-black">ব্যাচ টিউশন (Group Batch)</p>
                      <p className="text-[10px] text-slate-500">একাধিক শিক্ষার্থী এক ক্লাসে</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTuitionType('individual')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      tuitionType === 'individual'
                        ? 'border-purple-600 bg-purple-50/60 text-purple-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="text-xs font-black">একক টিউশন (1-on-1 Individual)</p>
                      <p className="text-[10px] text-slate-500">ব্যক্তিগত ১-অন-১ প্রাইভেট কেয়ার</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কোর্স / ব্যাচের নাম (Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="উদাঃ উচ্চতর গণিত ও ক্যালকুলাস"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বিষয় (Subject)
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="উদাঃ উচ্চতর গণিত / পদার্থবিজ্ঞান"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Money Setup: Monthly Fee & Per-Class Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মাসিক ফি (Monthly Amount in ৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={monthlyFee}
                    onChange={e => {
                      setMonthlyFee(e.target.value);
                      if (!perClassRate || perClassRate === '500') {
                        setPerClassRate(String(Math.round(Number(e.target.value) / 8)));
                      }
                    }}
                    placeholder="3000"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্লাস প্রতি ফি (Per-Class Rate in ৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={perClassRate}
                    onChange={e => setPerClassRate(e.target.value)}
                    placeholder="500"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                  <span className="text-[10px] text-rose-600 block mt-0.5">
                    * শিক্ষক ক্লাস বাদ দিলে এই পরিমাণ স্বয়ংক্রিয়ভাবে কর্তন হবে
                  </span>
                </div>
              </div>

              {/* Fixed Schedule Days Multi-Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ক্যালেন্ডারের নির্ধারিত দিনসমূহ (Fixed Schedule Days)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {daysOfWeek.map(d => {
                    const isSelected = scheduleDays.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleDay(d.key)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্লাসের নির্ধারিত সময় (Time Slot)
                </label>
                <input
                  type="text"
                  required
                  value={timeSlot}
                  onChange={e => setTimeSlot(e.target.value)}
                  placeholder="05:00 PM - 06:30 PM"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              {/* Zoom Online Classroom Setup */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#2d8cff]" />
                  <span className="text-xs font-black text-blue-900">
                    অনলাইন জুম ক্লাস সেটিংস (Zoom Online Classroom)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    জুম মিটিং লিংক (Zoom Link) - শিক্ষার্থীরা সরাসরি যুক্ত হতে পারবে
                  </label>
                  <input
                    type="url"
                    value={zoomLink}
                    onChange={e => setZoomLink(e.target.value)}
                    placeholder="https://zoom.us/j/89214208912?pwd=edutrack"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      মিটিং আইডি (Meeting ID)
                    </label>
                    <input
                      type="text"
                      value={zoomMeetingId}
                      onChange={e => setZoomMeetingId(e.target.value)}
                      placeholder="892 1420 8912"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      পাসকোড (Passcode)
                    </label>
                    <input
                      type="text"
                      value={zoomPassword}
                      onChange={e => setZoomPassword(e.target.value)}
                      placeholder="edutrack"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="কোর্সের রূপরেখা ও পাঠ্যসূচি..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20"
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : editingClass ? 'আপডেট করুন' : 'শিডিউল নিশ্চিত করুন'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: ZOOM DIRECT JOIN ================= */}
      <ZoomJoinModal
        isOpen={!!selectedZoomClass}
        targetClass={selectedZoomClass}
        onClose={() => setSelectedZoomClass(null)}
      />

      {/* ================= MODAL: STUDENT TIME & DATE CHANGE ================= */}
      <TimeChangeModal
        isOpen={showTimeRequestModal}
        classes={selectedRescheduleClass ? [selectedRescheduleClass] : classes}
        onClose={() => {
          setShowTimeRequestModal(false);
          setSelectedRescheduleClass(null);
        }}
        onSubmitted={() => {
          loadTimeRequests();
        }}
      />

    </div>
  );
}
