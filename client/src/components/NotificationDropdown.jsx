import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, Trash2, Clock, CheckCircle2, AlertCircle, 
  CreditCard, FileText, Video, Send, Smartphone, ShieldCheck, X 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function NotificationDropdown({ isOpen, onClose, onNavigate }) {
  const { currentUser, lang } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTestSms, setShowTestSms] = useState(false);
  const [testPhone, setTestPhone] = useState('01819234567');
  const [testMessage, setTestMessage] = useState('EduTrack: আপনার উচ্চতর গণিত ক্লাস আজ ০৫:০০ PM এ শুরু হবে।');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState('');

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getNotifications(currentUser.id);
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUser?.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestSms = async (e) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;
    setSendingTest(true);
    setTestSuccess('');
    try {
      await api.sendCustomSms({
        phone: testPhone,
        name: currentUser?.name || 'User',
        title: 'টেস্ট ফোন নোটিফিকেশন',
        message: testMessage
      });
      setTestSuccess(`✅ ${testPhone} নম্বরে SMS পাঠানো হয়েছে!`);
      setTimeout(() => {
        setTestSuccess('');
        setShowTestSms(false);
      }, 3000);
      loadNotifications();
    } catch (err) {
      alert('SMS প্রেরণ ব্যর্থ: ' + err.message);
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  const unreadList = notifications.filter(n => !n.isRead);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'class_reminder':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'attendance_deduction':
        return <AlertCircle className="w-4 h-4 text-purple-600" />;
      case 'attendance_absent':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'attendance_present':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'invoice_due':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'homework':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-bold text-slate-900">
            {lang === 'bn' ? 'নোটিফিকেশন ও ফোন SMS' : 'Notifications & SMS'}
          </h4>
          {unreadList.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              {unreadList.length} {lang === 'bn' ? 'নতুন' : 'new'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadList.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold px-2 py-0.5 rounded hover:bg-slate-100"
            >
              {lang === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Test SMS Quick Action */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
        {!showTestSms ? (
          <button
            onClick={() => setShowTestSms(true)}
            className="w-full text-center py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'bn' ? '📱 ফোনে সরাসরি টেস্ট SMS পাঠান' : '📱 Send Test SMS to Phone'}</span>
          </button>
        ) : (
          <form onSubmit={handleSendTestSms} className="space-y-2 bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700">
                {lang === 'bn' ? 'বাংলাদেশি ফোন নম্বরে SMS টেস্ট' : 'Test SMS Gateway'}
              </span>
              <button
                type="button"
                onClick={() => setShowTestSms(false)}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono outline-none focus:border-slate-400"
            />
            <input
              type="text"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="SMS text..."
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setShowTestSms(false)}
                className="px-2.5 py-1 text-[10px] text-slate-500 rounded hover:bg-slate-100"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={sendingTest}
                className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>{sendingTest ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (lang === 'bn' ? 'SMS পাঠান' : 'Send SMS')}</span>
              </button>
            </div>
            {testSuccess && (
              <p className="text-[10px] font-semibold text-emerald-600">{testSuccess}</p>
            )}
          </form>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Bell className="w-6 h-6 mx-auto mb-1 text-slate-300" />
            <p>{lang === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications yet'}</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`p-3 text-left transition flex items-start gap-2.5 cursor-pointer ${
                !notif.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0 mt-0.5">
                {getNotifIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-xs truncate ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                    {formatTime(notif.createdAt)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  {notif.smsStatus === 'delivered' && (
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5" />
                      <span>{lang === 'bn' ? 'SMS প্রেরিত' : 'SMS Sent'}</span>
                    </span>
                  )}
                  {notif.recipientPhone && (
                    <span className="text-[9px] text-slate-400 font-mono">
                      {notif.recipientPhone}
                    </span>
                  )}
                </div>
              </div>

              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-center">
        <span className="text-[10px] text-slate-500">
          {lang === 'bn' ? 'সবগুলো ক্লাস ও পেমেন্ট অ্যালার্ট স্বয়ংক্রিয়ভাবে ফোনে সিঙ্ক হয়' : 'Class and fee alerts sync automatically with phone numbers'}
        </span>
      </div>
    </div>
  );
}
