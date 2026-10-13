import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      console.error('Failed to load settings:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      if (!currentUser && data.length > 0) {
        const savedId = localStorage.getItem('edutrack_user_id');
        const found = savedId ? data.find(u => u.id === savedId) : null;
        setCurrentUser(found || null);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
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
          // Fallback to student-1
          const s1 = users.find(u => u.id === 'student-1');
          if (s1) {
            setParentStudents([s1]);
            setActiveStudentId(s1.id);
          }
        }
      }).catch(console.warn);
    } else if (currentUser.role === 'student') {
      setActiveStudentId(currentUser.id);
      setParentStudents([currentUser]);
    }
  }, [currentUser, users]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('edutrack_user_id', res.user.id);
      setRefreshKey(prev => prev + 1);
      setShowAuthModal(false);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
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
