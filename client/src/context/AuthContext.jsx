import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const DEFAULT_USERS = [
  {
    id: "admin-1",
    name: "সিস্টেম অ্যাডমিনিস্ট্রেটর (System Admin)",
    email: "admin@edutrack.com",
    password: "admin123",
    role: "admin",
    title: "প্রধান একাডেমি পরিচালক ও কন্ট্রোলার (Academy Director)",
    phone: "+880 1700-ADMIN1",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
    bio: "একাডেমিক অপারেশনস, শিক্ষক-শিক্ষার্থী ডাটাবেস, ক্লাস শিডিউল ও পেমেন্ট কন্ট্রোলার।",
    emailVerified: true
  },
  {
    id: "teacher-1",
    name: "ড. রশিদুল করিম (Prof. David Miller)",
    email: "david.miller@edutrack.com",
    role: "teacher",
    title: "উচ্চতর গণিত ও পদার্থবিজ্ঞান বিশেষজ্ঞ (Senior Specialist)",
    phone: "+880 1712-345678",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
    bio: "ফলিত গণিতে পিএইচডি। ১০+ বছরের অভিজ্ঞতায় হাজারো শিক্ষার্থীকে উচ্চতর গণিত ও পদার্থবিজ্ঞানে শীর্ষ ফলাফল অর্জনে প্রস্তুত করেছেন।",
    hourlyRate: 600,
    password: "password123"
  },
  {
    id: "student-1",
    name: "তানভীর আহমেদ (Alex Rivera)",
    email: "alex.rivera@student.edu",
    role: "student",
    title: "একাদশ শ্রেণী (Grade 11 Student)",
    grade: "একাদশ শ্রেণী (Grade 11)",
    phone: "+880 1819-234567",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250",
    parentName: "এলেনা রিভেরা / ড. আহমেদ (Elena Rivera)",
    parentPhone: "+880 1819-001122",
    password: "password123",
    parentId: "parent-1"
  },
  {
    id: "student-due-demo",
    name: "রাশিদুল হাসান (Rashidul Hasan - 4x Dues)",
    email: "rashidul.hasan@student.edu",
    role: "student",
    title: "দ্বাদশ শ্রেণী (Grade 12) • ৪ মাসের বকেয়া",
    grade: "দ্বাদশ শ্রেণী (Grade 12)",
    phone: "+880 1719-998877",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250",
    parentName: "হাসান আলী",
    parentPhone: "+880 1719-001122",
    password: "password123",
    parentId: "parent-1"
  },
  {
    id: "parent-1",
    name: "রফিক আহমেদ (Rafiq Ahmed)",
    email: "parent@edutrack.com",
    role: "parent",
    title: "অভিভাবক (Parent / Guardian)",
    phone: "+880 1819-001122",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250",
    password: "password123"
  }
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Currency & global settings (Default: Taka ৳)
  const [settings, setSettings] = useState({
    currencyCode: 'BDT',
    currencySymbol: '৳',
    currencyName: 'Bangladeshi Taka',
    vatPercent: 0
  });

  // Language state: 'bn' (Bangla) | 'en' (English)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('edutrack_lang') || 'bn';
  });

  const toggleLanguage = () => {
    setLang(prev => {
      const next = prev === 'bn' ? 'en' : 'bn';
      localStorage.setItem('edutrack_lang', next);
      return next;
    });
  };

  // Minimal translations dictionary
  const translations = {
    overview: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
    classes: { bn: 'টিউশন ব্যাচ', en: 'Batches' },
    attendance: { bn: 'হাজিরা ট্র্যাকার', en: 'Attendance' },
    invoices: { bn: 'ইনভয়েস ও পেমেন্ট', en: 'Invoices' },
    reports: { bn: 'মাসিক রিপোর্ট', en: 'Reports' },
    messages: { bn: 'মেসেজ ও চ্যাট', en: 'Messages' },
    assignments: { bn: 'হোমওয়ার্ক', en: 'Homework' },
    students: { bn: 'শিক্ষার্থী তালিকা', en: 'Students' },
    notes: { bn: 'স্টাডি নোটস', en: 'Study Notes' },
    routine: { bn: 'ক্লাস রুটিন', en: 'Routine' },
    gradebook: { bn: 'পরীক্ষার ফলাফল', en: 'Results' },
    announcements: { bn: 'নোটিশবোর্ড', en: 'Notices' },
    rewards: { bn: 'রিওয়ার্ডস', en: 'Rewards' },
    adminConsole: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel' },
    teacherPortal: { bn: 'শিক্ষক পোর্টাল', en: 'Teacher Portal' },
    studentPortal: { bn: 'শিক্ষার্থী পোর্টাল', en: 'Student Portal' },
    guardianPortal: { bn: 'অভিভাবক পোর্টাল', en: 'Guardian Portal' },
    login: { bn: 'লগইন', en: 'Login' },
    logout: { bn: 'লগআউট', en: 'Logout' },
    save: { bn: 'সংরক্ষণ', en: 'Save' },
    cancel: { bn: 'বাতিল', en: 'Cancel' },
    inbox: { bn: 'ইনবক্স', en: 'Inbox' },
    tracker: { bn: 'হোম ট্র্যাকার', en: 'Tracker' }
  };

  const t = (key, fallbackEn = '') => {
    if (translations[key]) {
      return translations[key][lang] || translations[key].en || fallbackEn;
    }
    return fallbackEn || key;
  };

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup'

  const [parentStudents, setParentStudents] = useState([]);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [parentViewMode, setParentViewMode] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && data.currencySymbol) {
        setSettings(data);
      }
    } catch (err) {
      console.warn('Using default currency settings');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
      }
      const savedId = localStorage.getItem('edutrack_user_id');
      const list = (Array.isArray(data) && data.length > 0) ? data : DEFAULT_USERS;
      const found = savedId ? list.find(u => u.id === savedId) : null;
      if (found) {
        setCurrentUser(found);
      }
    } catch (err) {
      console.warn('Backend users not reachable, using offline default users');
      const savedId = localStorage.getItem('edutrack_user_id');
      const found = savedId ? DEFAULT_USERS.find(u => u.id === savedId) : null;
      if (found) {
        setCurrentUser(found);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, [refreshKey]);

  // When currentUser changes, handle parent student linking
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'parent') {
      api.getParentStudents(currentUser.id).then(children => {
        if (Array.isArray(children) && children.length > 0) {
          setParentStudents(children);
          setActiveStudentId(children[0].id);
        } else {
          const s1 = users.find(u => u.id === 'student-1') || DEFAULT_USERS[2];
          if (s1) {
            setParentStudents([s1]);
            setActiveStudentId(s1.id);
          }
        }
      }).catch(() => {
        const s1 = users.find(u => u.id === 'student-1') || DEFAULT_USERS[2];
        if (s1) {
          setParentStudents([s1]);
          setActiveStudentId(s1.id);
        }
      });
    } else if (currentUser.role === 'student') {
      setActiveStudentId(currentUser.id);
      setParentStudents([currentUser]);
    }
  }, [currentUser, users]);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('edutrack_user_id', res.user.id);
        setRefreshKey(prev => prev + 1);
        setShowAuthModal(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      console.warn('API login network notice, falling back to local user store');
    }

    // Local / Offline authentication fallback
    const normalizedEmail = (email || '').trim().toLowerCase();
    const currentList = (users && users.length > 0) ? users : DEFAULT_USERS;
    const foundUser = currentList.find(u => 
      u.email?.toLowerCase() === normalizedEmail ||
      (normalizedEmail.includes('admin') && u.role === 'admin') ||
      (normalizedEmail.includes('teacher') && u.role === 'teacher') ||
      (normalizedEmail.includes('student') && u.role === 'student') ||
      (normalizedEmail.includes('david') && u.id === 'teacher-1') ||
      (normalizedEmail.includes('tanveer') && u.id === 'student-1')
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('edutrack_user_id', foundUser.id);
      setRefreshKey(prev => prev + 1);
      setShowAuthModal(false);
      return { success: true, user: foundUser };
    }

    return { success: false, error: 'ভুল ইমেইল বা পাসওয়ার্ড। স্ক্রিনের বামপাশে ডেমো আইডিতে ১-ক্লিক করুন।' };
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('edutrack_user_id', res.user.id);
      await loadUsers();
      setRefreshKey(prev => prev + 1);
      setShowAuthModal(false);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('edutrack_user_id');
    setCurrentUser(null);
    setShowAuthModal(true);
    setAuthModalTab('login');
  };

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('edutrack_user_id', user.id);
    setRefreshKey(prev => prev + 1);
  };

  const updateCurrency = async (newSettings) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      setRefreshKey(prev => prev + 1);
      return updated;
    } catch (err) {
      console.error('Failed to update currency settings:', err);
    }
  };

  const formatMoney = (amount) => {
    const sym = settings.currencySymbol || '৳';
    const num = Number(amount || 0);
    return `${sym} ${num.toLocaleString()}`;
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        switchUser,
        login,
        register,
        logout,
        loading,
        refreshKey,
        triggerRefresh,
        reloadUsers: loadUsers,
        isAdmin: currentUser?.role === 'admin',
        isTeacher: currentUser?.role === 'teacher',
        isStudent: currentUser?.role === 'student',
        isParent: currentUser?.role === 'parent',
        parentStudents,
        setParentStudents,
        activeStudentId,
        setActiveStudentId,
        activeStudent: parentStudents.find(s => s.id === activeStudentId) || (currentUser?.role === 'student' ? currentUser : users.find(u => u.id === 'student-1')),
        parentViewMode,
        setParentViewMode,
        settings,
        updateCurrency,
        formatMoney,
        currencySymbol: settings.currencySymbol || '৳',
        showAuthModal,
        setShowAuthModal,
        authModalTab,
        setAuthModalTab,
        lang,
        setLang,
        toggleLanguage,
        t
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
