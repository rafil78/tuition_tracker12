import React from 'react';
import { 
  X, Printer, ExternalLink, GraduationCap, Calendar, 
  CheckCircle2, Clock, AlertCircle, Award, BookOpen, User, 
  FileText, ShieldCheck, Tag
} from 'lucide-react';

export default function ReportPrintModal({ isOpen, onClose, reportData, customRemarks }) {
  if (!isOpen || !reportData) return null;

  const { student, primaryClass, teacher, monthNameBn, monthNameEn, month, attendance, homework, performance, calendar } = reportData;

  const handleOpenAutoPrint = () => {
    const url = `/api/reports/monthly/html?studentId=${student?.id || ''}&classId=${primaryClass?.id || ''}&month=${month || ''}&autoPrint=true`;
    window.open(url, '_blank');
  };

  const handleOpenHtmlView = () => {
    const url = `/api/reports/monthly/html?studentId=${student?.id || ''}&classId=${primaryClass?.id || ''}&month=${month || ''}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    // Direct unclipped auto-print in new tab is standard for modal print
    handleOpenAutoPrint();
  };

  const finalRemarks = customRemarks || performance?.remarks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Top Control Header - hidden during print */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>মাসিক রিপোর্ট ও ফুল ক্যালেন্ডার (Monthly Report & Full Calendar)</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-300">
                  {monthNameBn}
                </span>
              </h2>
              <p className="text-xs text-slate-400">শিক্ষার্থী: {student?.name} • ব্যাচ: {primaryClass?.title || 'সকল কোর্স'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenHtmlView}
              title="নতুন ট্যাবে ফুল পেজ খুলুন"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ফুল ভিউ</span>
            </button>
            <button
              onClick={handleOpenAutoPrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>ফুল ক্যালেন্ডার PDF ডাউনলোড / প্রিন্ট</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div 
            id="printable-report-area" 
            className="w-full max-w-3xl bg-white p-6 sm:p-10 rounded-xl shadow-md border border-slate-200 text-slate-800 font-sans print:shadow-none print:border-none print:p-0"
          >
            {/* Academy Header */}
            <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-5 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">EduTrack Academy</h1>
                  <p className="text-xs font-semibold text-indigo-600">উচ্চতর পাঠদান ও পারফরম্যান্স ট্র্যাকিং সিস্টেম</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">অফিসিয়াল মাসিক হাজিরা ও হোমওয়ার্ক মূল্যায়ন রিপোর্ট</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-bold">
                  {monthNameBn} ({monthNameEn})
                </div>
                <p className="text-[10px] text-slate-400 mt-1">তৈরির তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
              </div>
            </div>

            {/* Quick Action Hint Banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-6 flex items-center justify-between text-xs text-indigo-900 print:hidden">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-600 text-white rounded-md font-bold">PDF</span>
                <span>ব্রাউজারের পরিষ্কার আনক্লিপড ফুল ক্যালেন্ডার PDF সংরক্ষণ করতে নিচের বাটনটি ব্যবহার করুন:</span>
              </div>
              <button
                onClick={handleOpenAutoPrint}
                className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
              >
                সরাসরি PDF প্রিন্ট খুলুন
              </button>
            </div>

            {/* Student & Course Info Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  শিক্ষার্থী প্রোফাইল (Student Info)
                </span>
                <p className="text-sm font-bold text-slate-900">{student?.name}</p>
                <p className="text-slate-600"><strong>শ্রেণী / বিভাগ:</strong> {student?.grade || student?.title || 'একাদশ শ্রেণী'}</p>
                <p className="text-slate-600"><strong>ইমেইল:</strong> {student?.email}</p>
                <p className="text-slate-600"><strong>অভিভাবক:</strong> {student?.parentName || 'N/A'} ({student?.parentPhone || ''})</p>
              </div>

              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  কোর্স ও টিউটর তথ্য (Tutor & Batch)
                </span>
                <p className="text-sm font-bold text-indigo-900">{primaryClass?.title || 'সকল কোর্স'}</p>
                <p className="text-slate-600"><strong>শিক্ষক:</strong> {teacher?.name}</p>
                <p className="text-slate-600"><strong>সময়সূচী:</strong> {primaryClass?.timeSlot || '05:00 PM - 06:30 PM'}</p>
                <p className="text-slate-600"><strong>প্রতি ক্লাস রেট:</strong> ৳{primaryClass?.perClassRate || 400} / ক্লাস</p>
              </div>
            </div>

            {/* SECTION 1: ATTENDANCE SUMMARY */}
            <div className="mb-6">
              <div className="flex items-center justify-between border-l-4 border-indigo-600 pl-3 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>১. মাসিক উপস্থিতি বিবরণী (Monthly Attendance)</span>
                </h3>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  উপস্থিতির হার: {attendance?.attendancePercentage}%
                </span>
              </div>

              {/* Attendance KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-slate-500 font-medium block">মোট ক্লাস সেশন</span>
                  <span className="text-lg font-black text-slate-800">{attendance?.totalSessions || 0}</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-emerald-700 font-medium block">উপস্থিত (Present)</span>
                  <span className="text-lg font-black text-emerald-700">{attendance?.presentCount || 0}</span>
                </div>
                <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-rose-700 font-medium block">ছাত্র ছুটি (৳০ কর্তন)</span>
                  <span className="text-lg font-black text-rose-700">{attendance?.studentAbsentCount || 0}</span>
                </div>
                <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-purple-700 font-medium block">শিক্ষক স্কিপ (কর্তন)</span>
                  <span className="text-lg font-black text-purple-700">{attendance?.teacherSkippedCount || 0}</span>
                </div>
              </div>

              {/* FULL 7-COLUMN MONTHLY CALENDAR GRID IN MODAL */}
              {calendar?.days && (
                <div className="mb-5 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>পুরো মাসের হাজিরা ক্যালেন্ডার (Full 7-Day Grid)</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> উপস্থিত</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> বিলম্ব</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> ছাত্র ছুটি (৳০)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> শিক্ষক স্কিপ</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span> ক্লাস দিন</span>
                    </div>
                  </div>

                  {/* 7 Columns: Saturday to Friday */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-white bg-slate-800 rounded-lg p-1 mb-1">
                    <div>শনি</div>
                    <div>রবি</div>
                    <div>সোম</div>
                    <div>মঙ্গল</div>
                    <div>বুধ</div>
                    <div>বৃহস্পতি</div>
                    <div>শুক্র</div>
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendar.days.map((cell, cIdx) => {
                      if (cell.isEmpty) {
                        return <div key={cIdx} className="min-h-[52px] bg-slate-50/60 rounded-lg border border-slate-100" />;
                      }

                      let bgBadge = 'bg-slate-50 text-slate-400 border-slate-100';
                      if (cell.status === 'present') bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      else if (cell.status === 'late') bgBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                      else if (cell.status === 'student_absent') bgBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                      else if (cell.status === 'teacher_skipped') bgBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                      else if (cell.status === 'scheduled') bgBadge = 'bg-sky-50 text-sky-700 border-sky-200';

                      return (
                        <div 
                          key={cIdx} 
                          className={`min-h-[52px] p-1 rounded-lg border flex flex-col justify-between text-left transition-colors ${
                            cell.isToday ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : 'bg-white'
                          } ${bgBadge}`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-black">
                            <span>{cell.dayNumber}</span>
                            {cell.isToday && <span className="text-[8px] bg-indigo-600 text-white px-1 rounded">আজ</span>}
                          </div>
                          
                          <div className="text-[9px] font-bold truncate leading-tight mt-0.5">
                            {cell.statusLabelBn}
                          </div>

                          {cell.deduction > 0 && (
                            <div className="text-[8px] font-black bg-purple-600 text-white px-1 rounded truncate mt-0.5 text-center">
                              -৳{cell.deduction}
                            </div>
                          )}

                          {cell.homeworkList && cell.homeworkList.length > 0 && (
                            <div className="text-[7.5px] font-semibold bg-amber-100 text-amber-800 px-1 rounded truncate mt-0.5" title={cell.homeworkList[0].title}>
                              📝 HW
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attendance Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ (Date)</th>
                      <th className="py-2.5 px-3">বার</th>
                      <th className="py-2.5 px-3">কোর্স</th>
                      <th className="py-2.5 px-3">হাজিরা অবস্থা</th>
                      <th className="py-2.5 px-3">মন্তব্য</th>
                      <th className="py-2.5 px-3 text-right">ফি কর্তন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attendance?.records && attendance.records.length > 0 ? (
                      attendance.records.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">{r.date}</td>
                          <td className="py-2 px-3 text-slate-500">{r.dayOfWeekBn}</td>
                          <td className="py-2 px-3">{r.className}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'late' ? 'bg-amber-100 text-amber-800' :
                              r.status === 'teacher_skipped' ? 'bg-purple-100 text-purple-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {r.statusLabelBn}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{r.notes || '-'}</td>
                          <td className="py-2 px-3 text-right">
                            {r.deductionAmount > 0 ? (
                              <span className="font-bold text-purple-700">-৳{r.deductionAmount}</span>
                            ) : (
                              <span className="text-slate-400">৳০</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-slate-400">এই মাসে কোনো ক্লাসের হাজিরা রেকর্ড পাওয়া যায়নি</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: HOMEWORK & ASSIGNMENTS EVALUATION */}
            <div className="mb-6">
              <div className="flex items-center justify-between border-l-4 border-indigo-600 pl-3 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>২. হোমওয়ার্ক ও অ্যাসাইনমেন্ট মূল্যায়ন (Homework & Tasks)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    জমা: {homework?.completionRate}%
                  </span>
                  {homework?.averageScore !== null && (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      গড় স্কোর: {homework?.averageScore}%
                    </span>
                  )}
                </div>
              </div>

              {/* Homework KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-slate-500 font-medium block">মোট হোমওয়ার্ক</span>
                  <span className="text-lg font-black text-slate-800">{homework?.totalAssigned || 0}</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-emerald-700 font-medium block">জমা ও মূল্যায়ন</span>
                  <span className="text-lg font-black text-emerald-700">{homework?.submittedCount || 0}</span>
                </div>
                <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-rose-700 font-medium block">বাকি / মিসিং</span>
                  <span className="text-lg font-black text-rose-700">{homework?.missingCount || 0}</span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-blue-700 font-medium block">গড় প্রাপ্তি</span>
                  <span className="text-lg font-black text-blue-700">
                    {homework?.averageScore !== null ? `${homework.averageScore}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Homework Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">অ্যাসাইনমেন্ট শিরোনাম</th>
                      <th className="py-2.5 px-3">জমার তারিখ</th>
                      <th className="py-2.5 px-3">পূর্ণমান</th>
                      <th className="py-2.5 px-3">অবস্থা</th>
                      <th className="py-2.5 px-3">প্রাপ্ত নম্বর</th>
                      <th className="py-2.5 px-3">শিক্ষকের মন্তব্য / ফিডব্যাক</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {homework?.items && homework.items.length > 0 ? (
                      homework.items.map((hw, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900 max-w-[180px] truncate" title={hw.title}>
                            {hw.title}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{hw.dueDate?.split('T')[0] || '-'}</td>
                          <td className="py-2 px-3 font-semibold">{hw.maxScore}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              hw.status === 'graded' ? 'bg-emerald-100 text-emerald-800' :
                              hw.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {hw.statusBn}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {hw.score !== null ? (
                              <span className="font-bold text-slate-900">{hw.score} / {hw.maxScore} ({hw.scorePercentage}%)</span>
                            ) : (
                              <span className="text-slate-400">অপেক্ষমাণ</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {hw.submission?.feedback || <span className="text-slate-400 italic">কোনো মন্তব্য নেই</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-slate-400">এই মাসে কোনো হোমওয়ার্ক রেকর্ড পাওয়া যায়নি</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: TEACHER EVALUATION & SUMMARY REMARKS */}
            <div className="bg-indigo-50/70 border-l-4 border-indigo-600 p-4 rounded-xl mb-8 text-xs text-indigo-950">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1.5 text-indigo-900 text-sm">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>শিক্ষকের মাসিক মূল্যায়ন ও গ্রেড (Teacher's Evaluation)</span>
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                  গ্রেড: {performance?.overallGrade} ({performance?.rating})
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed mt-1">
                {finalRemarks}
              </p>
              {attendance?.totalDeductedAmount > 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-200 text-purple-900 font-semibold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    শিক্ষক অনুপস্থিতি নীতি অনুযায়ী এই মাসে সর্বমোট ৳{attendance.totalDeductedAmount} টাকা পরবর্তী ইনভয়েসে স্বয়ংক্রিয় ক্রেডিট হিসেবে সমন্বয় করা হয়েছে।
                  </span>
                </div>
              )}
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-dashed border-slate-300 text-center text-xs">
              <div className="pt-8 border-t border-slate-400">
                <p className="font-bold text-slate-800">{student?.name}</p>
                <p className="text-[11px] text-slate-500">শিক্ষার্থীর স্বাক্ষর (Student)</p>
              </div>
              <div className="pt-8 border-t border-slate-400">
                <p className="font-bold text-slate-800">{student?.parentName || 'অভিভাবক'}</p>
                <p className="text-[11px] text-slate-500">অভিভাবকের স্বাক্ষর (Guardian)</p>
              </div>
              <div className="pt-8 border-t border-slate-400">
                <p className="font-bold text-indigo-900">{teacher?.name}</p>
                <p className="text-[11px] text-slate-500">শিক্ষক / টিউটরের স্বাক্ষর (Tutor)</p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>EduTrack Academy Academic Management System • Certified Report</span>
              <span>www.edutrack.com • support@edutrack.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
