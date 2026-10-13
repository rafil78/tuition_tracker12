import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Award, BookOpen, MapPin, Video, 
  ChevronRight, Plus, CheckCircle2, AlertCircle, FileText, 
  Search, Filter, ExternalLink, Printer, Timer, Sparkles, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ZoomJoinModal from './ZoomJoinModal';
import HomeTuitionLocationModal from './HomeTuitionLocationModal';
import { autoBackupRecord } from '../firestoreSync';

export default function RoutineExamView({ classes }) {
  const { currentUser, isTeacher, isParent, formatMoney } = useAuth();
  const [subTab, setSubTab] = useState('routine'); // 'routine' | 'exams'
  const [examSchedules, setExamSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState('all');
  const [examTypeFilter, setExamTypeFilter] = useState('all');

  // Modals
  const [selectedZoomClass, setSelectedZoomClass] = useState(null);
  const [selectedTrackingClass, setSelectedTrackingClass] = useState(null);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);

  // New Exam Form
  const [newClassId, setNewClassId] = useState(classes[0]?.id || 'cls-1');
  const [newTitle, setNewTitle] = useState('');
  const [newExamType, setNewExamType] = useState('Model Test');
  const [newExamTypeBn, setNewExamTypeBn] = useState('মডেল টেস্ট');
  const [newDate, setNewDate] = useState('2026-10-24');
  const [newTimeSlot, setNewTimeSlot] = useState('04:00 PM - 05:30 PM');
  const [newDuration, setNewDuration] = useState('90');
  const [newTotalMarks, setNewTotalMarks] = useState('100');
  const [newPassMarks, setNewPassMarks] = useState('40');
  const [newSyllabus, setNewSyllabus] = useState('');
  const [newMarksDistribution, setNewMarksDistribution] = useState('CQ: ৫০, MCQ: ২৫, ভাইভা: ২৫');
  const [newVenue, setNewVenue] = useState('অনলাইন লাইভ পোর্টাল');
  const [savingExam, setSavingExam] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await api.getExamSchedules();
      setExamSchedules(data || []);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setSavingExam(true);
    try {
      const examPayload = {
        classId: newClassId,
        title: newTitle,
        examType: newExamType,
        examTypeBn: newExamTypeBn,
        date: newDate,
        timeSlot: newTimeSlot,
        durationMinutes: newDuration,
        totalMarks: newTotalMarks,
        passMarks: newPassMarks,
        syllabus: newSyllabus,
        marksDistribution: newMarksDistribution,
        venue: newVenue
      };
      const res = await api.createExamSchedule(examPayload);
      if (res) {
        autoBackupRecord('routines', { ...examPayload, id: res.id || `exam_${Date.now()}` });
      }
      setShowCreateExamModal(false);
      setNewTitle('');
      setNewSyllabus('');
      await loadExams();
      alert('✅ নতুন পরীক্ষার সময়সূচী সফলভাবে সংরক্ষিত হয়েছে (Firebase-এ সিঙ্কড)!');
    } catch (err) {
      console.error('Failed to create exam:', err);
    } finally {
      setSavingExam(false);
    }
  };

  // Days of Week definition for routine
  const daysOfWeek = [
    { en: 'Saturday', bn: 'শনিবার' },
    { en: 'Sunday', bn: 'রবিবার' },
    { en: 'Monday', bn: 'সোমবার' },
    { en: 'Tuesday', bn: 'মঙ্গলবার' },
    { en: 'Wednesday', bn: 'বুধবার' },
    { en: 'Thursday', bn: 'বৃহস্পতিবার' },
    { en: 'Friday', bn: 'শুক্রবার' }
  ];

  // Helper to get classes on a day
  const getClassesForDay = (dayEn) => {
    return classes.filter(c => {
      const matchDay = (c.scheduleDays || []).includes(dayEn);
      const matchMode = selectedModeFilter === 'all' || (c.mode || 'online') === selectedModeFilter;
      return matchDay && matchMode;
    });
  };

  // Find next upcoming exam for countdown
  const upcomingExams = examSchedules.filter(e => e.status !== 'completed');
  const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>সাপ্তাহিক রুটিন ও পরীক্ষার ক্যালেন্ডার (Routine & Exams)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            বিস্তারিত ক্লাস রুটিন ও পরীক্ষা সূচী
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            সাপ্তাহিক নিয়মিত ক্লাস সময়সূচী, হোম টিউশন ও অনলাইন ব্যাচ শিডিউল এবং আসন্ন মডেল টেস্ট ও টার্ম পরীক্ষার পূর্ণাঙ্গ প্রস্তুতি ট্র্যাক করুন।
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
          <button
            onClick={() => setSubTab('routine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'routine'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>সাপ্তাহিক রুটিন (Timetable)</span>
          </button>

          <button
            onClick={() => setSubTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'exams'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>পরীক্ষার সময়সূচী (Exams & Tests)</span>
          </button>
        </div>
      </div>

      {/* ================= SUB-TAB 1: WEEKLY ROUTINE TIMETABLE ================= */}
      {subTab === 'routine' && (
        <div className="space-y-6">
          
          {/* Routine Mode Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">ক্লাস মোড ফিল্টার:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'all', label: 'সকল মোড' },
                  { id: 'home', label: '🏠 বাসায় হোম টিউশন' },
                  { id: 'online', label: '💻 অনলাইন জুম' },
                  { id: 'batch', label: '🏫 অফলাইন সেন্টার' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedModeFilter(mode.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedModeFilter === mode.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              সর্বমোট সক্রিয় ব্যাচ: <span className="font-bold text-slate-800">{classes.length}টি</span>
            </div>
          </div>

          {/* 7-Day Timetable Grid */}
          <div className="space-y-4">
            {daysOfWeek.map(dayObj => {
              const dayClasses = getClassesForDay(dayObj.en);

              return (
                <div 
                  key={dayObj.en}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-indigo-200 transition-all space-y-3"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs">
                        {dayObj.bn.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          {dayObj.bn} ({dayObj.en})
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {dayClasses.length > 0 ? `${dayClasses.length}টি নির্ধারিত ক্লাস` : 'কোনো নির্ধারিত ক্লাস নেই'}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      dayClasses.length > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {dayClasses.length > 0 ? 'ক্লাস দিন' : 'ছুটি / অফ ডে'}
                    </span>
                  </div>

                  {/* Class slots on this day */}
                  {dayClasses.length === 0 ? (
                    <div className="py-2 text-xs text-slate-400 italic">
                      এই দিনে কোনো ক্লাসের শিডিউল নেই।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dayClasses.map(cls => {
                        const isHome = cls.mode === 'home';
                        const isOnline = cls.mode === 'online';

                        return (
                          <div
                            key={cls.id}
                            className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                              isHome 
                                ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300' 
                                : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isHome 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {isHome ? '🏠 বাসায় হোম টিউশন' : isOnline ? '💻 অনলাইন লাইভ (Zoom)' : '🏫 অফলাইন ব্যাচ'}
                                </span>
                                <span className="text-xs font-black text-slate-700 flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {cls.timeSlot}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                                {cls.title}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                বিষয়: {cls.subject} • গ্রেড: {cls.gradeLevel}
                              </p>
                              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span className="truncate">{cls.room || cls.studentAddress || 'অনলাইন ক্লাসরুম'}</span>
                              </p>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500">
                                ৳{cls.perClassRate || 450} / ক্লাস
                              </span>

                              {isHome ? (
                                <button
                                  onClick={() => setSelectedTrackingClass(cls)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>লাইভ ট্র্যাকার</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedZoomClass(cls)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>জুম ক্লাসে যোগ দিন</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: EXAM SCHEDULES & TESTS ================= */}
      {subTab === 'exams' && (
        <div className="space-y-6">
          
          {/* Next Exam Live Countdown Card */}
          {nextExam && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  <Timer className="w-3 h-3 animate-spin" />
                  <span>আসন্ন পরবর্তী পরীক্ষা (Next Exam Countdown)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  {nextExam.title}
                </h3>
                <p className="text-xs text-amber-100 max-w-xl">
                  তারিখ: <span className="font-bold text-white">{nextExam.date}</span> ({nextExam.timeSlot}) • পূর্ণমান: {nextExam.totalMarks} • পাস নম্বর: {nextExam.passMarks}
                </p>
                <p className="text-[11px] text-amber-50 bg-white/10 px-3 py-1 rounded-xl inline-block mt-1">
                  সিলেবাস: {nextExam.syllabus}
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center shrink-0 min-w-[160px]">
                <span className="text-[10px] font-bold uppercase text-amber-100 block">বাকি সময়</span>
                <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
                  ⏳ ৪ দিন বাকি
                </span>
                <span className="text-[10px] text-amber-100 block mt-1">
                  {nextExam.venue}
                </span>
              </div>
            </div>
          )}

          {/* Controls Bar & Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">পরীক্ষার ধরণ:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'all', label: 'সকল পরীক্ষা' },
                  { id: 'Model Test', label: 'মডেল টেস্ট' },
                  { id: 'Term Assessment', label: 'টার্ম পরীক্ষা' },
                  { id: 'Weekly Quiz', label: 'কুইজ' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setExamTypeFilter(type.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      examTypeFilter === type.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher add exam button */}
            {isTeacher && (
              <button
                onClick={() => setShowCreateExamModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন পরীক্ষার সময়সূচী যোগ করুন</span>
              </button>
            )}
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examSchedules
              .filter(e => examTypeFilter === 'all' || e.examType === examTypeFilter)
              .map(exam => {
                const cls = classes.find(c => c.id === exam.classId);
                const isCompleted = exam.status === 'completed';

                return (
                  <div
                    key={exam.id}
                    className={`bg-white rounded-3xl p-6 border transition-all space-y-4 flex flex-col justify-between ${
                      isCompleted 
                        ? 'border-slate-200 opacity-80' 
                        : 'border-slate-200 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {exam.examTypeBn || exam.examType}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {isCompleted ? 'সম্পন্ন (Completed)' : 'আসন্ন (Upcoming)'}
                        </span>
                      </div>

                      {/* Title & Batch */}
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                          {exam.title}
                        </h4>
                        <p className="text-xs text-indigo-600 font-bold mt-0.5">
                          কোর্স: {cls?.title || 'উচ্চতর গণিত ও ক্যালকুলাস'}
                        </p>
                      </div>

                      {/* Key details */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">তারিখ ও সময়:</span>
                          <span className="font-bold text-slate-800">{exam.date}</span>
                          <span className="block text-[11px] text-slate-500">{exam.timeSlot}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">পূর্ণমান ও সময়:</span>
                          <span className="font-bold text-slate-800">{exam.totalMarks} নম্বর</span>
                          <span className="block text-[11px] text-slate-500">সময়: {exam.durationMinutes} মিনিট</span>
                        </div>
                      </div>

                      {/* Marks distribution */}
                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">নম্বর বণ্টন: </span>
                        <span>{exam.marksDistribution}</span>
                      </div>

                      {/* Syllabus Box */}
                      <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950">
                        <span className="font-bold block mb-0.5">নির্ধারিত সিলেবাস:</span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {exam.syllabus}
                        </p>
                      </div>

                      {/* Venue / Link */}
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>স্থান: <strong>{exam.venue}</strong></span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        পাস মার্ক: {exam.passMarks}
                      </span>

                      <div className="flex gap-2">
                        {exam.zoomLink && !isCompleted && (
                          <a
                            href={exam.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>অনলাইন টেস্ট পোর্টাল</span>
                          </a>
                        )}

                        <button
                          onClick={() => window.print()}
                          title="পরীক্ষার প্রবেশপত্র ও সিলেবাস প্রিন্ট করুন"
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>নতুন পরীক্ষার সময়সূচী তৈরি করুন</span>
              </h3>
              <button
                onClick={() => setShowCreateExamModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">কোর্স নির্বাচন করুন</label>
                <select
                  value={newClassId}
                  onChange={e => setNewClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পরীক্ষার নাম (শিরোনাম)</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="যেমন: ক্যালকুলাস স্পেশাল মডেল টেস্ট - পর্ব ২"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পরীক্ষার ধরণ</label>
                  <select
                    value={newExamType}
                    onChange={e => {
                      setNewExamType(e.target.value);
                      setNewExamTypeBn(e.target.value === 'Model Test' ? 'মডেল টেস্ট' : e.target.value === 'Weekly Quiz' ? 'সাপ্তাহিক কুইজ' : 'টার্ম পরীক্ষা');
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  >
                    <option value="Model Test">মডেল টেস্ট (Model Test)</option>
                    <option value="Term Assessment">টার্ম অ্যাসেসমেন্ট</option>
                    <option value="Weekly Quiz">সাপ্তাহিক কুইজ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সময় স্লট</label>
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={e => setNewTimeSlot(e.target.value)}
                    placeholder="04:00 PM - 05:30 PM"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পূর্ণমান (নম্বর)</label>
                  <input
                    type="number"
                    value={newTotalMarks}
                    onChange={e => setNewTotalMarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পাস নম্বর</label>
                  <input
                    type="number"
                    value={newPassMarks}
                    onChange={e => setNewPassMarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">সিলেবাস বিস্তারিত</label>
                <textarea
                  rows="2"
                  value={newSyllabus}
                  onChange={e => setNewSyllabus(e.target.value)}
                  placeholder="অধ্যায়সমূহ ও বিশেষ গাণিতিক সমস্যা..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">নম্বর বণ্টন</label>
                  <input
                    type="text"
                    value={newMarksDistribution}
                    onChange={e => setNewMarksDistribution(e.target.value)}
                    placeholder="CQ: ৫০, MCQ: ২৫, ভাইভা: ২৫"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">স্থান / লিংক</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={e => setNewVenue(e.target.value)}
                    placeholder="অনলাইন পোর্টাল অথবা বাসায় পরীক্ষা"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingExam}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {savingExam ? 'সংরক্ষণ হচ্ছে...' : 'পরীক্ষা তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zoom Join Modal */}
      {selectedZoomClass && (
        <ZoomJoinModal
          isOpen={!!selectedZoomClass}
          onClose={() => setSelectedZoomClass(null)}
          classItem={selectedZoomClass}
        />
      )}

      {/* Home Tuition Location Modal */}
      {selectedTrackingClass && (
        <HomeTuitionLocationModal
          isOpen={!!selectedTrackingClass}
          onClose={() => setSelectedTrackingClass(null)}
          selectedClass={selectedTrackingClass}
        />
      )}

    </div>
  );
}
