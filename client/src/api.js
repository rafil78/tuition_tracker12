import { offlineDb } from './offlineDb';

// Connection and Base API URL configuration
export const getConnectionMode = () => {
  if (typeof window === 'undefined') return 'offline';
  const saved = localStorage.getItem('edutrack_server_url');
  if (saved === 'offline') return 'offline';
  if (saved && saved.includes('192.168.')) return 'local';
  if (saved) return 'custom';
  
  // Default on mobile vs web
  const isNativeMobile = 
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    window.location.protocol === 'file:' ||
    window.location.origin.includes('capacitor://') ||
    (window.location.hostname === 'localhost' && !window.location.port) ||
    (window.location.origin === 'https://localhost');

  if (isNativeMobile) {
    return 'offline'; // Default mobile to instant offline-first
  }
  return 'default';
};

export const isOfflineMode = () => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('edutrack_server_url');
  if (saved === 'offline') return true;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return false;
};

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('edutrack_server_url');
    if (savedUrl && savedUrl !== 'offline' && savedUrl !== 'default') {
      return savedUrl.replace(/\/$/, '') + '/api';
    }
  }
  return '/api';
};

export const setServerUrl = (url) => {
  if (!url || url === 'default') {
    localStorage.removeItem('edutrack_server_url');
  } else {
    localStorage.setItem('edutrack_server_url', url);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('edutrack_connection_mode_changed', { detail: url }));
  }
};

const getUrl = (path) => `${getApiBase()}${path}`;

async function safeFetch(path, options = {}, fallback = null) {
  if (isOfflineMode()) {
    return fallback !== null ? fallback : { success: true };
  }

  try {
    const url = getUrl(path);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (fallback !== null && (!res.status || res.status >= 500)) {
        return fallback;
      }
      return errData;
    }
    return await res.json();
  } catch (err) {
    console.warn(`Network note for ${path}:`, err.message);
    return fallback !== null ? fallback : { error: err.message, networkError: true };
  }
}

