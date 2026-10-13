import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, ExternalLink, Search, Plus, 
  BookOpen, CheckCircle2, ShieldCheck, Tag, Sparkles, 
  GraduationCap, RefreshCw, Trash2, X, FolderOpen,
  UploadCloud, Flame, CheckCircle, Paperclip
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { uploadFileToFirebase, isFirebaseConfigured } from '../firebase';
import { autoBackupRecord } from '../firestoreSync';

export default function StudyNotesView({ classes = [] }) {
  const { isTeacher, currentUser, lang } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('উচ্চতর গণিত');
  const [newChapter, setNewChapter] = useState('');
  const [newClassId, setNewClassId] = useState(classes?.[0]?.id || 'cls-1');
  const [newDesc, setNewDesc] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('2.4 MB');

  // Firebase Storage File Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const loadNotes = async () => {
    try {
      setLoading(true);
      const list = await api.getStudyNotes({ search: search || undefined });
      setNotes(list);
    } catch (err) {
      console.error('Failed to load study notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [search]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadedFileName(file.name);

    // Auto-fill title if empty
    if (!newTitle) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setNewTitle(baseName.replace(/[-_]/g, ' '));
    }

    try {
      const res = await uploadFileToFirebase(file, 'study_notes', (p) => {
        setUploadProgress(p.progress);
      });
      setNewFileUrl(res.downloadUrl);
      setNewFileSize(res.fileSize);
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'Firebase Storage এ ফাইল আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newTitle || !newSubject) return;

    try {
      const notePayload = {
        title: newTitle,
        subject: newSubject,
        chapter: newChapter || 'সাধারন হ্যান্ডনোট',
        classId: newClassId,
        authorName: currentUser?.name || 'টিউটর',
        description: newDesc,
        fileType: 'pdf',
        fileSize: newFileSize || '2.0 MB',
        fileUrl: newFileUrl || 'https://ocw.mit.edu/courses/res-18-001-calculus-fall-2023/resources/formula-sheet.pdf'
      };

      const created = await api.createStudyNote(notePayload);
      
      // Auto-backup to Cloud Firestore
      autoBackupRecord('studyNotes', { ...notePayload, id: created?.id || `note_${Date.now()}` });

      setShowUploadModal(false);
      setNewTitle('');
      setNewChapter('');
      setNewDesc('');
      setNewFileUrl('');
      setUploadedFileName('');
      loadNotes();
    } catch (err) {
      console.error('Failed to create study note:', err);
    }
  };

  const handleDeleteNote = async (id, title) => {
    if (!window.confirm(`আপনি কি "${title}" নোটটি মুছে ফেলতে চান?`)) return;
    try {
      await api.deleteStudyNote(id);
      loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (selectedSubject !== 'all' && n.subject !== selectedSubject) return false;
    return true;
  });

  const subjects = ['all', 'উচ্চতর গণিত', 'পদার্থবিজ্ঞান', 'Test Prep'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'bn' ? 'স্টাডি রিসোর্স' : 'Study Resources'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {lang === 'bn' ? 'নোটস ও লেকচার শিট' : 'Notes & Handouts'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              {lang === 'bn'
                ? 'অধ্যায়ভিত্তিক নোটস, ফর্মুলা শিট ও লেকচার হ্যান্ডআউট। সরাসরি ব্রাউজ বা ডাউনলোড করুন।'
                : 'Download lecture notes, formula sheets and handouts.'}
            </p>
          </div>

          {isTeacher && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? '+ নোট আপলোড' : '+ Upload Note'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Subject Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নোটের শিরোনাম, বিষয় বা অধ্যায় খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {sub === 'all' ? 'সকল বিষয় (All)' : sub}
            </button>
          ))}

          <button
            onClick={loadNotes}
            title="রিফ্রেশ"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">স্টাডি নোটস লোড হচ্ছে...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                      {note.subject}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      ভেরিফাইড
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                    PDF • {note.fileSize || '2.4 MB'}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1.5 leading-snug">
                  {note.title}
                </h3>

                <p className="text-xs font-semibold text-slate-500 mb-2">
                  📌 {note.chapter}
                </p>

                {note.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {note.description}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                <div className="text-[11px] text-slate-400">
                  <span>তৈরি করেছেন: <strong className="text-slate-700">{note.authorName}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {isTeacher && (
                    <button
                      onClick={() => handleDeleteNote(note.id, note.title)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="নোট মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ডাউনলোড ও দেখুন</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">কোনো স্টাডি নোট পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 mt-1">অন্য কোনো বিষয়ে খুঁজুন অথবা নতুন স্টাডি নোট যোগ করুন।</p>
        </div>
      )}

      {/* UPLOAD NOTE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>নতুন স্টাডি নোট বা লেকচার শিট আপলোড</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নোটের শিরোনাম (Title) *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="যেমন: ক্যালকুলাস যৌগজীকরণ ফর্মুলা শিট"
                  required
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">বিষয় (Subject)</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="উচ্চতর গণিত">উচ্চতর গণিত</option>
                    <option value="পদার্থবিজ্ঞান">পদার্থবিজ্ঞান</option>
                    <option value="Test Prep">Test Prep (SAT/ACT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">অধ্যায় / চ্যাপ্টার</label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="যেমন: অধ্যায় ৯: অন্তরীকরণ"
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ (Description)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="নোটের মধ্যে কী কী টপিক ও শর্টকাট রয়েছে..."
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Firebase Cloud Storage Direct File Uploader */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Firebase Storage এ ফাইল আপলোড (PDF / Docs)</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/60 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Cloud Storage
                  </span>
                </div>

                <div className="relative border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white/70 rounded-xl p-3.5 text-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UploadCloud className={`w-6 h-6 ${uploadingFile ? 'text-amber-500 animate-bounce' : 'text-slate-400 group-hover:text-amber-600'} transition-colors`} />
                    <p className="text-xs font-bold text-slate-700">
                      {uploadedFileName ? `নির্বাচিত ফাইল: ${uploadedFileName}` : 'ফাইল আপলোড করতে ক্লিক বা ড্র্যাগ করুন'}
                    </p>
                    <p className="text-[10px] text-slate-400">PDF, Word Document, PowerPoint বা ইমেজ (সর্বোচ্চ 25MB)</p>
                  </div>
                </div>

                {/* Upload Progress Bar */}
                {uploadingFile && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>ক্লাউডে আপলোড হচ্ছে...</span>
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Success Alert */}
                {newFileUrl && !uploadingFile && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">ফাইল সফলভাবে Firebase Storage এ আপলোড হয়েছে! ({newFileSize})</span>
                  </div>
                )}

                {uploadError && (
                  <div className="text-[11px] font-semibold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                    ⚠️ {uploadError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">অথবা ফাইল ড্রাইভ / সরাসরি URL</label>
                  <input
                    type="url"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    placeholder="https://firebasestorage.googleapis.com/..."
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ফাইলের সাইজ (Size)</label>
                  <input
                    type="text"
                    value={newFileSize}
                    onChange={(e) => setNewFileSize(e.target.value)}
                    placeholder="2.5 MB"
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/30"
                >
                  সংরক্ষণ ও পাবলিশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
