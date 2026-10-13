import React, { useState, useEffect } from 'react';
import { Award, Plus, Calendar, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function GradebookView({ classes, students }) {
  const { currentUser, isTeacher } = useAuth();
  const [examMarks, setExamMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [classId, setClassId] = useState(classes?.[0]?.id || '');
  const [studentId, setStudentId] = useState(students?.[0]?.id || '');
  const [examTitle, setExamTitle] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [obtainedMarks, setObtainedMarks] = useState(90);
  const [remarks, setRemarks] = useState('Grade A+ • Strong performance');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

  const loadExamMarks = async () => {
    try {
      setLoading(true);
      const params = isTeacher ? {} : { studentId: currentUser?.id };
      const data = await api.getExamMarks(params);
      setExamMarks(data);
    } catch (err) {
      console.error('Failed to load exam marks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamMarks();
  }, [currentUser, isTeacher]);

  const handleAddMarks = async (e) => {
    e.preventDefault();
    if (!examTitle || !classId || !studentId) return;

    try {
      await api.addExamMark({
        classId,
        studentId,
        examTitle,
        maxMarks: Number(maxMarks),
        obtainedMarks: Number(obtainedMarks),
        examDate,
        remarks
      });
      setShowAddModal(false);
      setExamTitle('');
      loadExamMarks();
    } catch (err) {
      console.error('Failed to record exam marks:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Exam Marks & Gradebook</h2>
          <p className="text-xs text-slate-500">Record mock tests, chapter quizzes, and track academic mastery</p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Test Score
          </button>
        )}
      </div>

      {/* Grade Cards List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {examMarks.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No exam scores recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Exam / Test</th>
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-6">Class / Subject</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-center">Score</th>
                  <th className="py-3 px-6">Performance Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examMarks.map(item => {
                  const pct = Math.round((item.obtainedMarks / item.maxMarks) * 100);
                  const isHigh = pct >= 90;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {item.examTitle}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.student?.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span className="font-semibold text-slate-800">{item.student?.name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600">
                        {item.class?.title}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                        {item.examDate}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl font-mono">
                          <span className={`font-bold ${isHigh ? 'text-emerald-600 text-base' : 'text-slate-800'}`}>
                            {item.obtainedMarks}
                          </span>
                          <span className="text-slate-400 text-xs">/ {item.maxMarks}</span>
                          <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-bold ml-1">
                            {pct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium inline-block">
                          {item.remarks}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD MARKS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Record Test / Exam Score</h3>
            <p className="text-xs text-slate-500 mb-4">Add evaluated marks and notes to student gradebook</p>

            <form onSubmit={handleAddMarks} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
                <select
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam / Quiz Name</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Quadratic Formulas & Polynomials"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marks Obtained</label>
                  <input
                    type="number"
                    value={obtainedMarks}
                    onChange={e => setObtainedMarks(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={e => setMaxMarks(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback / Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Grade A+ • Clean solution to section B"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Save Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
