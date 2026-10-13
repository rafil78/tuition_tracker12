import React, { useState, useEffect } from 'react';
import { 
  Check, X, Clock, HelpCircle, Calendar, Save, CheckCircle2, 
  Users, BookOpen, AlertCircle, RefreshCw, ShieldCheck, DollarSign,
  AlertTriangle, ArrowDownRight, Tag, FileSpreadsheet
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { autoBackupRecord } from '../firestoreSync';

export default function AttendanceTracker({ classes, onOpenReport }) {
  const { isTeacher, formatMoney, currentUser, lang } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState(classes?.[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeClass = classes.find(c => c.id === selectedClassId) || classes?.[0];
  const perClassRate = activeClass?.perClassRate || Math.round((activeClass?.monthlyFee || 3200) / 8) || 500;

  // Load students and deductions
  const loadAttendanceData = () => {
    if (!selectedClassId) return;
    setLoading(true);
    setSavedSuccess(false);

    Promise.all([
      api.getEnrollments({ classId: selectedClassId }),
      api.getAttendance({ classId: selectedClassId, date: selectedDate }),
      api.getDeductions({ classId: selectedClassId })
    ])
      .then(([enrs, attList, dedList]) => {
        setEnrollments(enrs);
        setDeductions(dedList || []);

        const attMap = {};
        enrs.forEach(enr => {
          const match = attList.find(a => a.studentId === enr.studentId);
          attMap[enr.studentId] = {
            status: match ? match.status : 'present',
            notes: match ? match.notes : ''
          };
        });
        setAttendanceRecords(attMap);
      })
      .catch(err => console.error('Error loading attendance & deductions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedClassId, selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    enrollments.forEach(enr => {
      updated[enr.studentId] = {
        ...attendanceRecords[enr.studentId],
        status
      };
    });
    setAttendanceRecords(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const recordsToSave = enrollments.map(enr => ({
        classId: selectedClassId,
        studentId: enr.studentId,
        date: selectedDate,
        status: attendanceRecords[enr.studentId]?.status || 'present',
        notes: attendanceRecords[enr.studentId]?.notes || ''
      }));

      await api.saveAttendance(recordsToSave);
      
      // Auto-backup to Cloud Firestore in background
      for (const rec of recordsToSave) {
        autoBackupRecord('attendance', rec);
      }

      setSavedSuccess(true);
      loadAttendanceData();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceRecords).filter(r => r.status === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter(r => r.status === 'student_absent' || r.status === 'absent').length;
  const teacherSkipCount = Object.values(attendanceRecords).filter(r => r.status === 'teacher_skipped').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header and Class Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'bn' ? 'উপস্থিতি ও ফি কর্তন' : 'Attendance & Deductions'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'শিক্ষক ক্লাস বাদ দিলে স্বয়ংক্রিয় ফি কর্তন প্রযোজ্য হয়'
              : 'Auto-deduction applies if teacher cancels session'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white shadow-sm outline-none focus:border-slate-400"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.title} ({cls.type === 'individual' ? (lang === 'bn' ? 'একক' : '1-on-1') : (lang === 'bn' ? 'ব্যাচ' : 'Batch')})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs font-mono font-semibold border border-slate-200 rounded-xl bg-white shadow-sm outline-none focus:border-slate-400"
          />

          {onOpenReport && (
            <button
              onClick={() => onOpenReport(null, selectedClassId)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? 'রিপোর্ট ও PDF' : 'Reports & PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rules Notice Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
            ৳
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {lang === 'bn' ? 'কর্তন নীতিমালা' : 'Deduction Policy'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {lang === 'bn'
                ? `শিক্ষক ক্লাস বাদ দিলে প্রতি শিক্ষার্থীর ইনভয়েস থেকে ${formatMoney(perClassRate)} টাকা স্বয়ংক্রিয় কর্তন হবে। ছাত্র না পড়লে কোনো ফি কাটা যাবে না।`
                : `If teacher skips a session, ${formatMoney(perClassRate)} is deducted per student. No deduction for student absence.`}
            </p>
          </div>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="px-3 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
            >
              {lang === 'bn' ? 'সবাই উপস্থিত' : 'Mark All Present'}
            </button>
            <button
              onClick={() => handleMarkAll('teacher_skipped')}
              className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>{lang === 'bn' ? 'শিক্ষকের ছুটি' : 'Teacher Skipped'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Session Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">উপস্থিত শিক্ষার্থী</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
            <span className="text-[10px] text-slate-400">ক্লাসে অংশ নিয়েছে</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ছাত্র অনুপস্থিত (না পড়া)</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{absentCount}</p>
            <span className="text-[10px] text-emerald-600 font-bold">কোনো কর্তন নেই (৳০)</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">শিক্ষক বাদ দিয়েছেন</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{teacherSkipCount}</p>
            <span className="text-[10px] text-rose-600 font-bold">স্বয়ংক্রিয় কর্তন প্রযোজ্য</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-800 text-base">
              {activeClass?.title || 'ক্লাস উপস্থিতি শিট'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              তারিখ: <strong className="text-slate-700 font-mono">{selectedDate}</strong> • সময়: {activeClass?.timeSlot} • ক্লাস প্রতি রেট: <span className="text-emerald-700 font-mono font-bold">{formatMoney(perClassRate)}</span>
            </p>
          </div>

          {isTeacher && (
            <div className="flex items-center gap-2">
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> সংরক্ষিত ও কর্তন হিসাবকৃত!
                </span>
              )}
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> উপস্থিতি সংরক্ষণ করুন
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">উপস্থিতি তথ্য লোড হচ্ছে...</div>
        ) : enrollments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">এই ব্যাচে বর্তমানে কোনো শিক্ষার্থী যুক্ত নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6">শিক্ষার্থী (Student)</th>
                  <th className="py-3.5 px-6">শ্রেণী / যোগাযোগ</th>
                  <th className="py-3.5 px-6 text-center">উপস্থিতি স্থিতি ও নীতি (Policy)</th>
                  <th className="py-3.5 px-6">মন্তব্য / কারণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map(enr => {
                  const student = enr.student;
                  const currentStatus = attendanceRecords[enr.studentId]?.status || 'present';
                  const currentNotes = attendanceRecords[enr.studentId]?.notes || '';

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={student?.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{student?.name}</p>
                            <p className="text-xs text-slate-400">{student?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-slate-700 block">{student?.grade || 'এইচএসসি / একাদশ'}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{student?.phone || '০১৭xxxxxxxx'}</span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            {[
                              { key: 'present', label: 'উপস্থিত', badge: 'নিয়মিত', color: 'emerald' },
                              { key: 'late', label: 'দেরি', badge: 'দেরি', color: 'amber' },
                              { key: 'student_absent', label: 'ছাত্র পড়েনি', badge: '৳০ কর্তন', color: 'blue' },
                              { key: 'teacher_skipped', label: 'শিক্ষক বাদ দিয়েছেন', badge: `-${formatMoney(perClassRate)} কর্তন`, color: 'rose' }
                            ].map(s => {
                              const isCurrent = currentStatus === s.key;
                              return (
                                <button
                                  key={s.key}
                                  type="button"
                                  disabled={!isTeacher}
                                  onClick={() => handleStatusChange(enr.studentId, s.key)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                                    isCurrent
                                      ? s.key === 'present'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : s.key === 'late'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : s.key === 'student_absent'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-rose-600 text-white border-rose-600 shadow-sm animate-pulse'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{s.label}</span>
                                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isCurrent ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {s.badge}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {currentStatus === 'student_absent' && (
                            <span className="text-[10px] text-blue-600 font-bold">
                              ✓ ছাত্র না পড়লে কোনো টাকা কাটা যাবে না (No deduction)
                            </span>
                          )}
                          {currentStatus === 'teacher_skipped' && (
                            <span className="text-[10px] text-rose-600 font-bold">
                              ⚠️ শিক্ষক বাদ দিয়েছেন: শিক্ষার্থীর ইনভয়েস থেকে {formatMoney(perClassRate)} টাকা কর্তন হবে!
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {isTeacher ? (
                          <input
                            type="text"
                            value={currentNotes}
                            onChange={e => handleNotesChange(enr.studentId, e.target.value)}
                            placeholder="কারণ বা নোট লিখুন..."
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                          />
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            {currentNotes || 'কোনো মন্তব্য নেই'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deduction Audit History Log */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">
                শিক্ষক ক্লাস বাদ দেওয়ায় ফি কর্তন রেকর্ড (Teacher Skip Deductions Log)
              </h3>
              <p className="text-[11px] text-slate-400">
                শিক্ষক ক্লাস মিস করলে স্বয়ংক্রিয়ভাবে শিক্ষার্থীকে দেওয়া ক্রেডিট ও রিফান্ডের হিসাব
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
            মোট কর্তন: {deductions.length} টি সেশন
          </span>
        </div>

        {deductions.length === 0 ? (
          <div className="p-6 bg-slate-50/70 border border-slate-100 rounded-2xl text-center text-xs text-slate-500">
            এখনো শিক্ষক কোনো ক্লাস বাদ দেননি। কোনো ফি কর্তন রেকর্ড নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">শিক্ষার্থী</th>
                  <th className="py-2.5 px-3">কোর্স</th>
                  <th className="py-2.5 px-3">কর্তনকৃত অর্থ (Deducted)</th>
                  <th className="py-2.5 px-3">কারণ ও স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deductions.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{d.date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">{d.student?.name || 'শিক্ষার্থী'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.class?.title || 'কোর্স'}</td>
                    <td className="py-2.5 px-3 font-mono font-black text-rose-600">-{formatMoney(d.amount)}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> ইনভয়েসে স্বয়ংক্রিয় ছাড় সমন্বয়কৃত
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
