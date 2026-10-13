import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Calendar, Printer, ExternalLink, Download, 
  CheckCircle2, Clock, AlertCircle, Award, BookOpen, 
  User, RefreshCw, ChevronRight, ShieldCheck, Tag, 
  Sparkles, Filter, Edit3, Check, Flame
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ReportPrintModal from './ReportPrintModal';
import { autoBackupRecord } from '../firestoreSync';

export default function MonthlyReportView({ classes, students, initialStudentId = null, initialClassId = null }) {
  const { currentUser, isTeacher, lang } = useAuth();

  // Filter States
  const [selectedStudentId, setSelectedStudentId] = useState(
    isTeacher ? (initialStudentId || students?.[0]?.id || 'student-1') : currentUser.id
  );
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [selectedMonth, setSelectedMonth] = useState('2026-10'); // Default to October 2026
  const [reportMode, setReportMode] = useState('monthly'); // 'monthly' | 'weekly'
  const [selectedWeek, setSelectedWeek] = useState('w2'); // 'w1' | 'w2' | 'w3' | 'w4' | 'all'
  
  // Data States
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'homework'
  
  // Custom teacher remarks
  const [customRemarks, setCustomRemarks] = useState('');
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);

  // Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Available month choices
  const availableMonths = [
    { value: '2026-10', labelEn: 'October 2026', labelBn: 'অক্টোবর ২০২৬ (বর্তমান মাস)' },
    { value: '2026-09', labelEn: 'September 2026', labelBn: 'সেপ্টেম্বর ২০২৬' },
    { value: '2026-08', labelEn: 'August 2026', labelBn: 'আগস্ট ২০২৬' },
    { value: '2026-07', labelEn: 'July 2026', labelBn: 'জুলাই ২০২৬' },
  ];

  const weeks = [
    { id: 'w1', label: '১ম সপ্তাহ (Week 1: ১ - ৭ তারিখ)', start: 1, end: 7 },
    { id: 'w2', label: '২য় সপ্তাহ (Week 2: ৮ - ১৪ তারিখ)', start: 8, end: 14 },
    { id: 'w3', label: '৩য় সপ্তাহ (Week 3: ১৫ - ২১ তারিখ)', start: 15, end: 21 },
    { id: 'w4', label: '৪র্থ সপ্তাহ (Week 4: ২২ - ২৮+ তারিখ)', start: 22, end: 31 },
  ];

  const fetchReport = async () => {
    const studentToQuery = isTeacher ? selectedStudentId : currentUser.id;
    if (!studentToQuery) return;

    try {
      setLoading(true);
      const data = await api.getMonthlyReport({
        studentId: studentToQuery,
        classId: selectedClassId || undefined,
        month: selectedMonth
      });
      setReportData(data);
      if (data?.performance?.remarks) {
        setCustomRemarks(data.performance.remarks);
      }
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedStudentId, selectedClassId, selectedMonth, currentUser]);

  const handleOpenHtmlView = () => {
    const studentToQuery = isTeacher ? selectedStudentId : currentUser.id;
    const url = `/api/reports/monthly/html?studentId=${studentToQuery}&classId=${selectedClassId}&month=${selectedMonth}`;
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    const studentToQuery = isTeacher ? selectedStudentId : currentUser.id;
    const url = `/api/reports/monthly/html?studentId=${studentToQuery}&classId=${selectedClassId}&month=${selectedMonth}&autoPrint=true`;
    window.open(url, '_blank');
  };

  const handleBackupToCloud = async () => {
    if (!activeReport) return;
    try {
      const reportPayload = {
        studentId: activeReport.student?.id || selectedStudentId,
        studentName: activeReport.student?.name,
        month: selectedMonth,
        classId: selectedClassId || 'all',
        attendancePercentage: activeReport.attendance?.attendancePercentage,
        homeworkCompletionRate: activeReport.homework?.completionRate,
        averageScore: activeReport.homework?.averageScore,
        totalDeductedAmount: activeReport.attendance?.totalDeductedAmount,
        rating: activeReport.performance?.rating,
        remarks: customRemarks || activeReport.performance?.remarks,
        syncedAt: new Date().toISOString()
      };
      await autoBackupRecord('reports', reportPayload);
      setCloudSynced(true);
      setTimeout(() => setCloudSynced(false), 3500);
    } catch (err) {
      console.warn('Backup report failed:', err);
    }
  };

  // Compute active report dataset (filtered by week if weekly mode is selected)
  const activeReport = React.useMemo(() => {
    if (!reportData) return null;
    if (reportMode === 'monthly') return reportData;

    const currentWeekObj = weeks.find(w => w.id === selectedWeek) || weeks[1];
    
    // Filter attendance by day of month
    const weeklyAttRecords = (reportData.attendance?.records || []).filter(r => {
      if (!r.date) return false;
      const dayNum = parseInt(r.date.split('-')[2], 10);
      return dayNum >= currentWeekObj.start && dayNum <= currentWeekObj.end;
    });

    const weeklySessions = weeklyAttRecords.length;
    const weeklyPresent = weeklyAttRecords.filter(r => r.status === 'present').length;
    const weeklyLate = weeklyAttRecords.filter(r => r.status === 'late').length;
    const weeklyStudentAbsent = weeklyAttRecords.filter(r => r.status === 'student_absent' || r.status === 'absent').length;
    const weeklyTeacherSkipped = weeklyAttRecords.filter(r => r.status === 'teacher_skipped').length;
    const weeklyAttRate = weeklySessions > 0 ? Math.round(((weeklyPresent + weeklyLate) / weeklySessions) * 100) : 100;
    const weeklyDeducted = weeklyAttRecords.reduce((sum, r) => sum + (r.deductionAmount || 0), 0);

    // Filter homework
    const weeklyHwItems = (reportData.homework?.items || []).filter(h => {
      const dueDay = h.dueDate ? parseInt(h.dueDate.split('T')[0]?.split('-')[2], 10) : 0;
      return dueDay >= currentWeekObj.start && dueDay <= currentWeekObj.end;
    });

    const hwItemsToUse = weeklyHwItems.length > 0 ? weeklyHwItems : reportData.homework?.items || [];
    const weeklyHwAssigned = hwItemsToUse.length;
    const weeklyHwSubmitted = hwItemsToUse.filter(h => h.submission).length;
    const weeklyHwGraded = hwItemsToUse.filter(h => h.status === 'graded').length;
    const weeklyHwMissing = weeklyHwAssigned - weeklyHwSubmitted;
    const weeklyCompletionRate = weeklyHwAssigned > 0 ? Math.round((weeklyHwSubmitted / weeklyHwAssigned) * 100) : 100;

    const scoredItems = hwItemsToUse.filter(h => h.scorePercentage !== null);
    const weeklyAvgScore = scoredItems.length > 0 
      ? Math.round(scoredItems.reduce((s, h) => s + h.scorePercentage, 0) / scoredItems.length) 
      : reportData.homework?.averageScore;

    return {
      ...reportData,
      monthNameBn: `${reportData.monthNameBn} (${currentWeekObj.label.split('(')[0]})`,
      monthNameEn: `${reportData.monthNameEn} (${currentWeekObj.id.toUpperCase()})`,
      attendance: {
        ...reportData.attendance,
        totalSessions: weeklySessions,
        presentCount: weeklyPresent,
        lateCount: weeklyLate,
        studentAbsentCount: weeklyStudentAbsent,
        teacherSkippedCount: weeklyTeacherSkipped,
        attendancePercentage: weeklyAttRate,
        records: weeklyAttRecords,
        totalDeductedAmount: weeklyDeducted
      },
      homework: {
        ...reportData.homework,
        totalAssigned: weeklyHwAssigned,
        submittedCount: weeklyHwSubmitted,
        gradedCount: weeklyHwGraded,
        missingCount: weeklyHwMissing,
        completionRate: weeklyCompletionRate,
        averageScore: weeklyAvgScore,
        items: hwItemsToUse
      },
      performance: {
        ...reportData.performance,
        rating: weeklyAttRate >= 80 ? 'সাপ্তাহিক পারফরম্যান্স চমৎকার' : 'সাপ্তাহিক পারফরম্যান্স সন্তোষজনক',
        remarks: `সাপ্তাহিক মূল্যায়ন (${currentWeekObj.label.split('(')[0]}): নিয়মিত ক্লাসে সক্রিয় অংশগ্রহণ বজায় রাখুন এবং নির্ধারিত হোমওয়ার্ক সম্পন্ন করুন।`
      }
    };
  }, [reportData, reportMode, selectedWeek]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'একাডেমিক অগ্রগতি' : 'Academic Progress'}</span>
              </div>

              {/* Mode Badges */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setReportMode('monthly')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    reportMode === 'monthly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'মাসিক রিপোর্ট' : 'Monthly'}
                </button>
                <button
                  onClick={() => setReportMode('weekly')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    reportMode === 'weekly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'সাপ্তাহিক রিপোর্ট' : 'Weekly'}
                </button>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {reportMode === 'weekly' 
                ? (lang === 'bn' ? 'সাপ্তাহিক হাজিরা ও পারফরম্যান্স' : 'Weekly Attendance & Performance')
                : (lang === 'bn' ? 'মাসিক হাজিরা ও রিপোর্ট' : 'Monthly Attendance & Report')}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              {lang === 'bn'
                ? 'উপস্থিতি ও হোমওয়ার্ক ট্র্যাকিং। যেকোনো সময় পিডিএফ ডাউনলোড বা প্রিন্ট করুন।'
                : 'Attendance & homework summary. Download or print PDF report.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleOpenHtmlView}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              title="View Full Page"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'bn' ? 'ফুল ভিউ' : 'Full View'}</span>
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              disabled={loading || !activeReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'bn' ? 'প্রিভিউ' : 'Preview'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={loading || !activeReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handleBackupToCloud}
              disabled={loading || !activeReport || cloudSynced}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                cloudSynced
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${cloudSynced ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{cloudSynced ? (lang === 'bn' ? '✓ ব্যাকআপ' : '✓ Synced') : (lang === 'bn' ? 'ফায়ারবেস ব্যাকআপ' : 'Cloud Backup')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>ফিল্টার নির্বাচন:</span>
          </div>

          {/* Teacher Student Picker */}
          {isTeacher && (
            <div className="min-w-[180px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                শিক্ষার্থী (Student)
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
              >
                {students?.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.grade || 'Student'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Class / Batch Picker */}
          <div className="min-w-[180px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              কোর্স / ব্যাচ (Tuition)
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
            >
              <option value="">সকল কোর্স ও ব্যাচ (All Batches)</option>
              {classes?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Month Picker */}
          <div className="min-w-[160px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              মাস নির্বাচন (Month)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>
                  {m.labelBn}
                </option>
              ))}
            </select>
          </div>

          {/* Weekly Selector (if weekly mode is active) */}
          {reportMode === 'weekly' && (
            <div className="min-w-[190px]">
              <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                নির্দিষ্ট সপ্তাহ (Select Week)
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full text-xs font-bold py-2 px-3 bg-indigo-50/70 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-950 font-sans"
              >
                {weeks.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">মাসিক রিপোর্ট প্রস্তুত হচ্ছে...</p>
        </div>
      ) : reportData ? (
        <>
          {/* Top Performance Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Overall Performance Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    সামগ্রিক মূল্যায়ন (Overall Grade)
                  </span>
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-indigo-600">
                    {activeReport.performance?.overallGrade || 'A'}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {activeReport.performance?.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {customRemarks || activeReport.performance?.remarks}
                </p>
              </div>

              {isTeacher && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {isEditingRemarks ? (
                    <div className="space-y-2">
                      <textarea
                        value={customRemarks}
                        onChange={(e) => setCustomRemarks(e.target.value)}
                        rows={2}
                        className="w-full text-xs p-2.5 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                        placeholder="শিক্ষকের কাস্টম মন্তব্য লিখুন যা PDF রিপোর্টে যাবে..."
                      />
                      <button
                        onClick={() => setIsEditingRemarks(false)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>সংরক্ষণ করুন</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingRemarks(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>শিক্ষকের মন্তব্য এডিট করুন</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Attendance Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    উপস্থিতির হার (Attendance Rate)
                  </span>
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-emerald-600">
                    {activeReport.attendance?.attendancePercentage}%
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    মোট {activeReport.attendance?.totalSessions} টি ক্লাসে
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <span className="text-xs font-bold text-emerald-700 block">
                      {activeReport.attendance?.presentCount}
                    </span>
                    <span className="text-[10px] text-emerald-600">উপস্থিত</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded-xl">
                    <span className="text-xs font-bold text-rose-700 block">
                      {activeReport.attendance?.studentAbsentCount}
                    </span>
                    <span className="text-[10px] text-rose-600">অনুপস্থিত (৳০)</span>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <span className="text-xs font-bold text-purple-700 block">
                      {activeReport.attendance?.teacherSkippedCount}
                    </span>
                    <span className="text-[10px] text-purple-600">শিক্ষক মিস</span>
                  </div>
                </div>
              </div>

              {activeReport.attendance?.totalDeductedAmount > 0 && (
                <div className="mt-3 p-2 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-[11px] text-purple-900 font-semibold">
                  <span>শিক্ষক স্কিপ কর্তন:</span>
                  <span className="font-bold text-purple-700">-৳{activeReport.attendance?.totalDeductedAmount} ছাড়</span>
                </div>
              )}
            </div>

            {/* 3. Homework Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    হোমওয়ার্ক পারফরম্যান্স (HW Rate)
                  </span>
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-blue-600">
                    {activeReport.homework?.completionRate}%
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    জমা সম্পন্ন ({activeReport.homework?.submittedCount}/{activeReport.homework?.totalAssigned})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <span className="text-xs font-bold text-blue-700 block">
                      {activeReport.homework?.gradedCount}
                    </span>
                    <span className="text-[10px] text-blue-600">মূল্যায়িত</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded-xl">
                    <span className="text-xs font-bold text-rose-700 block">
                      {activeReport.homework?.missingCount}
                    </span>
                    <span className="text-[10px] text-rose-600">বাকি</span>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <span className="text-xs font-bold text-indigo-700 block">
                      {activeReport.homework?.averageScore !== null ? `${activeReport.homework?.averageScore}%` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-indigo-600">গড় স্কোর</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                <span>সর্বশেষ আপডেট: {activeReport.monthNameBn}</span>
                <span className="text-emerald-600 font-bold">সক্রিয় রেকর্ড</span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Attendance Log vs Homework Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'attendance'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>মাসিক হাজিরা বিবরণী ({activeReport.attendance?.records?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('homework')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'homework'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>হোমওয়ার্ক ও অ্যাসাইনমেন্ট ({activeReport.homework?.items?.length || 0})</span>
                </button>
              </div>

              <button
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>পিডিএফ প্রিন্ট প্রিভিউ দেখুন</span>
              </button>
            </div>

            {/* TAB 1: ATTENDANCE LOG */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                {/* Visual 7-Column Monthly Calendar Grid */}
                {reportData?.calendar?.days && (
                  <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800 text-sm">
                          পুরো মাসের ভিজ্যুয়াল হাজিরা চার্ট (Full Monthly Attendance Calendar)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-semibold">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> উপস্থিত</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> বিলম্ব</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> ছাত্র ছুটি (৳০ কর্তন)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> শিক্ষক স্কিপ (-৳ কর্তন)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> নির্ধারিত ক্লাস</span>
                      </div>
                    </div>

                    {/* 7 Columns: Saturday to Friday */}
                    <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-xs text-white bg-slate-900 rounded-xl p-2 mb-2">
                      <div>শনিবার (Sat)</div>
                      <div>রবিবার (Sun)</div>
                      <div>সোমবার (Mon)</div>
                      <div>মঙ্গলবার (Tue)</div>
                      <div>বুধবার (Wed)</div>
                      <div>বৃহস্পতিবার (Thu)</div>
                      <div>শুক্রবার (Fri)</div>
                    </div>

                    {/* Day Cells Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {reportData.calendar.days.map((cell, cIdx) => {
                        if (cell.isEmpty) {
                          return <div key={cIdx} className="min-h-[64px] bg-white/40 rounded-xl border border-slate-100" />;
                        }

                        let bgBadge = 'bg-white text-slate-400 border-slate-200';
                        if (cell.status === 'present') bgBadge = 'bg-emerald-50/90 text-emerald-800 border-emerald-300';
                        else if (cell.status === 'late') bgBadge = 'bg-amber-50/90 text-amber-800 border-amber-300';
                        else if (cell.status === 'student_absent') bgBadge = 'bg-rose-50/90 text-rose-800 border-rose-300';
                        else if (cell.status === 'teacher_skipped') bgBadge = 'bg-purple-50/90 text-purple-800 border-purple-300';
                        else if (cell.status === 'scheduled') bgBadge = 'bg-sky-50/90 text-sky-800 border-sky-300';

                        return (
                          <div 
                            key={cIdx} 
                            className={`min-h-[64px] p-2 rounded-xl border flex flex-col justify-between text-left transition-all hover:shadow-sm ${
                              cell.isToday ? 'ring-2 ring-indigo-500 shadow-sm' : ''
                            } ${bgBadge}`}
                          >
                            <div className="flex items-center justify-between text-xs font-black">
                              <span>{cell.dayNumber}</span>
                              {cell.isToday && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">আজ</span>}
                            </div>
                            
                            <div className="text-[10px] font-bold truncate leading-tight mt-1">
                              {cell.statusLabelBn}
                            </div>

                            {cell.deduction > 0 && (
                              <div className="text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded truncate mt-1 text-center">
                                -৳{cell.deduction} কর্তন
                              </div>
                            )}

                            {cell.homeworkList && cell.homeworkList.length > 0 && (
                              <div className="text-[8.5px] font-semibold bg-amber-100 text-amber-900 px-1 py-0.5 rounded truncate mt-0.5" title={cell.homeworkList[0].title}>
                                📝 HW: {cell.homeworkList[0].title}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">তারিখ (Date)</th>
                        <th className="py-3 px-4">বার (Day)</th>
                        <th className="py-3 px-4">কোর্স / ব্যাচ</th>
                        <th className="py-3 px-4">হাজিরা অবস্থা</th>
                        <th className="py-3 px-4">মন্তব্য / নোট</th>
                        <th className="py-3 px-4 text-right">আর্থিক সমন্বয়</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeReport.attendance?.records && activeReport.attendance.records.length > 0 ? (
                        activeReport.attendance.records.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{r.date}</td>
                            <td className="py-3 px-4 text-slate-600">{r.dayOfWeekBn}</td>
                            <td className="py-3 px-4 font-medium">{r.className}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                r.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                                r.status === 'late' ? 'bg-amber-100 text-amber-800' :
                                r.status === 'teacher_skipped' ? 'bg-purple-100 text-purple-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {r.status === 'present' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                {r.status === 'teacher_skipped' && <ShieldCheck className="w-3 h-3 text-purple-600" />}
                                <span>{r.statusLabelBn}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{r.notes || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              {r.deductionAmount > 0 ? (
                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                                  -৳{r.deductionAmount} (শিক্ষক স্কিপ)
                                </span>
                              ) : (
                                <span className="text-slate-400">৳০ কর্তন</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            নির্বাচিত মাসে কোনো হাজিরা রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: HOMEWORK LOG */}
            {activeTab === 'homework' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">অ্যাসাইনমেন্ট শিরোনাম</th>
                        <th className="py-3 px-4">কোর্স</th>
                        <th className="py-3 px-4">জমার শেষ তারিখ</th>
                        <th className="py-3 px-4">অবস্থা (Status)</th>
                        <th className="py-3 px-4">প্রাপ্ত নম্বর / পূর্ণমান</th>
                        <th className="py-3 px-4">শিক্ষকের মূল্যায়ন ও ফিডব্যাক</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeReport.homework?.items && activeReport.homework.items.length > 0 ? (
                        activeReport.homework.items.map((hw, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900">{hw.title}</p>
                              {hw.description && (
                                <p className="text-[11px] text-slate-500 truncate max-w-xs">{hw.description}</p>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium">{hw.className}</td>
                            <td className="py-3 px-4 text-slate-600">{hw.dueDate?.split('T')[0] || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                hw.status === 'graded' ? 'bg-emerald-100 text-emerald-800' :
                                hw.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {hw.statusBn}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {hw.score !== null ? (
                                <span>{hw.score} / {hw.maxScore} <span className="text-emerald-600 font-semibold">({hw.scorePercentage}%)</span></span>
                              ) : (
                                <span className="text-slate-400 font-normal">মূল্যায়ন অপেক্ষমাণ</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {hw.submission?.feedback ? (
                                <span className="italic">"{hw.submission.feedback}"</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            নির্বাচিত মাসে কোনো হোমওয়ার্ক বা অ্যাসাইনমেন্ট পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-sm font-bold text-slate-500">কোনো তথ্য লোড করা সম্ভব হয়নি।</p>
        </div>
      )}

      {/* Printable PDF Modal */}
      <ReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportData={activeReport}
        customRemarks={customRemarks}
      />
    </div>
  );
}
