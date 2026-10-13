import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Clock, FileText, CheckCircle2, 
  ExternalLink, Send, Award, MessageCircle, AlertCircle, FileSpreadsheet,
  UploadCloud, Flame, CheckCircle
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { uploadFileToFirebase } from '../firebase';
import { autoBackupRecord } from '../firestoreSync';

export default function AssignmentsView({ classes, onOpenReport }) {
  const { currentUser, isTeacher, lang } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(null); // assignment object
  const [showGradeModal, setShowGradeModal] = useState(null); // submission object

  // Create Assignment Form
  const [newTitle, setNewTitle] = useState('');
  const [newClassId, setNewClassId] = useState(classes?.[0]?.id || '');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [newMaxScore, setNewMaxScore] = useState(100);
  const [newResourceLink, setNewResourceLink] = useState('');

  // Submit Homework Form
  const [submitText, setSubmitText] = useState('');
  const [submitFile, setSubmitFile] = useState('');
  const [uploadingHw, setUploadingHw] = useState(false);
  const [uploadHwProgress, setUploadHwProgress] = useState(0);
  const [uploadHwFileName, setUploadHwFileName] = useState('');

  // Grade Form
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const handleHomeworkFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHw(true);
    setUploadHwProgress(0);
    setUploadHwFileName(file.name);

    try {
      const res = await uploadFileToFirebase(file, 'homework_submissions', (p) => {
        setUploadHwProgress(p.progress);
      });
      setSubmitFile(res.downloadUrl);
    } catch (err) {
      console.error('Homework upload failed:', err);
      alert('Firebase Storage এ ফাইল আপলোড ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setUploadingHw(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [asgList, subList] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions()
      ]);
      setAssignments(asgList);
      setSubmissions(subList);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classes]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle || !newClassId) return;

    try {
      const payload = {
        classId: newClassId,
        teacherId: currentUser.id,
        title: newTitle,
        description: newDesc,
        dueDate: `${newDueDate}T23:59:00Z`,
        maxScore: Number(newMaxScore),
        resourceLink: newResourceLink || null
      };
      const res = await api.createAssignment(payload);
      autoBackupRecord('assignments', { ...payload, id: res?.id || `asg_${Date.now()}` });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      loadData();
    } catch (err) {
      console.error('Failed to create assignment:', err);
    }
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!showSubmitModal || !currentUser) return;

    try {
      const subPayload = {
        assignmentId: showSubmitModal.id,
        studentId: currentUser.id,
        submissionText: submitText,
        fileUrl: submitFile || `${currentUser.name.replace(/\s+/g, '-').toLowerCase()}-solution.pdf`
      };
      const res = await api.submitAssignment(subPayload);
      autoBackupRecord('assignments', { ...subPayload, id: res?.id || `sub_${Date.now()}` });
      setShowSubmitModal(null);
      setSubmitText('');
      setSubmitFile('');
      setUploadHwFileName('');
      loadData();
    } catch (err) {
      console.error('Failed to submit assignment:', err);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!showGradeModal) return;

    try {
      await api.gradeSubmission(showGradeModal.id, gradeScore, gradeFeedback);
      setShowGradeModal(null);
      setGradeScore('');
      setGradeFeedback('');
      loadData();
    } catch (err) {
      console.error('Failed to grade submission:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'bn' ? 'হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Homework & Tasks'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'টাস্ক জমা দিন, ডেডলাইন দেখুন এবং শিক্ষকের মূল্যায়ন চেক করুন'
              : 'Track deadlines, submit assignments, and review feedback'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenReport && (
            <button
              onClick={() => onOpenReport(null, null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'bn' ? 'মাসিক রিপোর্ট' : 'Reports'}</span>
            </button>
          )}

          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-300" />
              <span>{lang === 'bn' ? '+ নতুন হোমওয়ার্ক' : '+ New Task'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Assignment List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.map(asg => {
          // Check student submission
          const mySubmission = submissions.find(
            s => s.assignmentId === asg.id && s.studentId === currentUser?.id
          );
          const classInfo = asg.class;
          const isOverdue = new Date(asg.dueDate) < new Date();

          return (
            <div
              key={asg.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-lg">
                    {classInfo?.title || 'Course Batch'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due {new Date(asg.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1.5">{asg.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {asg.description}
                </p>

                {asg.resourceLink && (
                  <a
                    href={asg.resourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold mb-4"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Reference Material / Worksheet
                  </a>
                )}
              </div>

              {/* Status & Actions Area */}
              <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block">Maximum Marks</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">{asg.maxScore} pts</span>
                </div>

                {isTeacher ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {asg.submissionCount || 0} Submissions
                    </span>
                  </div>
                ) : (
                  <div>
                    {mySubmission ? (
                      <div className="text-right">
                        {mySubmission.status === 'graded' ? (
                          <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Score: {mySubmission.score} / {asg.maxScore}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            Submitted (Pending Review)
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSubmitModal(asg)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Submit Solution
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions Review Table (for Teachers) */}
      {isTeacher && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Student Homework Submissions</h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
              {submissions.length} Turn-ins
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-6">Assignment</th>
                  <th className="py-3 px-6">Submitted Date</th>
                  <th className="py-3 px-6">Score</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-6 font-bold text-slate-800">
                      {sub.student?.name || 'Student'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {sub.assignment?.title || 'Homework'}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono">
                      {sub.status === 'graded' ? (
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {sub.score} pts
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium">Ungraded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setShowGradeModal(sub);
                          setGradeScore(sub.score || '');
                          setGradeFeedback(sub.feedback || '');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        {sub.status === 'graded' ? 'Update Grade' : 'Grade & Feedback'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Post New Homework Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch</label>
                <select
                  value={newClassId}
                  onChange={e => setNewClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 5: Law of Gravitation Drills"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Enter problem numbers and detailed guidelines..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={newMaxScore}
                    onChange={e => setNewMaxScore(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Submit Homework</h3>
            <p className="text-xs text-slate-500 mb-4">{showSubmitModal.title}</p>
            <form onSubmit={handleSubmitHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Answers / Solution Notes</label>
                <textarea
                  rows={4}
                  value={submitText}
                  onChange={e => setSubmitText(e.target.value)}
                  placeholder="Type your answers, step derivations, or remarks..."
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              {/* Firebase Cloud Storage File Uploader for Homework */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Firebase Storage এ হোমওয়ার্ক ফাইল আপলোড</span>
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    Storage
                  </span>
                </div>

                <div className="relative border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white rounded-lg p-3 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleHomeworkFileUpload}
                    disabled={uploadingHw}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UploadCloud className={`w-5 h-5 ${uploadingHw ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                    <p className="text-xs font-bold text-slate-700">
                      {uploadHwFileName ? `নির্বাচিত ফাইল: ${uploadHwFileName}` : 'সমাধান খাতা / PDF আপলোড করতে ক্লিক করুন'}
                    </p>
                    <p className="text-[10px] text-slate-400">PDF বা খাতার ছবি (JPG/PNG)</p>
                  </div>
                </div>

                {uploadingHw && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-amber-900">
                      <span>আপলোড হচ্ছে...</span>
                      <span>{uploadHwProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-200" style={{ width: `${uploadHwProgress}%` }} />
                    </div>
                  </div>
                )}

                {submitFile && !uploadingHw && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-bold truncate">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">ফাইল ক্লাউডে আপলোড সম্পন্ন হয়েছে!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">অথবা ফাইল ড্রাইভ লিংক / ফাইলের নাম</label>
                <input
                  type="text"
                  value={submitFile}
                  onChange={e => setSubmitFile(e.target.value)}
                  placeholder="e.g. https://firebasestorage... or alex-calculus.pdf"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl"
                >
                  Turn In Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADE SUBMISSION MODAL */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Grade Submission</h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <strong>{showGradeModal.student?.name}</strong> • File: {showGradeModal.fileUrl}
            </p>

            <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs text-slate-700 border border-slate-200">
              <span className="font-semibold block mb-1 text-slate-500">Student Solution:</span>
              <p className="whitespace-pre-wrap">{showGradeModal.submissionText}</p>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Score Awarded</label>
                <input
                  type="number"
                  value={gradeScore}
                  onChange={e => setGradeScore(e.target.value)}
                  required
                  placeholder="e.g. 95"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tutor Feedback & Suggestions</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={e => setGradeFeedback(e.target.value)}
                  placeholder="Provide praise and constructive feedback..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
