import React, { useState, useEffect } from 'react';
import { 
  X, Star, CheckCircle2, MessageSquare, ThumbsUp, 
  Send, Sparkles, User, Award, ShieldCheck, Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TeacherReviewsModal({ isOpen, onClose, teacher, onReviewAdded }) {
  if (!isOpen || !teacher) return null;

  const { currentUser, lang } = useAuth();
  const isStudentOrParent = currentUser?.role === 'student' || currentUser?.role === 'parent';

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: teacher.rating || 5.0,
    totalReviews: teacher.reviewCount || 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Review Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState(teacher.subjects?.[0] || 'উচ্চতর গণিত ও পদার্থবিজ্ঞান');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await api.getReviews(teacher.id);
      if (res && res.reviews) {
        setReviews(res.reviews);
        setStats({
          averageRating: res.averageRating || teacher.rating || 5.0,
          totalReviews: res.totalReviews || res.reviews.length,
          breakdown: res.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
    } catch (err) {
      console.warn('Error fetching teacher reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [teacher.id]);

  const ratingDescriptions = {
    5: lang === 'bn' ? 'অসাধারণ ও সেরা পাঠদান (Outstanding)' : 'Outstanding Teaching (5 Stars)',
    4: lang === 'bn' ? 'খুব ভালো ও যত্নবান (Very Good)' : 'Very Good (4 Stars)',
    3: lang === 'bn' ? 'সন্তোষজনক পাঠদান (Good)' : 'Good (3 Stars)',
    2: lang === 'bn' ? 'আরও উন্নতি প্রয়োজন (Average)' : 'Needs Improvement (2 Stars)',
    1: lang === 'bn' ? 'সন্তোষজনক নয় (Poor)' : 'Poor Experience (1 Star)'
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError('');

    if (!comment.trim() || comment.trim().length < 5) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে কমপক্ষে ৫ অক্ষরের বিস্তারিত মন্তব্য লিখুন।' : 'Please write at least 5 characters of feedback.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        teacherId: teacher.id,
        studentId: currentUser?.id || 'student-1',
        studentName: currentUser?.name || 'তানভীর আহমেদ',
        studentAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
        rating: Number(rating),
        subject: subject.trim() || 'টিউশন পাঠদান',
        comment: comment.trim()
      };

      const res = await api.createReview(payload);
      if (res && res.success) {
        setSubmitSuccess(true);
        setComment('');
        
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Reload fresh reviews
        await loadReviews();
        if (onReviewAdded) onReviewAdded(res);

        setTimeout(() => setSubmitSuccess(false), 4000);
      } else {
        setError(res?.error || 'রিভিউ জমা দেওয়া সম্ভব হয়নি।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ ত্রুটি হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <img 
              src={teacher.avatar} 
              alt={teacher.name} 
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-amber-400/80 shadow-md shrink-0" 
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {teacher.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {teacher.badge || (lang === 'bn' ? 'ভেরিফাইড এক্সপার্ট' : 'Verified Tutor')}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {teacher.title || (lang === 'bn' ? 'প্রাইভেট টিউটর ও শিক্ষক' : 'Private Tutor')}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">

          {/* Rating Summary Scorecard */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            
            {/* Score circle */}
            <div className="text-center sm:text-left shrink-0">
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                  {stats.averageRating}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 5.0</span>
              </div>

              {/* Golden Stars */}
              <div className="flex items-center gap-1 justify-center sm:justify-start mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      star <= Math.round(stats.averageRating)
                        ? 'text-amber-400 fill-amber-400' 
                        : 'text-slate-300'
                    }`} 
                  />
                ))}
              </div>

              <p className="text-xs text-slate-500 font-medium mt-1.5">
                {lang === 'bn' 
                  ? `মোট ${stats.totalReviews} জন শিক্ষার্থীর মূল্যায়ন` 
                  : `Based on ${stats.totalReviews} student reviews`}
              </p>
            </div>

            {/* Breakdown progress bars */}
            <div className="w-full flex-1 space-y-1.5 text-xs">
              {[5, 4, 3, 2, 1].map((st) => {
                const count = stats.breakdown?.[st] || 0;
                const percentage = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
                return (
                  <div key={st} className="flex items-center gap-2 text-slate-600">
                    <span className="w-10 font-bold flex items-center gap-0.5 shrink-0 text-[11px]">
                      <span>{st}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[10px] text-slate-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Review Submission Form for Students / Parents */}
          {isStudentOrParent ? (
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'শিক্ষককে স্টার রেটিং ও রিভিউ দিন' : 'Rate & Review This Tutor'}</span>
                </h4>
                <span className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                  {currentUser?.name}
                </span>
              </div>

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{lang === 'bn' ? 'ধন্যবাদ! আপনার রিভিউটি সফলভাবে প্রকাশিত হয়েছে।' : 'Thank you! Your review has been posted successfully.'}</span>
                </div>
              )}

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-3">
                
                {/* Clickable 5-Star Rating Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'bn' ? 'আপনার রেটিং সিলেক্ট করুন:' : 'Select Your Rating:'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = (hoverRating || rating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1.5 rounded-lg hover:bg-amber-100/60 transition-transform active:scale-90"
                        >
                          <Star 
                            className={`w-7 h-7 transition-colors ${
                              isActive 
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm' 
                                : 'text-slate-300'
                            }`} 
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-bold text-amber-700 ml-2">
                      {ratingDescriptions[hoverRating || rating]}
                    </span>
                  </div>
                </div>

                {/* Subject / Course */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পঠিত বিষয় / কোর্স:' : 'Subject / Course:'}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="উদা: উচ্চতর গণিত ও পদার্থবিজ্ঞান"
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'আপনার পর্যালোচনা বা অভিজ্ঞতা লিখুন:' : 'Your Detailed Feedback:'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={lang === 'bn' ? 'শিক্ষকের পড়ানোর ধরণ, সময়নিষ্ঠতা এবং আপনার পড়াশোনার উন্নতির বিষয়ে মতামত জানান...' : 'Share how the teacher helped in your studies, their punctuality, clarity...'}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? (lang === 'bn' ? 'রিভিউ জমা হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? 'রিভিউ ও রেটিং সাবমিট করুন' : 'Submit Review & Rating')}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-500">
              💡 {lang === 'bn' ? 'শিক্ষার্থীদের দেওয়া রেটিং ও রিভিউ এখানে প্রদর্শিত হচ্ছে।' : 'Student ratings & reviews are displayed below.'}
            </div>
          )}

          {/* Student Reviews List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>{lang === 'bn' ? 'শিক্ষার্থীদের রিভিউসমূহ' : 'Student Reviews'} ({reviews.length})</span>
              <span className="text-[11px] font-normal text-slate-400">
                {lang === 'bn' ? 'যাচাইকৃত শিক্ষার্থী' : 'Verified Students'}
              </span>
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                রিভিউ লোড হচ্ছে...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                এখনো কোনো রিভিউ যোগ করা হয়নি। প্রথম রিভিউটি আপনি দিন!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-xl shadow-sm space-y-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={rev.studentAvatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0" 
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{rev.studentName}</span>
                            <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-100">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>{lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rev.subject || 'টিউশন পাঠদান'} • {new Date(rev.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Review Star Count */}
                      <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-amber-800 font-mono">
                          {rev.rating}.0
                        </span>
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-xs text-slate-600 leading-relaxed pl-10 italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>EduTrack বিশ্বস্ত টিউটর মূল্যায়ন ব্যবস্থা</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
}
