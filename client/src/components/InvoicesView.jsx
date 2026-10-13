import React, { useState } from 'react';
import { 
  DollarSign, Clock, AlertTriangle, CheckCircle2, 
  Search, Plus, Receipt, CreditCard, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SSLCommerzModal from './SSLCommerzModal';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import CreateInvoiceModal from './CreateInvoiceModal';

export default function InvoicesView({ invoices, students, classes, onRefresh }) {
  const { currentUser, isTeacher, formatMoney, lang } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedSSLInvoice, setSelectedSSLInvoice] = useState(null);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // Filter invoices based on active user
  const relevantInvoices = isTeacher
    ? invoices
    : invoices.filter(i => i.studentId === currentUser?.id);

  const filteredInvoices = relevantInvoices.filter(inv => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.student?.name && inv.student.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalAmount = relevantInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const paidAmount = relevantInvoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const pendingAmount = relevantInvoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'bn' ? 'টিউশন ফি ও ইনভয়েস' : 'Tuition Fees & Invoices'}
          </h2>
          <p className="text-xs text-slate-500">
            {isTeacher 
              ? (lang === 'bn' ? 'ইনভয়েস তৈরি ও পেমেন্ট হিসেব পর্যবেক্ষণ' : 'Manage student invoices and track payments')
              : (lang === 'bn' ? 'টিউশন ফি রসিদ ও অনলাইন পেমেন্ট' : 'View invoices and settle tuition dues')}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন ইনভয়েস' : 'New Invoice'}</span>
          </button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'মোট বিল' : 'Total Billed'}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{formatMoney(totalAmount)}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'পরিশোধিত অর্থ' : 'Collected'}</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5 font-mono">{formatMoney(paidAmount)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{lang === 'bn' ? 'বকেয়া পাওনা' : 'Pending Dues'}</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5 font-mono">{formatMoney(pendingAmount)}</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: lang === 'bn' ? 'সকল' : 'All' },
            { id: 'pending', label: lang === 'bn' ? 'বকেয়া' : 'Pending' },
            { id: 'paid', label: lang === 'bn' ? 'পরিশোধিত' : 'Paid' },
            { id: 'overdue', label: lang === 'bn' ? 'বিলম্বিত' : 'Overdue' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === f.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'ইনভয়েস বা নাম খুঁজুন...' : 'Search invoices...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {lang === 'bn' ? 'কোনো ইনভয়েস পাওয়া যায়নি' : 'No invoices found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3 px-4">{lang === 'bn' ? 'ইনভয়েস নং' : 'Invoice #'}</th>
                  <th className="py-3 px-4">{lang === 'bn' ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="py-3 px-4">{lang === 'bn' ? 'কোর্স / বিবরণ' : 'Description'}</th>
                  <th className="py-3 px-4">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="py-3 px-4">{lang === 'bn' ? 'তারিখ' : 'Due Date'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const isPaid = inv.status === 'paid';
                  const isOverdue = inv.status === 'overdue';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{inv.student?.name || 'Student'}</div>
                        <div className="text-[11px] text-slate-400">{inv.student?.email}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-medium">{inv.title}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatMoney(inv.amount)}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {inv.dueDate}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isPaid 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isOverdue 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isPaid ? (lang === 'bn' ? 'পরিশোধিত' : 'Paid') : isOverdue ? (lang === 'bn' ? 'বিলম্বিত' : 'Overdue') : (lang === 'bn' ? 'বকেয়া' : 'Pending')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid ? (
                            <button
                              onClick={() => setSelectedReceiptInvoice(inv)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
                            >
                              <Receipt className="w-3.5 h-3.5 inline mr-1" />
                              {lang === 'bn' ? 'রসিদ' : 'Receipt'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedSSLInvoice(inv)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition"
                            >
                              {lang === 'bn' ? 'পেমেন্ট (SSLCommerz)' : 'Pay (SSLCommerz)'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SSLCommerz Modal */}
      <SSLCommerzModal
        invoice={selectedSSLInvoice}
        isOpen={!!selectedSSLInvoice}
        onClose={() => setSelectedSSLInvoice(null)}
        onPaymentSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoice={selectedReceiptInvoice}
        isOpen={!!selectedReceiptInvoice}
        onClose={() => setSelectedReceiptInvoice(null)}
      />

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <CreateInvoiceModal
          isOpen={showCreateInvoiceModal}
          onClose={() => setShowCreateInvoiceModal(false)}
          students={students}
          classes={classes}
          onSuccess={() => {
            setShowCreateInvoiceModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
