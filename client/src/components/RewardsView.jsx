import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, Award, Gift, Sparkles, CheckCircle2, 
  Tag, ArrowRight, ShieldCheck, Star, Users, Plus, Check, ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function RewardsView({ students = [], onRefreshInvoices }) {
  const { currentUser, isTeacher, isParent, activeStudent } = useAuth();
  const [rewardsList, setRewardsList] = useState([]);
  const [currentStudentReward, setCurrentStudentReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingVoucherId, setClaimingVoucherId] = useState(null);
  const [awardModalOpen, setAwardModalOpen] = useState(false);

  // Teacher award form
  const [awardStudentId, setAwardStudentId] = useState('student-1');
  const [awardXp, setAwardXp] = useState('100');
  const [awardReason, setAwardReason] = useState('সাপ্তাহিক কুইজে শতভাগ সঠিক উত্তরের জন্য');
  const [awardBadgeName, setAwardBadgeName] = useState('Math Prodigy (গণিত প্রতিভা)');

  const targetStudentId = isTeacher ? 'student-1' : (activeStudent?.id || currentUser?.id || 'student-1');

  const loadRewards = async () => {
    try {
      setLoading(true);
      const [allRewards, single] = await Promise.all([
        api.getRewards(),
        api.getRewards(targetStudentId)
      ]);
      setRewardsList(allRewards || []);
      setCurrentStudentReward(single);
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, [targetStudentId]);

  const handleClaimVoucher = async (voucher) => {
    if (voucher.claimed) return;
    if ((currentStudentReward?.xp || 0) < voucher.xpCost) {
      alert(`⚠️ পর্যাপ্ত এক্সপি (XP) পয়েন্ট নেই! এই ভাউচারের জন্য ${voucher.xpCost} XP প্রয়োজন। আপনার আছে ${currentStudentReward?.xp || 0} XP।`);
      return;
    }

    if (!window.confirm(`আপনি কি "${voucher.title}" রিডিম করতে চান? আপনার একাউন্ট থেকে ${voucher.xpCost} XP কর্তন হবে।`)) return;

    setClaimingVoucherId(voucher.id);
    try {
      const res = await api.claimRewardVoucher(targetStudentId, voucher.id);
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        alert(`🎉 ${res.message}\n${res.appliedInvoice ? `* বকেয়া ইনভয়েসে স্বয়ংক্রিয়ভাবে ৳${voucher.discountAmount} সমন্বয় করা হয়েছে!` : ''}`);
        await loadRewards();
        if (onRefreshInvoices) onRefreshInvoices();
      } else {
        alert(res.error || 'ভাউচার রিডিম করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Voucher claim error:', err);
    } finally {
      setClaimingVoucherId(null);
    }
  };

  const handleAwardXpSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.awardRewardXP(
        awardStudentId,
        Number(awardXp),
        awardReason,
        awardBadgeName ? {
          name: awardBadgeName,
          nameBn: awardBadgeName,
          icon: 'Award',
          color: 'indigo',
          description: awardReason
        } : null
      );
      setAwardModalOpen(false);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      alert('🎉 সফলভাবে শিক্ষার্থীকে এক্সপি (XP) পয়েন্ট এবং ব্যাজ প্রদান করা হয়েছে!');
      await loadRewards();
    } catch (err) {
      console.error('Award error:', err);
    }
  };

  const xpProgress = Math.min(100, Math.round(((currentStudentReward?.xp || 0) / 1500) * 100));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>পারফরম্যান্স ভিত্তিক রিওয়ার্ড ও পয়েন্ট সিস্টেম (Rewards & XP)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            স্টাডি রিওয়ার্ডস, ব্যাজ ও স্কলারশিপ শপ
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            নিয়মিত ক্লাসে উপস্থিতি, সময়মতো হোমওয়ার্ক জমা এবং মক টেস্টে শীর্ষ ফলাফলের মাধ্যমে এক্সপি অর্জন করুন 
            এবং সরাসরি টিউশন ফি ডিসকাউন্ট ভাউচার ও ডিজিটাল সম্মাননা রিডিম করুন!
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setAwardModalOpen(true)}
            className="px-5 py-2.5 bg-white text-orange-900 hover:bg-amber-50 rounded-2xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-orange-600" />
            <span>শিক্ষার্থীকে XP ও ব্যাজ প্রদান করুন</span>
          </button>
        )}
      </div>

      {/* Student XP & Level Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-500/20">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {currentStudentReward?.student?.name || (activeStudent?.name || 'তানভীর আহমেদ')}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {currentStudentReward?.level || 'Gold Scholar (স্বর্ণ স্কলার)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                লিডারবোর্ড রেঙ্ক: <strong className="text-indigo-600">#{currentStudentReward?.rank || 1}ম স্থান</strong>
              </p>
            </div>
          </div>

          {/* Streak Indicator Pill */}
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">স্টাডি স্ট্রিক</span>
              <span className="text-sm font-black text-orange-950">
                {currentStudentReward?.streakDays || 9} দিন টানা সক্রিয় 🔥
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar to next Tier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>মোট অর্জিত পয়েন্ট: <strong className="text-slate-900 text-base">{currentStudentReward?.xp || 1450} XP</strong></span>
            </span>
            <span className="text-indigo-600">
              পরবর্তী স্তর: Platinum Scholar (১৫০০ XP)
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 rounded-full transition-all duration-1000"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>০ XP (Bronze)</span>
            <span>৫০০ XP (Silver)</span>
            <span>১০০০ XP (Gold)</span>
            <span>১৫০০ XP (Platinum)</span>
          </div>
        </div>
      </div>

      {/* Badges Showcase Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>অর্জিত সম্মাননা ও ব্যাজ (Achievement Badges)</span>
          </h3>
          <span className="text-xs text-slate-500 font-bold">
            {(currentStudentReward?.badges || []).length}টি আনলকড
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(currentStudentReward?.badges || []).map(badge => (
            <div
              key={badge.id}
              className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white hover:border-indigo-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md shadow-indigo-600/20">
                  {badge.name.includes('Attendance') ? '🔥' : badge.name.includes('Calculus') ? '📐' : badge.name.includes('Homework') ? '⚡' : '💡'}
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {badge.earnedAt}
                </span>
              </div>

              <div>
                <h4 className="font-black text-xs text-slate-900 leading-snug">
                  {badge.nameBn || badge.name}
                </h4>
                <p className="text-[10px] text-indigo-600 font-bold">{badge.name}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Split: Perks/Fee Voucher Store & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Redeemable Perks Store */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange-600" />
                <span>টিউশন ফি ডিসকাউন্ট ভাউচার ও স্কলারশিপ শপ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার অর্জিত XP খরচ করে টিউশন ফি ডিসকাউন্ট অথবা বিশেষ ডাউট ক্লাস রিডিম করুন
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(currentStudentReward?.vouchers || []).map(voucher => {
              const canAfford = (currentStudentReward?.xp || 0) >= voucher.xpCost;
              const isClaimed = voucher.claimed;

              return (
                <div
                  key={voucher.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isClaimed
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : canAfford
                      ? 'bg-gradient-to-br from-amber-50/60 to-white border-amber-200 hover:border-amber-400 shadow-sm'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                        {voucher.xpCost} XP প্রয়োজন
                      </span>
                      {isClaimed && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> রিডিমড
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      {voucher.title}
                    </h4>

                    {voucher.discountAmount > 0 && (
                      <p className="text-xs text-emerald-700 font-bold">
                        * ইনভয়েসে ৳{voucher.discountAmount} স্বয়ংক্রিয় ছাড় কার্যকর হবে
                      </p>
                    )}
                    {voucher.code && (
                      <p className="text-[11px] font-mono text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 inline-block">
                        কোড: {voucher.code}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleClaimVoucher(voucher)}
                    disabled={isClaimed || claimingVoucherId === voucher.id}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      isClaimed
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {isClaimed 
                        ? 'ইতিমধ্যে ক্লেইম করা হয়েছে' 
                        : claimingVoucherId === voucher.id 
                        ? 'রিডিম হচ্ছে...' 
                        : canAfford 
                        ? 'পয়েন্ট দিয়ে কুপন রিডিম করুন' 
                        : `আরো ${voucher.xpCost - (currentStudentReward?.xp || 0)} XP লাগবে`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Student Leaderboard */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>সেরা শিক্ষার্থী লিডারবোর্ড</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">টপ ৩</span>
          </div>

          <div className="space-y-2.5">
            {rewardsList.map((item, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
              const isCurrent = item.studentId === targetStudentId;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{medal}</span>
                    <div>
                      <p className="font-bold text-xs text-slate-900 leading-tight">
                        {item.student?.name || 'শিক্ষার্থী'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {item.level?.split('(')[0] || 'Scholar'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-700 block">
                      {item.xp || 0} XP
                    </span>
                    <span className="text-[10px] text-orange-600 font-bold">
                      🔥 {item.streakDays || 1} দিন স্ট্রিক
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
            💡 <strong>কীভাবে এক্সপি অর্জন করবেন:</strong> প্রতিটি ক্লাসে নিয়মিত উপস্থিতিতে ৫০ XP, হোমওয়ার্ক জমা দিলে ৮০ XP এবং মক টেস্টে শীর্ষ স্কোরে ২০০ XP যুক্ত হয়।
          </div>
        </div>

      </div>

      {/* TEACHER AWARD MODAL */}
      {awardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>শিক্ষার্থীকে এক্সপি (XP) ও ব্যাজ প্রদান</span>
              </h3>
              <button
                onClick={() => setAwardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAwardXpSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">শিক্ষার্থী নির্বাচন করুন</label>
                <select
                  value={awardStudentId}
                  onChange={e => setAwardStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="student-1">তানভীর আহমেদ (Alex Rivera)</option>
                  <option value="student-2">নুসরাত জাহান (Emily Zhang)</option>
                  <option value="student-3">ফারহান কবির (Liam Vance)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রদেয় XP পয়েন্ট</label>
                <input
                  type="number"
                  required
                  value={awardXp}
                  onChange={e => setAwardXp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ব্যাজের নাম (Badge Title)</label>
                <input
                  type="text"
                  value={awardBadgeName}
                  onChange={e => setAwardBadgeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">অর্জনের বিবরণ / কারণ</label>
                <textarea
                  rows="2"
                  value={awardReason}
                  onChange={e => setAwardReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAwardModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  XP ও ব্যাজ দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
