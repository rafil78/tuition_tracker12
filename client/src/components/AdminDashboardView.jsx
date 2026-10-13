import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, UserPlus, BookOpen, CreditCard, CalendarCheck, 
  Trash2, Edit, CheckCircle2, Clock, AlertCircle, Award, 
  Plus, Search, RefreshCw, Sparkles, Filter, ExternalLink,
  Phone, Mail, User, GraduationCap, DollarSign, Layers, Check, X, Flame
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import FirebaseSetupModal from './FirebaseSetupModal';
import { isFirebaseConfigured } from '../firebase';
import { autoBackupRecord, autoDeleteRecord } from '../firestoreSync';

export default function AdminDashboardView() {
  const { formatMoney, triggerRefresh, lang } = useAuth();

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'teachers' | 'students' | 'classes' | 'finance'

  // Data
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  // Form States - Teacher
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    phone: '',
    title: 'উচ্চতর গণিত ও বিজ্ঞান শিক্ষক',
    hourlyRate: 500,
    bio: ''
  });

  // Form States - Student
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    phone: '',
    grade: 'একাদশ শ্রেণী (Grade 11)',
    parentName: '',
    parentPhone: '',
    bio: ''
  });

  // Form States - Class
  const [classForm, setClassForm] = useState({
    title: '',
    subject: 'উচ্চতর গণিত',
    teacherId: '',
    gradeLevel: 'একাদশ - দ্বাদশ শ্রেণী',
    scheduleDays: ['Monday', 'Wednesday'],
    timeSlot: '05:00 PM - 06:30 PM',
    monthlyFee: 3200,
    perClassRate: 400,
    meetingLink: 'https://zoom.us/j/89214208912?pwd=edutrack',
    room: 'ভার্চুয়াল রুম - ১'
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, allUsers, classesData, invoicesData, deductionsData] = await Promise.all([
        api.getStats(),
        api.getUsers(),
        api.getClasses(),
        api.getInvoices(),
        api.getDeductions()
      ]);
      setStats(statsData);
      setTeachers(allUsers.filter(u => u.role === 'teacher'));
      setStudents(allUsers.filter(u => u.role === 'student'));
      setClasses(classesData);
      setInvoices(invoicesData);
      setDeductions(deductionsData);

      if (allUsers.filter(u => u.role === 'teacher').length > 0 && !classForm.teacherId) {
        setClassForm(prev => ({ ...prev, teacherId: allUsers.filter(u => u.role === 'teacher')[0].id }));
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Handle Add Teacher
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.name?.trim()) {
      alert('অনুগ্রহ করে শিক্ষকের পূর্ণ নাম প্রদান করুন।');
      return;
    }
    if (!teacherForm.email?.trim()) {
      alert('অনুগ্রহ করে শিক্ষকের ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await api.createUser({
        ...teacherForm,
        name: teacherForm.name.trim(),
        email: teacherForm.email.trim(),
        role: 'teacher'
      });
      if (res && res.id) {
        // Store in Firebase Firestore edutrack_users collection
        try {
          await autoBackupRecord('users', res);
        } catch (fErr) {
          console.warn('Firebase backup warning:', fErr);
        }

        showToast('✅ নতুন শিক্ষক সফলভাবে নিবন্ধিত হয়েছেন (Firebase-এ সংরক্ষিত)!');
        setShowAddTeacherModal(false);
        setTeacherForm({
          name: '',
          email: '',
          password: 'password123',
          phone: '',
          title: 'উচ্চতর গণিত ও বিজ্ঞান শিক্ষক',
          hourlyRate: 500,
          bio: ''
        });
        await loadAllAdminData();
        triggerRefresh();
      }
    } catch (err) {
      alert('শিক্ষক তৈরি ব্যর্থ হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Add Student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name?.trim()) {
      alert('অনুগ্রহ করে শিক্ষার্থীর পূর্ণ নাম প্রদান করুন।');
      return;
    }
    if (!studentForm.email?.trim()) {
      alert('অনুগ্রহ করে শিক্ষার্থীর ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await api.createUser({
        ...studentForm,
        name: studentForm.name.trim(),
        email: studentForm.email.trim(),
        role: 'student'
      });
      if (res && res.id) {
        // Store in Firebase Firestore edutrack_users collection
        try {
          await autoBackupRecord('users', res);
        } catch (fErr) {
          console.warn('Firebase backup warning:', fErr);
        }

        showToast('✅ নতুন শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে (Firebase-এ সংরক্ষিত)!');
        setShowAddStudentModal(false);
        setStudentForm({
          name: '',
          email: '',
          password: 'password123',
          phone: '',
          grade: 'একাদশ শ্রেণী (Grade 11)',
          parentName: '',
          parentPhone: '',
          bio: ''
        });
        await loadAllAdminData();
        triggerRefresh();
      }
    } catch (err) {
      alert('শিক্ষার্থী যোগ ব্যর্থ হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Add Class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.title?.trim()) {
      alert('অনুগ্রহ করে টিউশন ব্যাচের শিরোনাম প্রদান করুন।');
      return;
    }
    const teacherIdToUse = classForm.teacherId || teachers?.[0]?.id;
    if (!teacherIdToUse) {
      alert('অনুগ্রহ করে এই ব্যাচের জন্য একজন শিক্ষক নির্বাচন করুন (কোনো শিক্ষক পাওয়া যায়নি)।');
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await api.createClass({
        ...classForm,
        teacherId: teacherIdToUse
      });
      if (res && res.id) {
        // Store in Firebase Firestore edutrack_classes collection
        try {
          await autoBackupRecord('classes', res);
        } catch (fErr) {
          console.warn('Firebase backup warning:', fErr);
        }

        showToast('✅ নতুন টিউশন ব্যাচ সফলভাবে তৈরি ও Firebase-এ সংরক্ষিত হয়েছে!');
        setShowAddClassModal(false);
        setClassForm({
          title: '',
          subject: 'উচ্চতর গণিত',
          teacherId: teachers?.[0]?.id || '',
          gradeLevel: 'একাদশ - দ্বাদশ শ্রেণী',
          scheduleDays: ['Monday', 'Wednesday'],
          timeSlot: '05:00 PM - 06:30 PM',
          monthlyFee: 3200,
          perClassRate: 400,
          meetingLink: 'https://zoom.us/j/89214208912?pwd=edutrack',
          room: 'ভার্চুয়াল রুম - ১'
        });
        await loadAllAdminData();
        triggerRefresh();
      }
    } catch (err) {
      alert('ক্লাস তৈরি ব্যর্থ হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${user.name}" (${user.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'}) কে মুছে ফেলতে চান? এটি Firebase থেকেও মুছে যাবে।`)) return;
    try {
      await api.deleteUser(user.id);

      // Delete from Firebase Firestore edutrack_users collection
      autoDeleteRecord('users', user.id);

      showToast(`🗑️ "${user.name}" মুছে ফেলা হয়েছে (Firebase থেকেও অপসারিত)`);
      loadAllAdminData();
      triggerRefresh();
    } catch (err) {
      alert('ব্যবহারকারী ডিলিট ব্যর্থ হয়েছে');
    }
  };

  // Filtered Lists
  const filteredTeachers = teachers.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce text-xs font-bold">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {lang === 'bn' ? 'মাস্টার ম্যানেজমেন্ট' : 'Master Management'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              {lang === 'bn' 
                ? 'শিক্ষক, শিক্ষার্থী ও ক্লাসের সার্বিক নিয়ন্ত্রণ এবং রিয়েলটাইম ক্লাউড সিঙ্ক।'
                : 'Manage teachers, students, batches and cloud backup.'}
            </p>
          </div>

          {/* Quick Create Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? '+ শিক্ষক' : '+ Teacher'}</span>
            </button>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? '+ শিক্ষার্থী' : '+ Student'}</span>
            </button>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? '+ ব্যাচ' : '+ Batch'}</span>
            </button>
            <button
              onClick={() => setShowFirebaseModal(true)}
              title="Configure Firebase Cloud Services"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                isFirebaseConfigured()
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${isFirebaseConfigured() ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Firebase {isFirebaseConfigured() ? (lang === 'bn' ? 'কানেক্টেড' : 'Connected') : (lang === 'bn' ? 'সেটআপ' : 'Setup')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP MASTER KPI STATS: BOTH TEACHER & STUDENT */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Teachers */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {lang === 'bn' ? 'মোট শিক্ষক' : 'Teachers'}
          </span>
          <span className="text-xl font-bold text-slate-900 my-0.5 block">{stats?.totalTeachers || teachers.length}</span>
          <span className="text-[10px] text-slate-500">{lang === 'bn' ? 'নিবন্ধিত' : 'Registered'}</span>
        </div>

        {/* Students */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {lang === 'bn' ? 'মোট শিক্ষার্থী' : 'Students'}
          </span>
          <span className="text-xl font-bold text-slate-900 my-0.5 block">{stats?.totalStudents || students.length}</span>
          <span className="text-[10px] text-slate-500">{lang === 'bn' ? 'অ্যাক্টিভ' : 'Active'}</span>
        </div>

        {/* Classes */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {lang === 'bn' ? 'টিউশন ব্যাচ' : 'Batches'}
          </span>
          <span className="text-xl font-bold text-slate-900 my-0.5 block">{stats?.totalClasses || classes.length}</span>
          <span className="text-[10px] text-slate-500">{lang === 'bn' ? 'চলমান' : 'Ongoing'}</span>
        </div>

        {/* Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {lang === 'bn' ? 'আদায়কৃত ফি' : 'Collected'}
          </span>
          <span className="text-lg font-bold text-emerald-700 my-0.5 block">{formatMoney(stats?.totalEarnings || 0)}</span>
          <span className="text-[10px] text-emerald-700 font-medium">{lang === 'bn' ? 'পরিশোধিত' : 'Paid'}</span>
        </div>

        {/* Dues */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {lang === 'bn' ? 'বকেয়া ফি' : 'Due Amount'}
          </span>
          <span className="text-lg font-bold text-rose-700 my-0.5 block">{formatMoney(stats?.pendingDues || 0)}</span>
          <span className="text-[10px] text-rose-700 font-medium">{lang === 'bn' ? 'পেন্ডিং' : 'Pending'}</span>
        </div>

        {/* Teacher Skip Deductions */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {lang === 'bn' ? 'স্কিপ কর্তন' : 'Deductions'}
          </span>
          <span className="text-lg font-bold text-slate-700 my-0.5 block">-{formatMoney(stats?.totalDeductionsAmount || 0)}</span>
          <span className="text-[10px] text-slate-500">{stats?.totalDeductionsCount || deductions.length} {lang === 'bn' ? 'টি সেশন' : 'sessions'}</span>
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs & Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang === 'bn' ? 'পর্যালোচনা' : 'Overview'}
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'teachers' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang === 'bn' ? `শিক্ষক (${teachers.length})` : `Teachers (${teachers.length})`}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'students' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang === 'bn' ? `শিক্ষার্থী (${students.length})` : `Students (${students.length})`}
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'classes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang === 'bn' ? `ব্যাচ (${classes.length})` : `Batches (${classes.length})`}
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'finance' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang === 'bn' ? 'ফি ও কর্তন' : 'Finance'}
          </button>
        </div>

        {/* Search Input & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, ইমেইল বা বিষয় খুঁজুন..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <button
            onClick={loadAllAdminData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teachers Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 font-bold">👨‍🏫</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">শিক্ষক ও টিউটর প্যানেল</h3>
                  <p className="text-xs text-slate-500">মোট {teachers.length} জন রেজিস্টার্ড শিক্ষক</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeacherModal(true)}
                className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                + শিক্ষক যোগ
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {teachers.map(t => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.title} • {t.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-700 block">৳{t.hourlyRate || 500}/ঘণ্টা</span>
                    <span className="text-[10px] text-slate-400">{classes.filter(c => c.teacherId === t.id).length} টি ব্যাচ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Students Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 font-bold">👨‍🎓</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">শিক্ষার্থী ও অভিভাবক প্যানেল</h3>
                  <p className="text-xs text-slate-500">মোট {students.length} জন শিক্ষার্থী সক্রিয়</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                + শিক্ষার্থী যোগ
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {students.map(s => (
                <div key={s.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={s.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.grade || 'Student'} • {s.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">{s.parentName || 'অভিভাবক'}</span>
                    <span className="text-[10px] text-slate-400">{s.parentPhone || s.phone || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TEACHERS MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">নিবন্ধিত শিক্ষক তালিকা ({filteredTeachers.length})</h3>
              <p className="text-xs text-slate-500">শিক্ষক প্রোফাইল, বিষয় পারদর্শিতা ও ক্লাস অ্যাসাইনমেন্ট নিয়ন্ত্রণ</p>
            </div>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন শিক্ষক যোগ করুন</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">শিক্ষক (Teacher)</th>
                  <th className="py-3 px-4">পদবী ও বিশেষত্ব</th>
                  <th className="py-3 px-4">যোগাযোগ</th>
                  <th className="py-3 px-4">ঘণ্টাভিত্তিক ফি</th>
                  <th className="py-3 px-4">পরিচালিত ব্যাচ</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTeachers.map(t => {
                  const teacherClasses = classes.filter(c => c.teacherId === t.id);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img src={t.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div>{t.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">ID: {t.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 max-w-xs">{t.title}</td>
                      <td className="py-3 px-4 text-slate-500">
                        <div>{t.email}</div>
                        <div className="text-[10px] text-slate-400">{t.phone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700">৳{t.hourlyRate || 500} / ঘণ্টা</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {teacherClasses.length} টি ব্যাচ
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(t)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="শিক্ষক ডিলিট করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">নিবন্ধিত শিক্ষার্থী তালিকা ({filteredStudents.length})</h3>
              <p className="text-xs text-slate-500">শিক্ষার্থী ও তাদের অভিভাবকের তথ্য, শ্রেণী এবং স্ট্যাটাস</p>
            </div>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন শিক্ষার্থী যোগ করুন</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">শিক্ষার্থী (Student)</th>
                  <th className="py-3 px-4">শ্রেণী / বিভাগ</th>
                  <th className="py-3 px-4">অভিভাবক ও ফোন</th>
                  <th className="py-3 px-4">ইমেইল</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img src={s.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div>{s.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">ID: {s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{s.grade || 'একাদশ শ্রেণী'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-bold text-slate-800">{s.parentName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{s.parentPhone || s.phone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{s.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        সক্রিয় শিক্ষার্থী
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(s)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="শিক্ষার্থী ডিলিট করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CLASSES & BATCHES MANAGEMENT */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">সকল কোর্স ও ব্যাচ নিয়ন্ত্রণ ({classes.length})</h3>
              <p className="text-xs text-slate-500">বিষয়, শিক্ষক অ্যাসাইনমেন্ট, ক্লাস শিডিউল এবং প্রতি ক্লাস ফি রেট</p>
            </div>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ব্যাচ তৈরি করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => {
              const teacherObj = teachers.find(t => t.id === cls.teacherId);
              return (
                <div key={cls.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-purple-300 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                        {cls.subject}
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        ৳{cls.monthlyFee}/মাস
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{cls.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">শিক্ষক: {teacherObj?.name || 'অ্যাসাইন করা হয়নি'}</p>
                    <p className="text-[11px] text-slate-600">
                      <strong>সময়সূচী:</strong> {cls.timeSlot}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <strong>দিনসমূহ:</strong> {cls.scheduleDays?.join(', ')}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-purple-700 font-bold">
                      প্রতি ক্লাস: ৳{cls.perClassRate || 400}
                    </span>
                    <a
                      href={cls.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Zoom মিটিং</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: FINANCIAL & DEDUCTIONS LOG */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Teacher Skip Deductions Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-purple-950 flex items-center gap-2">
                  <span>🟣 শিক্ষক স্কিপ কর্তন হিসেব (Teacher Skip Deductions)</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    মোট: ৳{stats?.totalDeductionsAmount || 0}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  শিক্ষক ক্লাস স্কিপ করলে শিক্ষার্থীর পরবর্তী ইনভয়েসে স্বয়ংক্রিয়ভাবে এই পরিমাণ অর্থ ক্রেডিট/ছাড় হিসেবে সমন্বয় হয়।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">কোর্স / ব্যাচ</th>
                    <th className="py-3 px-4">অনুপস্থিত শিক্ষক</th>
                    <th className="py-3 px-4">শিক্ষার্থী</th>
                    <th className="py-3 px-4">কারণ / নোট</th>
                    <th className="py-3 px-4 text-right">কর্তনকৃত অর্থ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {deductions.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.date}</td>
                      <td className="py-3 px-4">{d.class?.title || 'Tuition Class'}</td>
                      <td className="py-3 px-4 font-semibold text-purple-900">{d.teacher?.name || 'শিক্ষক'}</td>
                      <td className="py-3 px-4">{d.student?.name || 'শিক্ষার্থী'}</td>
                      <td className="py-3 px-4 text-slate-500">{d.reason || 'শিক্ষক অনুপস্থিতি'}</td>
                      <td className="py-3 px-4 text-right font-black text-purple-700">-৳{d.amount}</td>
                    </tr>
                  ))}
                  {deductions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400">কোনো শিক্ষক স্কিপ কর্তন রেকর্ড পাওয়া যায়নি</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">সকল ইনভয়েস ও পেমেন্ট হিস্ট্রি ({invoices.length})</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ইনভয়েস নং</th>
                    <th className="py-3 px-4">শিক্ষার্থী</th>
                    <th className="py-3 px-4">বিবরণ / মাস</th>
                    <th className="py-3 px-4">পরিমাণ (Amount)</th>
                    <th className="py-3 px-4">অবস্থা</th>
                    <th className="py-3 px-4 text-right">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold">{inv.student?.name || 'শিক্ষার্থী'}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.title}</td>
                      <td className="py-3 px-4 font-black text-slate-900">৳{inv.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status === 'paid' ? 'পরিশোধিত (PAID)' : 'বকেয়া (PENDING)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">{inv.createdAt?.split('T')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD TEACHER ================= */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 text-slate-900 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold">👨‍🏫</div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">নতুন শিক্ষক যোগ করুন</h3>
                  <p className="text-xs text-slate-500">Register New Tutor Profile</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">শিক্ষকের পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ড. মাহতাব উদ্দিন"
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    placeholder="teacher@edutrack.com"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পদবী ও বিশেষত্ব</label>
                  <input
                    type="text"
                    value={teacherForm.title}
                    onChange={(e) => setTeacherForm({ ...teacherForm, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ঘণ্টাভিত্তিক ফি (৳)</label>
                  <input
                    type="number"
                    value={teacherForm.hourlyRate}
                    onChange={(e) => setTeacherForm({ ...teacherForm, hourlyRate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="+880 1712-345678"
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">সংক্ষিপ্ত পরিচিতি ও অভিজ্ঞতা</label>
                <textarea
                  rows={2}
                  placeholder="অভিজ্ঞতা ও ডিগ্রি..."
                  value={teacherForm.bio}
                  onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
                >
                  {formSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'শিক্ষক সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STUDENT ================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 text-slate-900 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold">👨‍🎓</div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">নতুন শিক্ষার্থী যোগ করুন</h3>
                  <p className="text-xs text-slate-500">Register New Student Profile</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">শিক্ষার্থীর পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সাকিব আল হাসান"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">শ্রেণী / বিভাগ</label>
                  <input
                    type="text"
                    value={studentForm.grade}
                    onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">শিক্ষার্থীর মোবাইল</label>
                  <input
                    type="text"
                    placeholder="+880 1819-234567"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অভিভাবকের নাম</label>
                  <input
                    type="text"
                    placeholder="পিতার বা মাতার নাম"
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অভিভাবকের মোবাইল</label>
                  <input
                    type="text"
                    placeholder="+880 1819-001122"
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  {formSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'শিক্ষার্থী সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CLASS ================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 text-slate-900 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl font-bold">📚</div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">নতুন টিউশন ব্যাচ তৈরি করুন</h3>
                  <p className="text-xs text-slate-500">Create New Tuition Course / Batch</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">কোর্স / ব্যাচ শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: উচ্চতর গণিত ও ত্রিকোণমিতি ব্যাচ"
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিষয় *</label>
                  <input
                    type="text"
                    required
                    value={classForm.subject}
                    onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">নির্ধারিত শিক্ষক *</label>
                  <select
                    required
                    value={classForm.teacherId || (teachers?.[0]?.id || '')}
                    onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.title || 'শিক্ষক'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ক্লাসের সময়সূচী</label>
                  <input
                    type="text"
                    value={classForm.timeSlot}
                    onChange={(e) => setClassForm({ ...classForm, timeSlot: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মাসিক ফি (৳)</label>
                  <input
                    type="number"
                    value={classForm.monthlyFee}
                    onChange={(e) => setClassForm({ ...classForm, monthlyFee: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রতি ক্লাস ফি রেট (৳)</label>
                  <input
                    type="number"
                    value={classForm.perClassRate}
                    onChange={(e) => setClassForm({ ...classForm, perClassRate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zoom লিংক</label>
                  <input
                    type="text"
                    value={classForm.meetingLink}
                    onChange={(e) => setClassForm({ ...classForm, meetingLink: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/20"
                >
                  {formSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'ব্যাচ তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Firebase Setup Modal */}
      <FirebaseSetupModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />
    </div>
  );
}
