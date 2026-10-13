import React, { useState } from 'react';
import { 
  DollarSign, Users, BookOpen, Clock, Calendar, 
  CreditCard, Video, AlertCircle, CheckCircle2, ArrowRight,
  TrendingUp, MessageSquare, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SSLCommerzModal from './SSLCommerzModal';
import InvoiceReceiptModal from './InvoiceReceiptModal';

export default function DashboardOverview({ stats, classes, invoices, enrollments, assignments, onNavigate, onRefresh }) {
  const { currentUser, isTeacher, formatMoney, lang } = useAuth();
  const [selectedPayInvoice, setSelectedPayInvoice] = useState(null);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState(null);

  const myInvoices = invoices.filter(i => i.studentId === currentUser?.id);
  const myPendingInvoices = myInvoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const myOverdueInvoices = myPendingInvoices.filter(i => i.status === 'overdue');
  const totalDuesAmount = myPendingInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const myPendingInvoice = myPendingInvoices[0];
  const myEnrollments = enrollments.filter(e => e.studentId === currentUser?.id);
  const myClasses = classes.filter(c => myEnrollments.some(e => e.classId === c.id));

  return (
    <div className="space-y-5">
      
      {/* Student Dues Banner (Supports Single & Multiple Overdue Invoices) */}
      {!isTeacher && myPendingInvoices.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
              myOverdueInvoices.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  myOverdueInvoices.length > 0 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-amber-400 text-slate-950'
                }`}>
                  {myOverdueInvoices.length > 0 
                    ? (lang === 'bn' ? `${myOverdueInvoices.length}টি বকেয়া মেয়াদোত্তীর্ণ` : `${myOverdueInvoices.length} Overdue`) 
                    : (lang === 'bn' ? 'চলতি বকেয়া' : 'Fee Due')}
                </span>
                <span className="text-xs text-slate-300">
                  {lang === 'bn' ? `মোট ${myPendingInvoices.length}টি ইনভয়েস` : `${myPendingInvoices.length} total invoices`}
                </span>
              </div>
              <h3 className="text-base font-bold mt-1 text-white">
                {myPendingInvoices.length > 1 
                  ? (lang === 'bn' ? `বিগত মাসগুলোর মোট বকেয়া ফি` : 'Accumulated Tuition Dues')
                  : myPendingInvoice.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {lang === 'bn' ? 'সর্বমোট পরিশোধযোগ্য:' : 'Total Payable:'}{' '}
                <strong className="text-rose-400 text-sm font-mono font-bold">{formatMoney(totalDuesAmount)}</strong>
                {myPendingInvoices.length > 1 && (
                  <span className="text-slate-400 ml-2">
                    ({lang === 'bn' ? 'প্রথম ইনভয়েস:' : 'First due:'} {formatMoney(myPendingInvoice.amount)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {myPendingInvoices.length > 1 && onNavigate && (
              <button
                onClick={() => onNavigate('invoices')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
              >
                {lang === 'bn' ? `সব বকেয়া দেখুন (${myPendingInvoices.length}টি)` : `View All (${myPendingInvoices.length})`}
              </button>
            )}
            <button
              onClick={() => setSelectedPayInvoice(myPendingInvoice)}
              className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>
                {myPendingInvoices.length > 1 
                  ? (lang === 'bn' ? `প্রথমটি পে করুন (${formatMoney(myPendingInvoice.amount)})` : `Pay 1st (${formatMoney(myPendingInvoice.amount)})`)
                  : (lang === 'bn' ? 'পেমেন্ট করুন' : 'Pay Now') + ` (${formatMoney(myPendingInvoice.amount)})`}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      {isTeacher ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'মোট আয়' : 'Total Revenue'}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
                {formatMoney(stats.totalEarnings || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'বকেয়া পাওনা' : 'Pending Dues'}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
                {formatMoney(stats.pendingDues || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'মোট শিক্ষার্থী' : 'Students'}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {stats.totalStudents || 3}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'গড় উপস্থিতি' : 'Attendance'}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {stats.attendanceRate || 92}%
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'আমার ব্যাচ' : 'Enrolled Batches'}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {myClasses.length} {lang === 'bn' ? 'টি' : 'Batches'}
              </p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'বকেয়া ফি' : 'Fee Dues'}</p>
              <p className={`text-xl font-bold mt-0.5 font-mono ${totalDuesAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatMoney(totalDuesAmount)}
              </p>
              {myPendingInvoices.length > 0 && (
                <p className="text-[10px] text-rose-500 font-medium">
                  {lang === 'bn' ? `${myPendingInvoices.length}টি বকেয়া ইনভয়েস` : `${myPendingInvoices.length} pending`}
                </p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalDuesAmount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'হোমওয়ার্ক জমা' : 'Assignments'}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {assignments.length} {lang === 'bn' ? 'টি' : 'Tasks'}
              </p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Batches & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Classes Timetable */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'bn' ? 'ক্লাস শিডিউল ও ব্যাচ' : 'Class Schedule'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              {lang === 'bn' ? 'সকল ব্যাচ →' : 'View All →'}
            </button>
          </div>

          <div className="space-y-2.5">
            {(isTeacher ? classes : (myClasses.length ? myClasses : classes)).slice(0, 3).map(cls => (
              <div
                key={cls.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center shrink-0 font-semibold text-xs">
                    {cls.subject.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">{cls.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      {cls.scheduleDays?.join(', ')} • {cls.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600 hidden sm:inline">
                    {formatMoney(cls.monthlyFee)}
                  </span>
                  <button
                    onClick={() => {
                      window.open(cls.zoomLink || cls.meetingLink || 'https://zoom.us', '_blank');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Links & Invoices */}
        <div className="space-y-4">
          
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              {lang === 'bn' ? 'দ্রুত নেভিগেশন' : 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('invoices')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-left transition flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4 text-slate-600" />
                <span>{lang === 'bn' ? 'ইনভয়েস' : 'Invoices'}</span>
              </button>

              <button
                onClick={() => onNavigate('messages')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-left transition flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span>{lang === 'bn' ? 'মেসেজ' : 'Messages'}</span>
              </button>

              <button
                onClick={() => onNavigate('attendance')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-left transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-600" />
                <span>{lang === 'bn' ? 'হাজিরা' : 'Attendance'}</span>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-left transition flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                <span>{lang === 'bn' ? 'রিপোর্ট' : 'Reports'}</span>
              </button>
            </div>
          </div>

          {/* Recent Invoices feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'bn' ? 'সাম্প্রতিক বিল' : 'Recent Bills'}
              </h3>
              <button
                onClick={() => onNavigate('invoices')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {lang === 'bn' ? 'সকল' : 'View all'}
              </button>
            </div>

            <div className="space-y-2">
              {invoices.slice(0, 3).map(inv => (
                <div key={inv.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{inv.student?.name || 'Student'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{inv.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 font-mono">{formatMoney(inv.amount)}</p>
                    <span className={`text-[10px] font-semibold uppercase ${
                      inv.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {inv.status === 'paid' ? (lang === 'bn' ? 'পরিশোধিত' : 'Paid') : (lang === 'bn' ? 'বকেয়া' : 'Pending')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Modals */}
      <SSLCommerzModal
        invoice={selectedPayInvoice}
        isOpen={!!selectedPayInvoice}
        onClose={() => setSelectedPayInvoice(null)}
        onPaymentSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      <InvoiceReceiptModal
        invoice={selectedReceiptInvoice}
        isOpen={!!selectedReceiptInvoice}
        onClose={() => setSelectedReceiptInvoice(null)}
      />

    </div>
  );
}
