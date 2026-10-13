import React, { useState } from 'react';
import { 
  X, LogIn, UserPlus, GraduationCap, BookOpen, 
  Lock, Mail, User, Phone, DollarSign, CheckCircle2, AlertCircle, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, users, switchUser, currencySymbol, authModalTab, setAuthModalTab } = useAuth();
  const [tab, setTab] = useState(authModalTab || 'login'); // 'login' | 'signup'
  const [role, setRole] = useState('student'); // 'student' | 'teacher'

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGrade, setRegGrade] = useState('HSC / Grade 11');
  const [regTitle, setRegTitle] = useState('Senior Mathematics Specialist');
  const [regHourlyRate, setRegHourlyRate] = useState('500');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setError(res.error || 'Invalid email or password');
      } else {
        onClose();
      }
    } catch (err) {
      setError('Failed to sign in. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role,
        phone: regPhone,
        grade: role === 'student' ? regGrade : undefined,
        title: role === 'teacher' ? regTitle : undefined,
        hourlyRate: role === 'teacher' ? Number(regHourlyRate) : undefined
      });

      if (!res.success) {
        setError(res.error || 'Registration failed');
      } else {
        onClose();
      }
    } catch (err) {
      setError('Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              EduTrack Academy
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            {tab === 'login' ? 'Welcome Back!' : 'Create New Account'}
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            {tab === 'login'
              ? 'Sign in to access your tuition batches, payments, and messages'
              : 'Sign up as a Teacher or Student to start tracking tuitions'}
          </p>

          {/* Tab Switcher */}
          <div className="mt-4 flex bg-indigo-900/40 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'login'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'signup'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="e.g. david.miller@edutrack.com"
                  required
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In to EduTrack'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo 1-Click Fill Helpers */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center">
                  Quick Demo Accounts
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('david.miller@edutrack.com');
                      setLoginPassword('password123');
                    }}
                    className="p-2 border border-slate-200 hover:border-indigo-400 rounded-xl text-left bg-slate-50 hover:bg-indigo-50/40"
                  >
                    <span className="font-bold text-slate-800 block truncate">Prof. David Miller</span>
                    <span className="text-[10px] text-indigo-600 font-semibold uppercase">Teacher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('alex.rivera@student.edu');
                      setLoginPassword('password123');
                    }}
                    className="p-2 border border-slate-200 hover:border-indigo-400 rounded-xl text-left bg-slate-50 hover:bg-indigo-50/40"
                  >
                    <span className="font-bold text-slate-800 block truncate">Alex Rivera</span>
                    <span className="text-[10px] text-emerald-600 font-semibold uppercase">Student</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ================= SIGN UP FORM ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Role Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  I want to register as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      role === 'teacher'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Teacher / Tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      role === 'student'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Student / Learner
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder={role === 'teacher' ? 'e.g. Dr. Rashidul Karim' : 'e.g. Tanvir Ahmed'}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="name@email.com"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+880 1700..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {role === 'teacher' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title</label>
                    <input
                      type="text"
                      value={regTitle}
                      onChange={e => setRegTitle(e.target.value)}
                      placeholder="e.g. Physics Specialist"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rate ({currencySymbol}/hr)</label>
                    <input
                      type="number"
                      value={regHourlyRate}
                      onChange={e => setRegHourlyRate(e.target.value)}
                      placeholder="500"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Class / Grade</label>
                  <input
                    type="text"
                    value={regGrade}
                    onChange={e => setRegGrade(e.target.value)}
                    placeholder="e.g. HSC 2nd Year / Class 10 / A-Level"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
