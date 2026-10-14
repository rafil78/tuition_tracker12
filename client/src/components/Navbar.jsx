import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Bell, RotateCcw, ChevronDown, Check, MessageSquare,
  UserCheck, Shield, ExternalLink, Coins, LogIn, UserPlus, LogOut, Navigation, Flame, Globe,
  HardDrive, Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import CurrencyModal from './CurrencyModal';
import AuthModal from './AuthModal';
import FirebaseSetupModal from './FirebaseSetupModal';
import ServerConfigModal from './ServerConfigModal';
import NotificationDropdown from './NotificationDropdown';
import { isFirebaseConfigured } from '../firebase';

export default function Navbar({ onOpenAuthPage, onOpenLocationModal, unreadMessagesCount = 0, onNavigateToChat }) {
  const { 
    users, currentUser, switchUser, isAdmin, isTeacher, isParent, logout, 
    settings, currencySymbol, showAuthModal, setShowAuthModal,
    authModalTab, setAuthModalTab,
    lang, toggleLanguage, t
  } = useAuth();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [isOffline, setIsOffline] = useState(() => api.isOffline());
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const checkOffline = () => {
      setIsOffline(api.isOffline());
    };
    window.addEventListener('online', checkOffline);
    window.addEventListener('offline', checkOffline);
    window.addEventListener('edutrack_connection_mode_changed', checkOffline);
    return () => {
      window.removeEventListener('online', checkOffline);
      window.removeEventListener('offline', checkOffline);
      window.removeEventListener('edutrack_connection_mode_changed', checkOffline);
    };
  }, []);

  // Poll for phone/system notifications count
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifCount = async () => {
      try {
        const res = await api.getNotifications(currentUser.id);
        if (res && typeof res.unreadCount === 'number') {
          setUnreadNotifCount(res.unreadCount);
        }
      } catch (err) {}
    };
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleResetData = async () => {
    if (!window.confirm(lang === 'bn' ? 'আপনি কি ডেমো ডাটা রিসেট করতে চান?' : 'Reset database to demo data?')) return;
    setResetting(true);
    try {
      await api.resetData();
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base">EduTrack</span>
            <span className="text-[11px] text-slate-400 font-medium ml-2 hidden sm:inline">
              {lang === 'bn' ? 'টিউশন ম্যানেজার' : 'Tuition Manager'}
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
          
          {/* Connection Mode Pill */}
          <button
            onClick={() => setShowServerModal(true)}
            title={
              isOffline
                ? (lang === 'bn' ? '⚡ অফলাইন ডাটাবেস সক্রিয় (মোবাইল ও অফলাইন ফ্রেন্ডলি)' : '⚡ Offline-First Mode Active (Mobile & Offline Ready)')
                : (lang === 'bn' ? '🌐 ব্যাকএন্ড সার্ভার সক্রিয়' : '🌐 Backend Server Live')
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
              isOffline
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 hover:from-amber-100 hover:to-orange-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-emerald-600' : 'bg-emerald-500 animate-pulse'}`} />
            {isOffline ? (
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500/30" />
            )}
            <span className="hidden sm:inline font-mono tracking-tight text-[11px]">
              {isOffline ? (lang === 'bn' ? 'অফলাইন মোড' : 'Offline Mode') : 'Server Live'}
            </span>
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Quick Inbox Live Chat Button */}
          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              title={lang === 'bn' ? 'মেসেজ ইনবক্স' : 'Inbox'}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                unreadMessagesCount > 0
                  ? 'border-blue-400 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${unreadMessagesCount > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{lang === 'bn' ? 'ইনবক্স' : 'Inbox'}</span>
              {unreadMessagesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications & Phone Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setDropdownOpen(false);
              }}
              title={lang === 'bn' ? 'নোটিফিকেশন ও ফোন অ্যালার্ট' : 'Notifications & Phone Alerts'}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                unreadNotifCount > 0
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${unreadNotifCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{lang === 'bn' ? 'অ্যালার্ট' : 'Alerts'}</span>
              {unreadNotifCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={notifDropdownOpen}
              onClose={() => setNotifDropdownOpen(false)}
            />
          </div>

          {/* Home Tuition Live Tracker (Students & Parents only) */}
          {onOpenLocationModal && !isTeacher && !isAdmin && (
            <button
              onClick={onOpenLocationModal}
              title={lang === 'bn' ? 'হোম টিউশন ট্র্যাকার' : 'Home Tutor Tracker'}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{lang === 'bn' ? 'ট্র্যাকার' : 'Tracker'}</span>
            </button>
          )}

          {/* Dedicated Auth Page */}
          <button
            onClick={onOpenAuthPage}
            title={lang === 'bn' ? 'লগইন / সাইন আপ' : 'Login / Signup'}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'bn' ? 'লগইন' : 'Account'}</span>
          </button>

          {/* Firebase Status (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowFirebaseModal(true)}
              title="Firebase Config"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
            >
              <Flame className={`w-3.5 h-3.5 ${isFirebaseConfigured() ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>Firebase</span>
            </button>
          )}

          {/* Currency Pill (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowCurrencyModal(true)}
              title="Currency"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            >
              <Coins className="w-3.5 h-3.5 text-slate-400" />
              <span>{settings?.currencySymbol || '৳'} {settings?.currencyCode || 'BDT'}</span>
            </button>
          )}

          {/* Reset Demo Data Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={handleResetData}
              disabled={resetting}
              title="Reset database to initial demo state"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo DB</span>
            </button>
          )}

          {/* Sign In / Sign Up triggers if logged out */}
          {!currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenAuthPage}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onOpenAuthPage}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Sign Up
              </button>
            </div>
          ) : (
            /* User Profile & Role Switcher Dropdown */
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <img
                  src={currentUser?.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-white"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser?.name}
                  </p>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                    {isAdmin ? '🛡️ Super Admin' : isTeacher ? '👨‍🏫 Teacher / Tutor' : isParent ? '👨‍👩‍👦 Guardian / Parent' : '👨‍🎓 Student'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                  
                  {/* Account Actions */}
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Auth shortcuts */}
                  <div className="px-2 py-1.5 border-b border-slate-100 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        if (onOpenAuthPage) onOpenAuthPage();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                        <span>লগইন / সাইন আপ পেজ</span>
                      </span>
                      <span className="text-[10px] bg-indigo-200/70 text-indigo-800 px-1.5 py-0.2 rounded font-mono">OTP</span>
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setAuthModalTab('signup');
                          setShowAuthModal(true);
                          setDropdownOpen(false);
                        }}
                        className="flex-1 text-left px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Modal Signup</span>
                      </button>
                      <button
                        onClick={() => {
                          setAuthModalTab('login');
                          setShowAuthModal(true);
                          setDropdownOpen(false);
                        }}
                        className="flex-1 text-left px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Modal Login</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setShowServerModal(true);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'bn' ? 'অফলাইন ও সার্ভার মোড' : 'Server & Offline Mode'}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isOffline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {isOffline ? 'Offline' : 'Server'}
                      </span>
                    </button>
                  </div>

                  {/* 1-Click Persona Switcher */}
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      1-Click Persona Switch (Demo)
                    </span>
                  </div>

                  <div className="py-1 max-h-56 overflow-y-auto">
                    {users.map(u => {
                      const isSelected = u.id === currentUser?.id;
                      const isDueDemo = u.id === 'student-due';
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-indigo-50/60' : isDueDemo ? 'bg-rose-50/40 hover:bg-rose-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={u.avatar}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                              />
                              {isDueDemo && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                              <span className={`text-[9px] font-bold uppercase px-1 rounded ${
                                isDueDemo
                                  ? 'bg-rose-100 text-rose-700 font-semibold'
                                  : u.role === 'teacher'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : u.role === 'parent'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {isDueDemo ? '⚠️ বকেয়া ডেমো (৳15,200 বকেয়া)' : u.role === 'parent' ? 'অভিভাবক (Parent)' : u.role}
                              </span>
                            </div>
                          </div>

                          {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Global Modals */}
      <CurrencyModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <FirebaseSetupModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />

      <ServerConfigModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
      />
    </header>
  );
}