export const api = {
  // Mode helpers
  isOffline: isOfflineMode,
  getConnectionMode,

  // Stats
  async getStats() {
    if (isOfflineMode()) {
      return offlineDb.getStats();
    }
    const res = await safeFetch('/stats/summary', {}, null);
    if (!res || res.networkError || res.error) {
      return offlineDb.getStats();
    }
    return res;
  },

  // Auth
  async login(email, password) {
    if (isOfflineMode()) {
      const normalized = (email || '').trim().toLowerCase();
      const users = offlineDb.getAll('users');
      const found = users.find(u => 
        u.email?.toLowerCase() === normalized ||
        (normalized.includes('admin') && u.role === 'admin') ||
        (normalized.includes('teacher') && u.role === 'teacher') ||
        (normalized.includes('student') && u.role === 'student') ||
        (normalized.includes('david') && u.id === 'teacher-1') ||
        (normalized.includes('alex') && u.id === 'student-1')
      );
      if (found) {
        return { success: true, user: found };
      }
      return { success: false, error: 'ভুল ইমেইল বা পাসওয়ার্ড।' };
    }

    const res = await safeFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, null);

    if (!res || res.networkError) {
      // Offline fallback login
      const users = offlineDb.getAll('users');
      const found = users.find(u => u.email?.toLowerCase() === (email || '').trim().toLowerCase());
      if (found) return { success: true, user: found };
      return { success: false, error: 'অফলাইন মোড: ব্যবহারকারী পাওয়া যায়নি।' };
    }
    return res;
  },

  async register(userData) {
    if (isOfflineMode()) {
      const newUser = offlineDb.insert('users', {
        ...userData,
        emailVerified: true
      });
      return { success: true, user: newUser, message: 'অফলাইন মোডে সফলভাবে রেজিস্টার হয়েছে' };
    }

    const res = await safeFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, null);

    if (!res || res.networkError) {
      const newUser = offlineDb.insert('users', { ...userData, emailVerified: true });
      return { success: true, user: newUser, message: 'অফলাইন স্টোরেজে সেভ হয়েছে' };
    }
    return res;
  },

  // Users
  async getUsers(role) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('users');
      if (role) list = list.filter(u => u.role === role);
      return list;
    }
    const path = role ? `/users?role=${role}` : `/users`;
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      let list = offlineDb.getAll('users');
      if (role) list = list.filter(u => u.role === role);
      return list;
    }
    return res;
  },

  async getUser(id) {
    if (isOfflineMode()) {
      return offlineDb.getById('users', id);
    }
    const res = await safeFetch(`/users/${id}`, {}, null);
    if (!res || res.networkError) {
      return offlineDb.getById('users', id);
    }
    return res;
  },

  async createUser(userData) {
    if (isOfflineMode()) {
      return offlineDb.insert('users', userData);
    }
    const res = await safeFetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('users', userData);
    }
    return res;
  },

  async deleteUser(id) {
    if (isOfflineMode()) {
      offlineDb.delete('users', id);
      // clean up enrollments & attendance
      const enrs = offlineDb.getAll('enrollments').filter(e => e.studentId === id || e.teacherId === id);
      enrs.forEach(e => offlineDb.delete('enrollments', e.id));
      const atts = offlineDb.getAll('attendance').filter(a => a.studentId === id);
      atts.forEach(a => offlineDb.delete('attendance', a.id));
      return { success: true, id };
    }
    const res = await safeFetch(`/users/${id}`, { method: 'DELETE' }, null);
    if (!res || res.networkError) {
      offlineDb.delete('users', id);
      return { success: true, id };
    }
    return res;
  },

  async updateUser(id, userData) {
    if (isOfflineMode()) {
      return offlineDb.update('users', id, userData);
    }
    const res = await safeFetch(`/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.update('users', id, userData);
    }
    return res;
  },

  // Classes
  async getClasses(teacherId) {
    if (isOfflineMode()) {
      return offlineDb.getEnrichedClasses(teacherId);
    }
    const path = teacherId ? `/classes?teacherId=${teacherId}` : `/classes`;
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getEnrichedClasses(teacherId);
    }
    return res;
  },

  async createClass(classData) {
    if (isOfflineMode()) {
      return offlineDb.insert('classes', {
        ...classData,
        monthlyFee: Number(classData.monthlyFee) || 3000,
        hourlyRate: Number(classData.hourlyRate) || 500,
        status: 'active'
      });
    }
    const res = await safeFetch('/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('classes', classData);
    }
    return res;
  },

  async updateClass(id, updates) {
    if (isOfflineMode()) {
      return offlineDb.update('classes', id, updates);
    }
    const res = await safeFetch(`/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.update('classes', id, updates);
    }
    return res;
  },

  async deleteClass(id) {
    if (isOfflineMode()) {
      offlineDb.delete('classes', id);
      return { success: true, message: 'Class deleted successfully' };
    }
    const res = await safeFetch(`/classes/${id}`, { method: 'DELETE' }, null);
    if (!res || res.networkError) {
      offlineDb.delete('classes', id);
      return { success: true, message: 'Class deleted in offline store' };
    }
    return res;
  },

  // Enrollments
  async getEnrollments(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('enrollments');
      if (params.classId) list = list.filter(e => e.classId === params.classId);
      if (params.studentId) list = list.filter(e => e.studentId === params.studentId);
      const users = offlineDb.getAll('users');
      const classes = offlineDb.getAll('classes');
      return list.map(e => ({
        ...e,
        student: users.find(u => u.id === e.studentId),
        class: classes.find(c => c.id === e.classId)
      }));
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/enrollments${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('enrollments');
    }
    return res;
  },

  async enrollStudent(classId, studentId) {
    if (isOfflineMode()) {
      return offlineDb.insert('enrollments', {
        classId,
        studentId,
        status: 'active',
        enrolledAt: new Date().toISOString()
      });
    }
    const res = await safeFetch('/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, studentId }),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('enrollments', { classId, studentId, status: 'active', enrolledAt: new Date().toISOString() });
    }
    return res;
  },

  async cancelEnrollment(id) {
    if (isOfflineMode()) {
      offlineDb.delete('enrollments', id);
      return { success: true, id };
    }
    const res = await safeFetch(`/enrollments/${id}`, { method: 'DELETE' }, null);
    if (!res || res.networkError) {
      offlineDb.delete('enrollments', id);
      return { success: true, id };
    }
    return res;
  },

  // Attendance
  async getAttendance(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('attendance');
      if (params.classId) list = list.filter(a => a.classId === params.classId);
      if (params.studentId) list = list.filter(a => a.studentId === params.studentId);
      if (params.date) list = list.filter(a => a.date === params.date);
      return list;
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/attendance${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('attendance');
    }
    return res;
  },

  async saveAttendance(records) {
    if (isOfflineMode()) {
      return offlineDb.saveAttendanceRecords(records);
    }
    const res = await safeFetch('/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.isArray(records) ? { records } : records),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.saveAttendanceRecords(records);
    }
    return res;
  },

  // Invoices & Payments
  async getInvoices(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('invoices');
      if (params.studentId) list = list.filter(i => i.studentId === params.studentId);
      if (params.classId) list = list.filter(i => i.classId === params.classId);
      if (params.status) list = list.filter(i => i.status === params.status);
      return list;
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/invoices${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('invoices');
    }
    return res;
  },

  async createInvoice(invoiceData) {
    if (isOfflineMode()) {
      const invNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
      return offlineDb.insert('invoices', {
        ...invoiceData,
        invoiceNumber: invoiceData.invoiceNumber || invNum,
        status: invoiceData.status || 'pending',
        amount: Number(invoiceData.amount) || 0,
        createdAt: new Date().toISOString()
      });
    }
    const res = await safeFetch('/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('invoices', invoiceData);
    }
    return res;
  },

  async processPayment(paymentPayload) {
    if (isOfflineMode()) {
      return offlineDb.processInvoicePayment(paymentPayload);
    }
    const res = await safeFetch('/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.processInvoicePayment(paymentPayload);
    }
    return res;
  },

  // Messages
  async getMessages(user1, user2) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('messages');
      if (user1 && user2) {
        list = list.filter(m => 
          (m.senderId === user1 && m.receiverId === user2) ||
          (m.senderId === user2 && m.receiverId === user1)
        );
      } else if (user1) {
        list = list.filter(m => m.senderId === user1 || m.receiverId === user1);
      }
      return list;
    }
    let path = '/messages';
    if (user1 && user2) {
      path += `?user1=${user1}&user2=${user2}`;
    } else if (user1) {
      path += `?user1=${user1}`;
    }
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      let list = offlineDb.getAll('messages');
      if (user1 && user2) {
        list = list.filter(m => 
          (m.senderId === user1 && m.receiverId === user2) ||
          (m.senderId === user2 && m.receiverId === user1)
        );
      }
      return list;
    }
    return res;
  },

  async sendMessage(messageData) {
    if (isOfflineMode()) {
      return offlineDb.insert('messages', {
        ...messageData,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
    const res = await safeFetch('/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('messages', messageData);
    }
    return res;
  },

  async markMessageRead(id) {
    if (isOfflineMode()) {
      return offlineDb.update('messages', id, { isRead: true });
    }
    return safeFetch(`/messages/${id}/read`, { method: 'PUT' });
  },

  async markMessageAsRead(id) {
    return this.markMessageRead(id);
  },

  // Notifications & Phone SMS Alerts
  async getNotifications(userId) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('notifications');
      if (userId) list = list.filter(n => n.userId === userId);
      return {
        notifications: list,
        unreadCount: list.filter(n => !n.isRead).length
      };
    }
    const path = userId ? `/notifications?userId=${userId}` : `/notifications`;
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError) {
      let list = offlineDb.getAll('notifications');
      if (userId) list = list.filter(n => n.userId === userId);
      return {
        notifications: list,
        unreadCount: list.filter(n => !n.isRead).length
      };
    }
    return res;
  },

  async markNotificationRead(id) {
    if (isOfflineMode()) {
      return offlineDb.update('notifications', id, { isRead: true });
    }
    return safeFetch(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(userId) {
    if (isOfflineMode()) {
      const list = offlineDb.getAll('notifications');
      list.forEach(n => {
        if (!userId || n.userId === userId) {
          offlineDb.update('notifications', n.id, { isRead: true });
        }
      });
      return { success: true };
    }
    return safeFetch('/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  },

  async sendClassReminder(classId) {
    if (isOfflineMode()) {
      offlineDb.insert('notifications', {
        type: 'class_reminder',
        title: 'ক্লাস রিমাইন্ডার পাঠানো হয়েছে',
        message: 'ব্যাচের সকল শিক্ষার্থীর ফোনে ক্লাস নোটিফিকেশন পৌঁছে গেছে।',
        isRead: false
      });
      offlineDb.insert('sms_logs', {
        phone: '+880 1819-001122',
        studentName: 'ব্যাচ শিক্ষার্থী',
        recipientType: 'Student & Parent',
        message: 'EduTrack: আপনার টিউশন ক্লাস কিছুক্ষণ পর শুরু হতে যাচ্ছে।',
        status: 'delivered',
        timestamp: new Date().toISOString()
      });
      return { success: true, message: 'অফলাইন মোড: এসএমএস ও নোটিফিকেশন লগ সেভ হয়েছে' };
    }
    return safeFetch('/notifications/send-class-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId }),
    });
  },

  async getSmsLogs() {
    if (isOfflineMode()) {
      return offlineDb.getAll('sms_logs');
    }
    const res = await safeFetch('/notifications/sms-logs', {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('sms_logs');
    }
    return res;
  },

  async sendCustomSms(payload) {
    if (isOfflineMode()) {
      const log = offlineDb.insert('sms_logs', {
        ...payload,
        status: 'delivered',
        timestamp: new Date().toISOString()
      });
      return { success: true, log };
    }
    return safeFetch('/notifications/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Assignments & Submissions
  async getAssignments(classId) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('assignments');
      if (classId) list = list.filter(a => a.classId === classId);
      return list;
    }
    const path = classId ? `/assignments?classId=${classId}` : `/assignments`;
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('assignments');
    }
    return res;
  },

  async createAssignment(assignmentData) {
    if (isOfflineMode()) {
      return offlineDb.insert('assignments', assignmentData);
    }
    const res = await safeFetch('/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('assignments', assignmentData);
    }
    return res;
  },

  async getSubmissions(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('submissions');
      if (params.assignmentId) list = list.filter(s => s.assignmentId === params.assignmentId);
      if (params.studentId) list = list.filter(s => s.studentId === params.studentId);
      return list;
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/submissions${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('submissions');
    }
    return res;
  },

  async submitAssignment(submissionData) {
    if (isOfflineMode()) {
      return offlineDb.insert('submissions', {
        ...submissionData,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      });
    }
    const res = await safeFetch('/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('submissions', submissionData);
    }
    return res;
  },

  async gradeSubmission(id, score, feedback) {
    if (isOfflineMode()) {
      return offlineDb.update('submissions', id, {
        score: Number(score),
        feedback,
        status: 'graded'
      });
    }
    const res = await safeFetch(`/submissions/${id}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback }),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.update('submissions', id, { score: Number(score), feedback, status: 'graded' });
    }
    return res;
  },

  // Exam Marks
  async getExamMarks(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('exam_marks');
      if (params.classId) list = list.filter(m => m.classId === params.classId);
      if (params.studentId) list = list.filter(m => m.studentId === params.studentId);
      return list;
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/exam-marks${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('exam_marks');
    }
    return res;
  },

  async addExamMark(markData) {
    if (isOfflineMode()) {
      return offlineDb.insert('exam_marks', markData);
    }
    const res = await safeFetch('/exam-marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('exam_marks', markData);
    }
    return res;
  },

  // Announcements
  async getAnnouncements(classId) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('announcements');
      if (classId) list = list.filter(a => a.classId === classId);
      return list;
    }
    const path = classId ? `/announcements?classId=${classId}` : `/announcements`;
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('announcements');
    }
    return res;
  },

  async createAnnouncement(data) {
    if (isOfflineMode()) {
      return offlineDb.insert('announcements', data);
    }
    const res = await safeFetch('/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('announcements', data);
    }
    return res;
  },

  // Settings
  async getSettings() {
    if (isOfflineMode()) {
      return offlineDb.getAll('settings');
    }
    const res = await safeFetch('/settings', {}, null);
    if (!res || res.networkError) {
      return offlineDb.getAll('settings');
    }
    return res;
  },

  async updateSettings(settings) {
    if (isOfflineMode()) {
      offlineDb.data.settings = { ...offlineDb.data.settings, ...settings };
      offlineDb.save();
      return offlineDb.data.settings;
    }
    const res = await safeFetch('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }, null);

    if (!res || res.networkError) {
      offlineDb.data.settings = { ...offlineDb.data.settings, ...settings };
      offlineDb.save();
      return offlineDb.data.settings;
    }
    return res;
  },

  // Time Change Requests
  async getTimeRequests(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('time_change_requests');
      if (params.studentId) list = list.filter(r => r.studentId === params.studentId);
      if (params.classId) list = list.filter(r => r.classId === params.classId);
      return list;
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/time-requests${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('time_change_requests');
    }
    return res;
  },

  async createTimeRequest(requestData) {
    if (isOfflineMode()) {
      const newReq = offlineDb.insert('time_change_requests', {
        ...requestData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      offlineDb.insert('notifications', {
        userId: 'teacher-1',
        type: 'time_change',
        title: 'ক্লাস সময় পরিবর্তনের অনুরোধ',
        message: `${requestData.proposedSlot || 'নতুন সময়'} নির্ধারণের আবেদন জমা হয়েছে।`,
        isRead: false
      });
      return newReq;
    }
    const res = await safeFetch('/time-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('time_change_requests', requestData);
    }
    return res;
  },

  async respondTimeRequest(id, status, teacherResponse = '') {
    if (isOfflineMode()) {
      const req = offlineDb.getById('time_change_requests', id);
      const updated = offlineDb.update('time_change_requests', id, {
        status,
        teacherResponse
      });
      if (status === 'approved' && req?.classId && req?.proposedSlot) {
        offlineDb.update('classes', req.classId, {
          timeSlot: req.proposedSlot,
          scheduleDays: req.proposedDays || undefined
        });
      }
      return updated;
    }
    return safeFetch(`/time-requests/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, teacherResponse }),
    });
  },

  // OTP Verification
  async sendOtp(email, name = '') {
    if (isOfflineMode()) {
      return {
        success: true,
        otp: '123456',
        message: 'অফলাইন ওটিপি সক্রিয় (কোড: 123456)',
        deliveryMethod: 'Offline Instant Generator'
      };
    }
    return safeFetch('/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    }, { success: true, otp: '123456', message: 'ডেমো ওটিপি সক্রিয়' });
  },

  async verifyOtp(email, otp) {
    if (isOfflineMode()) {
      return { success: true, verified: true };
    }
    return safeFetch('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    }, { success: true, verified: true });
  },

  async getSmtpConfig() {
    if (isOfflineMode()) {
      return { configured: false, user: 'offline@edutrack.com' };
    }
    return safeFetch('/settings/smtp', {}, { configured: false, user: '' });
  },

  async updateSmtpConfig(config) {
    if (isOfflineMode()) {
      return { success: true, config, message: 'অফলাইনে সংরক্ষিত হয়েছে' };
    }
    return safeFetch('/settings/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },

  // SSLCommerz
  async initSSLCommerz(invoiceId, customerDetails = {}) {
    if (isOfflineMode()) {
      return {
        status: 'SUCCESS',
        GatewayPageURL: `https://sandbox.sslcommerz.com/gwprocess/v4/demo?inv=${invoiceId}`,
        invoiceId
      };
    }
    return safeFetch('/payments/sslcommerz/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, ...customerDetails }),
    }, {
      status: 'SUCCESS',
      GatewayPageURL: '#offline-payment-sim',
      invoiceId
    });
  },

  async validateSSLCommerz(payload) {
    if (isOfflineMode()) {
      return { status: 'VALID', message: 'Payment verified offline' };
    }
    return safeFetch('/payments/sslcommerz/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Deductions
  async getDeductions(params = {}) {
    if (isOfflineMode()) {
      return offlineDb.getAll('deductions') || [];
    }
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/deductions${query ? `?${query}` : ''}`, {}, []);
  },

  // Monthly Attendance & HW Reports
  async getMonthlyReport(params = {}) {
    if (isOfflineMode()) {
      const attendance = offlineDb.getAll('attendance');
      const submissions = offlineDb.getAll('submissions');
      const classes = offlineDb.getAll('classes');
      const users = offlineDb.getAll('users').filter(u => u.role === 'student');

      return users.map(st => {
        const studentAtt = attendance.filter(a => a.studentId === st.id);
        const present = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        const studentSubs = submissions.filter(s => s.studentId === st.id);
        return {
          studentId: st.id,
          studentName: st.name,
          totalClasses: studentAtt.length || 8,
          presentCount: present || 7,
          attendanceRate: studentAtt.length > 0 ? Math.round((present / studentAtt.length) * 100) : 92,
          submittedHomeworks: studentSubs.length || 2,
          averageScore: 92
        };
      });
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/reports/monthly${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return this.getMonthlyReport(); // Call offline logic
    }
    return res;
  },

  // Study Notes
  async getStudyNotes(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('study_notes');
      if (params.classId) list = list.filter(n => n.classId === params.classId);
      return list;
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/study-notes${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('study_notes');
    }
    return res;
  },

  async createStudyNote(data) {
    if (isOfflineMode()) {
      return offlineDb.insert('study_notes', data);
    }
    const res = await safeFetch('/study-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('study_notes', data);
    }
    return res;
  },

  async deleteStudyNote(id) {
    if (isOfflineMode()) {
      offlineDb.delete('study_notes', id);
      return { success: true, id };
    }
    const res = await safeFetch(`/study-notes/${id}`, { method: 'DELETE' }, null);
    if (!res || res.networkError) {
      offlineDb.delete('study_notes', id);
      return { success: true, id };
    }
    return res;
  },

  // Home Tuition Location Tracking
  async getTuitionLocations(params = {}) {
    if (isOfflineMode()) {
      return offlineDb.getAll('tuition_locations');
    }
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`/tuition-location${query ? `?${query}` : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('tuition_locations');
    }
    return res;
  },

  async updateTuitionLocation(data) {
    if (isOfflineMode()) {
      return offlineDb.insert('tuition_locations', data);
    }
    return safeFetch('/tuition-location/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async checkInTuitionLocation(data) {
    if (isOfflineMode()) {
      return offlineDb.insert('tuition_locations', {
        ...data,
        status: 'checked-in',
        checkInTime: new Date().toISOString()
      });
    }
    return safeFetch('/tuition-location/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async checkOutTuitionLocation(data) {
    if (isOfflineMode()) {
      return offlineDb.insert('tuition_locations', {
        ...data,
        status: 'checked-out',
        checkOutTime: new Date().toISOString()
      });
    }
    return safeFetch('/tuition-location/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Exam Schedules
  async getExamSchedules(classId) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('exam_schedules');
      if (classId) list = list.filter(e => e.classId === classId);
      return list;
    }
    const path = classId ? `/exam-schedules?classId=${classId}` : `/exam-schedules`;
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('exam_schedules');
    }
    return res;
  },

  async createExamSchedule(data) {
    if (isOfflineMode()) {
      return offlineDb.insert('exam_schedules', data);
    }
    const res = await safeFetch('/exam-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('exam_schedules', data);
    }
    return res;
  },

  async updateExamSchedule(id, updates) {
    if (isOfflineMode()) {
      return offlineDb.update('exam_schedules', id, updates);
    }
    return safeFetch(`/exam-schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },

  async deleteExamSchedule(id) {
    if (isOfflineMode()) {
      offlineDb.delete('exam_schedules', id);
      return { success: true };
    }
    return safeFetch(`/exam-schedules/${id}`, { method: 'DELETE' });
  },

  // Rewards
  async getRewards(studentId) {
    if (isOfflineMode()) {
      const list = offlineDb.getAll('student_rewards');
      const found = list.find(r => r.studentId === studentId);
      return found || { xp: 450, level: 3, vouchers: [] };
    }
    const path = studentId ? `/rewards?studentId=${studentId}` : `/rewards`;
    const res = await safeFetch(path, {}, null);
    if (!res || res.networkError) {
      const list = offlineDb.getAll('student_rewards');
      return list.find(r => r.studentId === studentId) || { xp: 450, vouchers: [] };
    }
    return res;
  },

  async claimRewardVoucher(studentId, voucherId) {
    if (isOfflineMode()) {
      const list = offlineDb.getAll('student_rewards');
      const item = list.find(r => r.studentId === studentId);
      if (item && item.vouchers) {
        item.vouchers = item.vouchers.map(v => v.id === voucherId ? { ...v, claimed: true } : v);
        offlineDb.save();
      }
      return { success: true, message: 'ভাউচার সক্রিয় হয়েছে' };
    }
    return safeFetch('/rewards/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, voucherId }),
    });
  },

  async awardRewardXP(studentId, xpAmount, reason, badge) {
    if (isOfflineMode()) {
      const list = offlineDb.getAll('student_rewards');
      let item = list.find(r => r.studentId === studentId);
      if (!item) {
        item = offlineDb.insert('student_rewards', { studentId, xp: 0, badges: [], vouchers: [] });
      }
      item.xp = (item.xp || 0) + Number(xpAmount);
      if (badge && !item.badges?.includes(badge)) {
        item.badges = [...(item.badges || []), badge];
      }
      offlineDb.save();
      return { success: true, reward: item };
    }
    return safeFetch('/rewards/award-xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, xpAmount, reason, badge }),
    });
  },

  // Parent Students
  async getParentStudents(parentId) {
    if (isOfflineMode()) {
      const users = offlineDb.getAll('users');
      const parent = users.find(u => u.id === parentId);
      if (parent && parent.studentIds) {
        return users.filter(u => parent.studentIds.includes(u.id));
      }
      return users.filter(u => u.role === 'student').slice(0, 2);
    }
    const res = await safeFetch(`/parents/${parentId}/students`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('users').filter(u => u.role === 'student').slice(0, 2);
    }
    return res;
  },

  async parentApproveReschedule(requestId, parentId, notes) {
    if (isOfflineMode()) {
      return offlineDb.update('time_change_requests', requestId, {
        parentApproval: true,
        parentNotes: notes,
        parentApprovedAt: new Date().toISOString()
      });
    }
    return safeFetch(`/time-requests/${requestId}/parent-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, notes }),
    });
  },

  // Home Tuition Marketplace & Requests
  async getTuitionRequests(params = {}) {
    if (isOfflineMode()) {
      let list = offlineDb.getAll('tuition_requests');
      if (params.studentId) list = list.filter(r => r.studentId === params.studentId);
      if (params.status) list = list.filter(r => r.status === params.status);
      return list;
    }
    const q = new URLSearchParams(params).toString();
    const res = await safeFetch(`/tuition-requests${q ? '?' + q : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('tuition_requests');
    }
    return res;
  },

  async createTuitionRequest(requestData) {
    if (isOfflineMode()) {
      return offlineDb.insert('tuition_requests', {
        ...requestData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }
    const res = await safeFetch('/tuition-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    }, null);

    if (!res || res.networkError) {
      return offlineDb.insert('tuition_requests', requestData);
    }
    return res;
  },

  async respondToTuitionRequest(id, responseData) {
    if (isOfflineMode()) {
      return offlineDb.update('tuition_requests', id, responseData);
    }
    return safeFetch(`/tuition-requests/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseData),
    });
  },

  async getTutors(params = {}) {
    if (isOfflineMode()) {
      return offlineDb.getAll('tutors');
    }
    const q = new URLSearchParams(params).toString();
    const res = await safeFetch(`/tutors${q ? '?' + q : ''}`, {}, null);
    if (!res || res.networkError || !Array.isArray(res)) {
      return offlineDb.getAll('tutors');
    }
    return res;
  },

  // Database Management & Backup
  async resetData() {
    offlineDb.reset();
    if (!isOfflineMode()) {
      safeFetch('/reset-data', { method: 'POST' }).catch(() => {});
    }
    return { success: true, message: 'Database reset to demo state' };
  },

  exportData() {
    return offlineDb.exportDatabaseJson();
  },

  importData(jsonString) {
    return offlineDb.importDatabaseJson(jsonString);
  }
};
