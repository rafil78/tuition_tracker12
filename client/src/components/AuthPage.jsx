import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Mail, Lock, User, Phone, BookOpen, 
  CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Copy, 
  RotateCw, AlertCircle, ExternalLink, ArrowLeft, Send, Check, Flame, Server
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, isFirebaseConfigured } from '../firebase';
import FirebaseSetupModal from './FirebaseSetupModal';
import ServerConfigModal from './ServerConfigModal';
import { autoBackupRecord } from '../firestoreSync';

export default function AuthPage({ onGoToDashboard }) {
  const { login, register, users, currentUser, switchUser } = useAuth();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState('student'); // 'student' | 'teacher'

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [gradeOrTitle, setGradeOrTitle] = useState('');

  // Sign In Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');

  // OTP Stage States: 'form' | 'otp_verification'
  const [otpStage, setOtpStage] = useState('form');
  const [otpCode, setOtpCode] = useState('');
  const [otpSentData, setOtpSentData] = useState(null);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // SMTP Settings State
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({ configured: false, user: '' });
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestMsg, setSmtpTestMsg] = useState('');
  const [smtpTestError, setSmtpTestError] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);

  useEffect(() => {
    api.getSmtpConfig().then(cfg => {
      if (cfg) {
        setSmtpConfig(cfg);
        if (cfg.user) setSmtpUser(cfg.user);
      }
    }).catch(console.warn);
  }, []);

  const handleSaveSmtp = async (e) => {
    if (e) e.preventDefault();
    if (!smtpUser || !smtpPass) {
      setSmtpTestError('অনুগ্রহ করে প্রেরক জিমেইল ও অ্যাপ পাসওয়ার্ড পূরণ করুন।');
      return;
    }
    setSavingSmtp(true);
    setSmtpTestError('');
    try {
      const res = await api.updateSmtpConfig({
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        host: 'smtp.gmail.com',
        port: 465,
        secure: true
      });
      if (res && res.success) {
        setSmtpConfig(res.config);
        setShowSmtpModal(false);
        setSuccessMsg('✅ জিমেইল এসএমটিপি সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setSuccessMsg(''), 4000);

        // If the user was trying to send an OTP to their email, send it now
        if (email && email.includes('@') && otpStage === 'form') {
          setTimeout(() => {
            handleRequestOtp();
          }, 300);
        }
      } else {
        setSmtpTestError(res?.error || 'এসএমটিপি কনফিগারেশন সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setSmtpTestError('এসএমটিপি কনফিগারেশন সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpUser || !smtpPass) {
      setSmtpTestError('অনুগ্রহ করে প্রেরক জিমেইল ও ১৬-সংখ্যার অ্যাপ পাসওয়ার্ড লিখুন।');
      return;
    }
    setTestingSmtp(true);
    setSmtpTestMsg('');
    setSmtpTestError('');
    try {
      const res = await api.testSmtpConfig({
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        testEmail: email || smtpUser.trim()
      });
      if (res && res.success) {
        setSmtpTestMsg(res.message || `✅ সংযোগ সফল! টেস্ট ইমেইল পৌঁছেছে: ${email || smtpUser}`);
      } else {
        setSmtpTestError(res?.error || 'সংযোগ ব্যর্থ হয়েছে। আপনার গুগল অ্যাপ পাসওয়ার্ড সঠিক কি না পরীক্ষা করুন।');
      }
    } catch (err) {
      setSmtpTestError(err.message || 'সার্ভারে সংযোগ ব্যর্থ হয়েছে।');
    } finally {
      setTestingSmtp(false);
    }
  };

  // Pre-fill demo credentials when toggling demo quick login
  const handleSelectDemoUser = async (user) => {
    setError('');
    setLoading(true);
    try {
      await switchUser(user);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      if (onGoToDashboard) onGoToDashboard();
    } catch (err) {
      setError('ডেমো ব্যবহারকারী পরিবর্তন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    if (!isFirebaseConfigured()) {
      const confirmDemo = window.confirm(
        '⚠️ ফায়ারবেস (Firebase) ক্লাউড এখনও কনফিগার করা হয়নি।\n\n' +
        'আপনি কি সরাসরি গুগল ডেমো অ্যাকাউন্ট দিয়ে অ্যাপে প্রবেশ করতে চান?\n\n' +
        '(আপনার নিজস্ব Firebase API Keys বসাতে "Cancel" চাপুন)'
      );
      if (confirmDemo) {
        const demoGoogleUser = {
          id: 'google-user-' + Date.now(),
          name: 'Google পরীক্ষার্থী (Verified)',
          email: 'student.google@edutrack.edu',
          role: role || 'student',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
          title: 'Google অথেনটিকেশন পরীক্ষার্থী',
          emailVerified: true
        };
        await switchUser(demoGoogleUser);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        if (onGoToDashboard) onGoToDashboard();
        return;
      }
      setShowFirebaseModal(true);
      return;
    }
    setLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      let existing = users.find(u => u.email?.toLowerCase() === googleUser.email?.toLowerCase());
      if (!existing) {
        const res = await register({
          name: googleUser.displayName || 'Google User',
          email: googleUser.email,
          password: 'password123',
          role: role || 'student',
          avatar: googleUser.photoURL || undefined
        });
        if (res.success) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          if (onGoToDashboard) onGoToDashboard();
        }
      } else {
        await switchUser(existing);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        if (onGoToDashboard) onGoToDashboard();
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      setError('গুগল সাইন-ইন ত্রুটি: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (otpStage === 'otp_verification' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStage, otpTimer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // STEP 1: Send OTP to Gmail
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('অনুগ্রহ করে আপনার নাম প্রদান করুন।');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('অনুগ্রহ করে সঠিক জিমেইল / ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ ডিজিট হতে হবে।');
      return;
    }

    setLoading(true);

    try {
      // Request real OTP from server
      const res = await api.sendOtp(email.trim(), name.trim());
      
      if (res && res.success) {
        setOtpSentData(res);
        setOtpStage('otp_verification');
        setOtpTimer(600);
        setSuccessMsg(res.message || `আপনার জিমেইল (${email}) এ ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে! ইনবক্স চেক করুন।`);
      } else if (res && res.smtpNotConfigured) {
        setError(res.error || 'জিমেইলে ওটিপি পাঠানোর জন্য জিমেইল এসএমটিপি ও অ্যাপ পাসওয়ার্ড সেট করা প্রয়োজন।');
        setShowSmtpModal(true);
      } else if (res && res.fallbackOtp) {
        // Fallback backup code provided
        setOtpSentData(res);
        setOtpStage('otp_verification');
        setOtpTimer(600);
        setError(res.error || 'জিমেইল ওটিপি পাঠানো যায়নি। আপনি নিচে প্রদর্শিত ব্যাকআপ কোড ব্যবহার করতে পারেন।');
      } else {
        setError(res?.error || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err) {
      console.error('OTP request error:', err);
      setError('সার্ভারে যোগাযোগ ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendingOtp(true);
    try {
      const res = await api.sendOtp(email.trim(), name.trim());
      if (res && res.success) {
        setOtpSentData(res);
        setOtpTimer(600);
        setSuccessMsg(res.message || `🔄 আপনার জিমেইলে (${email}) নতুন ওটিপি কোড পাঠানো হয়েছে!`);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else if (res && res.smtpNotConfigured) {
        setError(res.error || 'জিমেইল এসএমটিপি কনফিগার করা নেই।');
        setShowSmtpModal(true);
      } else if (res && res.fallbackOtp) {
        setOtpSentData(res);
        setOtpTimer(600);
        setError(res.error || 'জিমেইল ওটিপি বিলম্বিত। ব্যাকআপ কোড ব্যবহার করতে পারেন।');
      } else {
        setError(res?.error || 'পুনরায় ওটিপি পাঠাতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ ব্যর্থ হয়েছে।');
    } finally {
      setResendingOtp(false);
    }
  };

  // STEP 2: Verify OTP and complete Registration
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('অনুগ্রহ করে জিমেইল থেকে ৬-ডিজিটের ওটিপি কোড দিন।');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify OTP with server
      const verifyRes = await api.verifyOtp(email.trim(), otpCode.trim());

      if (!verifyRes.success) {
        setError(verifyRes.error || 'ভুল ওটিপি কোড। জিমেইল চেক করে আবার চেষ্টা করুন।');
        setLoading(false);
        return;
      }

      // 2. Complete User Registration
      const regRes = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role,
        phone: phone.trim() || '01712345678',
        grade: role === 'student' ? (gradeOrTitle.trim() || 'একাদশ শ্রেণী (Grade 11)') : undefined,
        title: role === 'teacher' ? (gradeOrTitle.trim() || 'প্রাইভেট টিউটর / শিক্ষক') : undefined,
        otpVerified: true
      });

      if (regRes.success) {
        if (isFirebaseConfigured()) {
          autoBackupRecord('users', {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: role,
            phone: phone.trim() || '01712345678',
            grade: role === 'student' ? (gradeOrTitle.trim() || 'একাদশ শ্রেণী (Grade 11)') : undefined,
            title: role === 'teacher' ? (gradeOrTitle.trim() || 'প্রাইভেট টিউটর / শিক্ষক') : undefined
          });
        }

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 }
        });
        setSuccessMsg('🎉 অভিনন্দন! আপনার জিমেইল অ্যাকাউন্ট সফলভাবে ভেরিফাই ও তৈরি হয়েছে!');
        setTimeout(() => {
          if (onGoToDashboard) onGoToDashboard();
        }, 1200);
      } else {
        setError(regRes.error || 'নিবন্ধন সম্পন্ন করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginEmail.trim()) {
      setError('জিমেইল বা ইমেইল ঠিকানা দিন।');
      return;
    }

    setLoading(true);
    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (res.success) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        if (onGoToDashboard) onGoToDashboard();
      } else {
        setError(res.error || 'ভুল ইমেইল বা পাসওয়ার্ড।');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('লগইন করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOtp = () => {
    if (otpSentData?.otp) {
      navigator.clipboard.writeText(otpSentData.otp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  const handleAutofillOtp = () => {
    if (otpSentData?.otp) {
      setOtpCode(otpSentData.otp);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col font-sans relative selection:bg-indigo-500 selection:text-white">
      
      {/* Top Floating Bar */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">EduTrack</span>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                বাংলাদেশ সংস্করণ
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              টিউশন ও ব্যাচ ম্যানেজমেন্ট প্ল্যাটফর্ম
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFirebaseModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl text-xs font-bold transition-all border border-amber-400/30"
            title="Configure Google Firebase Auth & Cloud Firestore"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">ফায়ারবেস (Firebase)</span>
            <span className="sm:hidden">Firebase</span>
          </button>

          <button
            onClick={() => setShowSmtpModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
            title="Configure Realtime Gmail SMTP"
          >
            <span className={`w-2 h-2 rounded-full ${smtpConfig.configured ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="hidden sm:inline">ইমেইল সেটিংস (SMTP)</span>
            <span className="sm:hidden">SMTP</span>
          </button>

          <button
            onClick={() => setShowServerModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-xl text-xs font-bold transition-all border border-indigo-400/30"
            title="Configure Server or Offline Mode"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">সার্ভার সেটিংস</span>
            <span className="sm:hidden">Server</span>
          </button>

          {currentUser && (
            <button
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ড্যাশবোর্ডে ফিরে যান ({currentUser.name})</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Column: Platform Features & 1-Click Demo Accounts */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>এসএসএলকমার্জ (SSLCommerz) ও জিমেইল ওটিপি সুরক্ষিত</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              শিক্ষক ও শিক্ষার্থীদের জন্য <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                স্মার্ট টিউশন ট্র্যাকার
              </span>
            </h1>
            
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              অনলাইন ব্যাচ তৈরি, শিক্ষার্থীদের উপস্থিতি, পরীক্ষা ও নম্বরপত্র, ক্লাস সময় পরিবর্তনের অনুরোধ এবং 
              বিকাশ, নগদ, রকেটের মাধ্যমে সরাসরি ৳ টাকা ফি গ্রহণ করুন এক প্ল্যাটফর্মে।
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-2 font-black text-xs">
                ৳
              </div>
              <h4 className="text-sm font-bold text-white">SSLCommerz গেটওয়ে</h4>
              <p className="text-xs text-slate-400 mt-0.5">বিকাশ, নগদ, রকেট ও কার্ডে তাৎক্ষণিক ফি প্রদান ও ডিজিটাল রসিদ।</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">জিমেইল ওটিপি সিকিউরিটি</h4>
              <p className="text-xs text-slate-400 mt-0.5">অ্যাকাউন্ট তৈরির সময় রিয়েল-টাইম জিমেইল ৬-ডিজিট ভেরিফিকেশন।</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">ব্যাচ ও সময় পরিবর্তন</h4>
              <p className="text-xs text-slate-400 mt-0.5">শিক্ষার্থীরা সময়ের অনুরোধ পাঠাতে পারে এবং শিক্ষক অনুমোদন দেন।</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2">
                <User className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">বাংলা ও দ্বিভাষিক নাম</h4>
              <p className="text-xs text-slate-400 mt-0.5">শিক্ষক, শিক্ষার্থী ও কোর্স সম্পূর্ণ বাংলা ও ইংরেজি মাধ্যমে সাজানো।</p>
            </div>
          </div>

          {/* 1-Click Demo Personas */}
          <div className="p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/30 backdrop-blur-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                ১-ক্লিকে ডেমো টেস্ট অ্যাকাউন্ট বেছে নিন (Demo Logins)
              </span>
              <span className="text-[10px] text-slate-400">পাসওয়ার্ড প্রয়োজন নেই</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {users.slice(0, 6).map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectDemoUser(u)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-left transition-all flex items-center gap-2.5 group"
                >
                  <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      {u.role === 'admin' ? '🛡️ সিস্টেম অ্যাডমিন' : u.role === 'teacher' ? '👨‍🏫 শিক্ষক' : u.role === 'parent' ? '👨‍👧‍👦 অভিভাবক' : '👨‍🎓 শিক্ষার্থী'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Full Interactive Auth Box */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 relative">
            
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setOtpStage('form');
                  setError('');
                }}
                className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                  mode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 নতুন অ্যাকাউন্ট খুলুন (Sign Up)
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                  mode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔑 সাইন ইন / লগইন (Sign In)
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SIGN UP MODE */}
            {mode === 'signup' && (
              <div>
                
                {otpStage === 'form' ? (
                  /* Form Stage */
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    
                    {/* Role Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        আপনার ভূমিকা নির্বাচন করুন (Select Role)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 ${
                            role === 'student'
                              ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl">👨‍🎓</span>
                          <div>
                            <p className="text-xs font-extrabold">শিক্ষার্থী (Student)</p>
                            <p className="text-[10px] text-slate-500">কোর্সে যুক্ত হবেন</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('teacher')}
                          className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 ${
                            role === 'teacher'
                              ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl">👨‍🏫</span>
                          <div>
                            <p className="text-xs font-extrabold">শিক্ষক (Teacher)</p>
                            <p className="text-[10px] text-slate-500">ব্যাচ পরিচালনা করবেন</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('parent')}
                          className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 ${
                            role === 'parent'
                              ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl">👨‍👧‍👦</span>
                          <div>
                            <p className="text-xs font-extrabold">অভিভাবক (Parent)</p>
                            <p className="text-[10px] text-slate-500">অগ্রগতি ও ট্র্যাকিং</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পূর্ণ নাম (বাংলা ও ইংরেজি নাম)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="উদাঃ সাকিব আল হাসান (Sakib Al Hasan)"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    {/* Gmail / Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        জিমেইল ঠিকানা (Gmail Address) - ওটিপি যাচাইয়ের জন্য
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        এই জিমেইলে তাৎক্ষণিক ৬-সংখ্যার ওটিপি কোড পাঠানো হবে।
                      </p>
                    </div>

                    {/* Mobile & Grade/Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          মোবাইল নম্বর
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="017XXXXXXXX"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                          />
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {role === 'student' ? 'শ্রেণী (Grade / Batch)' : 'পদবী / বিষয়'}
                        </label>
                        <input
                          type="text"
                          value={gradeOrTitle}
                          onChange={(e) => setGradeOrTitle(e.target.value)}
                          placeholder={role === 'student' ? 'একাদশ শ্রেণী / HSC' : 'উচ্চতর গণিত শিক্ষক'}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        গোপন পাসওয়ার্ড (Password)
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    {/* Submit & Trigger Gmail OTP */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>জিমেইল ওটিপি পাঠানো হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>জিমেইল ওটিপি কোড পাঠান (Get Gmail OTP)</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!email.trim()) {
                            setError('অনুগ্রহ করে প্রথমে আপনার জিমেইল ঠিকানা দিন');
                            return;
                          }
                          setOtpStage('otp_verification');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                      >
                        📩 ইতোমধ্যে জিমেইলে ওটিপি কোড পেয়েছেন? এখানে লিখুন
                      </button>
                    </div>

                  </form>
                ) : (
                  /* OTP Verification Stage */
                  <form onSubmit={handleVerifyOtpAndRegister} className="space-y-5 animate-fadeIn">
                    
                    <div className="text-center space-y-1">
                      <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                        <Mail className="w-7 h-7 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        জিমেইল ওটিপি ভেরিফিকেশন
                      </h3>
                      <p className="text-xs text-slate-500">
                        আপনার জিমেইল <span className="font-bold text-slate-900 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{email}</span> এ ৬-সংখ্যার কোড পাঠানো হয়েছে।
                      </p>
                    </div>

                    {/* Real Gmail Notice & Quick Link */}
                    <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>রিয়েল-টাইম জিমেইল ডিসপ্যাচ</span>
                        </span>
                        <span className="text-[10px] bg-indigo-200/60 text-indigo-900 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          {smtpConfig.user || 'smtp.gmail.com'}
                        </span>
                      </div>

                      <a
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>📩 আপনার জিমেইল ইনবক্স খুলুন (Open Gmail Inbox)</span>
                      </a>

                      <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                        💡 ইনবক্সে কোড না পেলে অনুগ্রহ করে আপনার জিমেইলের <strong>Spam</strong> বা <strong>Promotions</strong> ফোল্ডার চেক করুন।
                      </p>
                    </div>

                    {/* Fallback / Offline OTP Helper if active */}
                    {(otpSentData?.otp || otpSentData?.fallbackOtp) && (
                      <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-950 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔑</span>
                          <div>
                            <span className="font-bold">ব্যাকআপ / ডেমো কোড: </span>
                            <span className="font-mono font-black text-sm text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200">
                              {otpSentData.otp || otpSentData.fallbackOtp}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpCode(otpSentData.otp || otpSentData.fallbackOtp)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                        >
                          কোড বসান
                        </button>
                      </div>
                    )}

                    {/* 6-Digit OTP Input Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                        জিমেইল থেকে পাওয়া ৬-ডিজিট কোড লিখুন
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="• • • • • •"
                        className="w-full py-3.5 px-4 rounded-2xl border-2 border-indigo-500 text-3xl font-mono font-black text-center tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 bg-white shadow-sm"
                        autoFocus
                      />

                      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                        <span>মেয়াদ শেষ হতে বাকি: <strong className="text-indigo-600 font-mono">{formatTimer(otpTimer)}</strong></span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendingOtp}
                            className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
                          >
                            <RotateCw className={`w-3 h-3 ${resendingOtp ? 'animate-spin' : ''}`} />
                            <span>{resendingOtp ? 'পাঠানো হচ্ছে...' : 'পুনরায় পাঠান'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSmtpModal(true)}
                            className="text-slate-600 hover:text-indigo-700 font-bold flex items-center gap-1 text-[11px]"
                            title="জিমেইল এসএমটিপি সেটিংস"
                          >
                            <span>⚙️ এসএমটিপি সেটিংস</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit Verification */}
                    <div className="space-y-2.5">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>যাচাই করা হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ওটিপি যাচাই ও অ্যাকাউন্ট তৈরি করুন</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOtpStage('form')}
                        className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors"
                      >
                        ← তথ্য সংশোধন করতে পেছনে যান
                      </button>
                    </div>

                  </form>
                )}

              </div>
            )}

            {/* SIGN IN MODE */}
            {mode === 'signin' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
                
                {/* Google Sign-in via Firebase */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2.5 hover:scale-[1.01]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google অ্যাকাউন্ট দিয়ে লগইন (Firebase Auth)</span>
                  </button>

                  <div className="flex items-center my-3 text-[10px] text-slate-400">
                    <div className="flex-1 border-t border-slate-200"></div>
                    <span className="px-2 font-semibold">অথবা ইমেইল ও পাসওয়ার্ড দিয়ে লগইন</span>
                    <div className="flex-1 border-t border-slate-200"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    জিমেইল বা ইমেইল ঠিকানা (Gmail / Email)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="david.miller@school.edu অথবা tanveer@student.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড (Password)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>লগইন হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>লগইন করুন (Sign In)</span>
                    </>
                  )}
                </button>

                {/* Quick 1-click accounts under sign in */}
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                    অথবা সরাসরি রোলভিত্তিক ডেমো অ্যাকাউন্টে ঢুকুন:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser(users.find(u => u.role === 'admin') || users[0])}
                      className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-left text-xs font-bold text-purple-950 transition-colors flex items-center gap-2 border border-purple-200"
                    >
                      <span className="text-base shrink-0">🛡️</span>
                      <div className="min-w-0 truncate">
                        <div className="font-black text-purple-900 truncate">সিস্টেম অ্যাডমিন</div>
                        <div className="text-[10px] text-purple-700 font-normal truncate">সব কন্ট্রোল ও স্ট্যাটস</div>
                      </div>
                    </button>

                    {/* Teacher */}
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser(users.find(u => u.role === 'teacher') || users[0])}
                      className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-left text-xs font-bold text-indigo-950 transition-colors flex items-center gap-2 border border-indigo-200"
                    >
                      <span className="text-base shrink-0">👨‍🏫</span>
                      <div className="min-w-0 truncate">
                        <div className="font-black text-indigo-900 truncate">ড. রশিদুল করিম</div>
                        <div className="text-[10px] text-indigo-700 font-normal truncate">শিক্ষক / টিউটর</div>
                      </div>
                    </button>

                    {/* Student */}
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser(users.find(u => u.role === 'student') || users[1])}
                      className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-left text-xs font-bold text-emerald-950 transition-colors flex items-center gap-2 border border-emerald-200"
                    >
                      <span className="text-base shrink-0">👨‍🎓</span>
                      <div className="min-w-0 truncate">
                        <div className="font-black text-emerald-900 truncate">তানভীর আহমেদ</div>
                        <div className="text-[10px] text-emerald-700 font-normal truncate">একাদশ শ্রেণী ছাত্র</div>
                      </div>
                    </button>

                    {/* Parent */}
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser(users.find(u => u.role === 'parent') || users[users.length - 1])}
                      className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-left text-xs font-bold text-amber-950 transition-colors flex items-center gap-2 border border-amber-200"
                    >
                      <span className="text-base shrink-0">👨‍👩‍👦</span>
                      <div className="min-w-0 truncate">
                        <div className="font-black text-amber-900 truncate">এলেনা রিভেরা</div>
                        <div className="text-[10px] text-amber-700 font-normal truncate">অভিভাবক প্রোফাইল</div>
                      </div>
                    </button>
                  </div>
                </div>

              </form>
            )}

          </div>
        </div>

      </main>

      {/* REAL GMAIL SMTP SETTINGS MODAL */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
                  <Mail className="w-5 h-5 text-indigo-100" />
                </div>
                <div>
                  <h3 className="font-black text-base">রিয়েল জিমেইল ওটিপি কনফিগারেশন</h3>
                  <p className="text-xs text-indigo-100/90">Google SMTP (smtp.gmail.com) সার্ভিস সেটআপ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSmtpModal(false);
                  setSmtpTestMsg('');
                  setSmtpTestError('');
                }}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSmtp} className="p-6 space-y-4">
              
              {/* Google App Password Guide Card */}
              <div className="bg-indigo-50 border border-indigo-200/90 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>সরাসরি জিমেইলে ওটিপি পেতে ১-মিনিট গাইড:</span>
                  </span>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                  >
                    <span>গুগল পেজ খুলুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  <li>আপনার Google একাউন্টে <strong>2-Step Verification</strong> চালু থাকতে হবে।</li>
                  <li><a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">myaccount.google.com/apppasswords</a> এ যান।</li>
                  <li>অ্যাপের নাম দিন <strong>EduTrack</strong> এবং Generate চাপলে ১৬-সংখ্যার কোড পাবেন।</li>
                  <li>সেই ১৬-সংখ্যার কোডটি নিচের ঘরে বসিয়ে সংরক্ষণ করুন!</li>
                </ol>
              </div>

              {/* Status alerts */}
              {smtpTestMsg && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{smtpTestMsg}</span>
                </div>
              )}
              {smtpTestError && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{smtpTestError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রেরক জিমেইল ঠিকানা (Sender Gmail Account)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  এই জিমেইল অ্যাকাউন্টটি ব্যবহার করে শিক্ষার্থীদের কাছে সরাসরি ভেরিফিকেশন ওটিপি পাঠানো হবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  গুগল ১৬-ডিজিট অ্যাপ পাসওয়ার্ড (Google App Password)
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    required
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono tracking-wider"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    {showSmtpPass ? 'লুকান' : 'দেখুন'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  এটি আপনার স্বাভাবিক গুগল পাসওয়ার্ড নয়, এটি গুগল থেকে তৈরি ১৬-সংখ্যার অ্যাপ পাসওয়ার্ড।
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp || !smtpUser || !smtpPass}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                  <span>{testingSmtp ? 'পরীক্ষা করা হচ্ছে...' : '🧪 সংযোগ টেস্ট করুন'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSmtpModal(false);
                      setSmtpTestMsg('');
                      setSmtpTestError('');
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={savingSmtp || !smtpUser || !smtpPass}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingSmtp ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>সংরক্ষণ ও প্রয়োগ করুন</span>
                  </button>
                </div>
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

      {/* Server Config Modal */}
      <ServerConfigModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
      />

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-white/5 z-10">
        © 2026 EduTrack Bangladesh • SSLCommerz Merchant Verified • Gmail Security Two-Factor Auth
      </footer>

    </div>
  );
}
