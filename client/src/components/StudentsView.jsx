import React, { useState } from 'react';
import { 
  Users, Phone, Mail, Award, BookOpen, DollarSign, 
  Plus, MessageSquare, CheckCircle, Calendar, GraduationCap, Trash2, FileSpreadsheet 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { autoBackupRecord, autoDeleteRecord } from '../firestoreSync';

export default function StudentsView({ students, enrollments, invoices, classes, onSelectChat, onOpenReport }) {
  const { isTeacher, formatMoney } = useAuth();
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('Grade 11');
  const [bio, setBio] = useState('');

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove student "${studentName}" from the academy? This will also remove their course enrollments and delete from Firebase.`)) return;

    try {
      await api.deleteUser(studentId);
      await autoDeleteRecord('users', studentId);
      window.location.reload();
    } catch (err) {
      console.error('Failed to remove student:', err);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      const payload = {
        name,
        email,
        phone,
        grade,
        bio,
        role: 'student'
      };
      const created = await api.createUser(payload);
      if (created) {
        autoBackupRecord('users', created);
      }
      setShowAddStudentModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to create student:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Student Directory & Profiles</h2>
          <p className="text-xs text-slate-500">Track enrolled students, guardians, academic progress, and fee records</p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>
        )}
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {students.map(student => {
          const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
          const studentInvoices = invoices.filter(i => i.studentId === student.id);
          const pendingDues = studentInvoices
            .filter(i => i.status === 'pending' || i.status === 'overdue')
            .reduce((s, i) => s + Number(i.amount || 0), 0);
          const totalPaid = studentInvoices
            .filter(i => i.status === 'paid')
            .reduce((s, i) => s + Number(i.amount || 0), 0);

          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-50 shadow-sm"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{student.name}</h3>
                    <p className="text-xs font-semibold text-indigo-600">{student.grade || 'High School'}</p>
                    <p className="text-[11px] text-slate-400">{student.email}</p>
                  </div>
                </div>

                {student.bio && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 italic">
                    "{student.bio}"
                  </p>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl mb-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Enrolled Batches</span>
                    <span className="font-bold text-slate-800">{studentEnrollments.length} Subjects</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Tuition Dues</span>
                    <span className={`font-bold font-mono ${pendingDues > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatMoney(pendingDues)}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between">
                    <span className="text-slate-400 text-[11px]">Total Settled:</span>
                    <span className="font-bold text-emerald-700 font-mono text-[11px]">{formatMoney(totalPaid)}</span>
                  </div>
                </div>

                {/* Guardian Info if available */}
                {student.parentName && (
                  <div className="text-[11px] text-slate-500 bg-indigo-50/50 p-2 rounded-lg mb-4">
                    <span className="font-semibold text-indigo-900">Guardian:</span> {student.parentName} ({student.parentPhone})
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px]">{student.phone || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenReport && (
                    <button
                      onClick={() => onOpenReport(student.id, null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      title="মাসিক হাজিরা ও HW রিপোর্ট (PDF)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>রিপোর্ট (PDF)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onSelectChat) onSelectChat(student);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>

                  {isTeacher && (
                    <button
                      onClick={() => handleRemoveStudent(student.id, student.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Add New Student</h3>
            <p className="text-xs text-slate-500 mb-4">Enroll a student into the tuition academy database</p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jordan@student.edu"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / Level</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="e.g. Grade 11"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Goals / Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Target SAT score, AP exams, weak areas..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
