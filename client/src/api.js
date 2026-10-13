import { 
  MOCK_STATS, 
  MOCK_CLASSES, 
  MOCK_INVOICES, 
  MOCK_ENROLLMENTS, 
  MOCK_TUITION_REQUESTS, 
  MOCK_TUTORS 
} from './mockData';

// Base API URL configuration - supports Web, Native Android APK & Cloud backend
export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('edutrack_server_url');
    if (savedUrl) {
      return savedUrl.replace(/\/$/, '') + '/api';
    }
    // Detect Capacitor native platform or mobile webview
    const isNativeMobile = 
      Boolean(window.Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === 'file:' ||
      window.location.origin.includes('capacitor://') ||
      (window.location.hostname === 'localhost' && !window.location.port) ||
      (window.location.origin === 'https://localhost');

    if (isNativeMobile) {
      // Default to live Render backend or Wi-Fi IP
      return 'https://tuition-tracker12.onrender.com/api';
    }
  }
  return '/api';
};

export const setServerUrl = (url) => {
  if (!url || url === 'default' || url === 'offline') {
    localStorage.removeItem('edutrack_server_url');
  } else {
    localStorage.setItem('edutrack_server_url', url);
  }
};

const getUrl = (path) => `${getApiBase()}${path}`;

async function safeFetch(path, options = {}, fallback = null) {
  try {
    const url = getUrl(path);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

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
  // Stats
  async getStats() {
    return safeFetch('/stats/summary', {}, MOCK_STATS);
  },

  // Auth
  async login(email, password) {
    return safeFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, { success: false, error: 'Network unavailable' });
  },

  async register(userData) {
    return safeFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, { success: false, error: 'Network unavailable' });
  },

  // Users
  async getUsers(role) {
    const path = role ? `/users?role=${role}` : `/users`;
    return safeFetch(path, {}, []);
  },

  async getUser(id) {
    return safeFetch(`/users/${id}`, {}, null);
  },

  async createUser(userData) {
    return safeFetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id) {
    return safeFetch(`/users/${id}`, { method: 'DELETE' });
  },

  async updateUser(id, userData) {
    return safeFetch(`/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  },

  // Classes
  async getClasses(teacherId) {
    const path = teacherId ? `/classes?teacherId=${teacherId}` : `/classes`;
    return safeFetch(path, {}, MOCK_CLASSES);
  },

  async createClass(classData) {
    return safeFetch('/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    });
  },

  async updateClass(id, updates) {
    return safeFetch(`/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },

  async deleteClass(id) {
    return safeFetch(`/classes/${id}`, { method: 'DELETE' });
  },

  // Enrollments
  async getEnrollments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/enrollments${query ? `?${query}` : ''}`, {}, MOCK_ENROLLMENTS);
  },

  async enrollStudent(classId, studentId) {
    return safeFetch('/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, studentId }),
    });
  },

  async cancelEnrollment(id) {
    return safeFetch(`/enrollments/${id}`, { method: 'DELETE' });
  },

  // Attendance
  async getAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/attendance${query ? `?${query}` : ''}`, {}, []);
  },

  async saveAttendance(records) {
    return safeFetch('/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.isArray(records) ? { records } : records),
    });
  },

  // Invoices & Payments
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/invoices${query ? `?${query}` : ''}`, {}, MOCK_INVOICES);
  },

  async createInvoice(invoiceData) {
    return safeFetch('/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
  },

  async processPayment(paymentPayload) {
    return safeFetch('/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    });
  },

  // Messages
  async getMessages(user1, user2) {
    let path = '/messages';
    if (user1 && user2) {
      path += `?user1=${user1}&user2=${user2}`;
    } else if (user1) {
      path += `?user1=${user1}`;
    }
    return safeFetch(path, {}, []);
  },

  async sendMessage(messageData) {
    return safeFetch('/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });
  },

  async markMessageRead(id) {
    return safeFetch(`/messages/${id}/read`, { method: 'PUT' });
  },

  async markMessageAsRead(id) {
    return this.markMessageRead(id);
  },

  // Notifications & Phone SMS Alerts
  async getNotifications(userId) {
    const path = userId ? `/notifications?userId=${userId}` : `/notifications`;
    return safeFetch(path, {}, []);
  },

  async markNotificationRead(id) {
    return safeFetch(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(userId) {
    return safeFetch('/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  },

  async sendClassReminder(classId) {
    return safeFetch('/notifications/send-class-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId }),
    });
  },

  async getSmsLogs() {
    return safeFetch('/notifications/sms-logs', {}, []);
  },

  async sendCustomSms(payload) {
    return safeFetch('/notifications/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Assignments & Submissions
  async getAssignments(classId) {
    const path = classId ? `/assignments?classId=${classId}` : `/assignments`;
    return safeFetch(path, {}, []);
  },

  async createAssignment(assignmentData) {
    return safeFetch('/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentData),
    });
  },

  async getSubmissions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/submissions${query ? `?${query}` : ''}`, {}, []);
  },

  async submitAssignment(submissionData) {
    return safeFetch('/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });
  },

  async gradeSubmission(id, score, feedback) {
    return safeFetch(`/submissions/${id}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback }),
    });
  },

  // Exam Marks
  async getExamMarks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/exam-marks${query ? `?${query}` : ''}`, {}, []);
  },

  async addExamMark(markData) {
    return safeFetch('/exam-marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markData),
    });
  },

  // Announcements
  async getAnnouncements(classId) {
    const path = classId ? `/announcements?classId=${classId}` : `/announcements`;
    return safeFetch(path, {}, []);
  },

  async createAnnouncement(data) {
    return safeFetch('/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Settings
  async getSettings() {
    return safeFetch('/settings', {}, {
      currencyCode: 'BDT',
      currencySymbol: '৳',
      currencyName: 'Bangladeshi Taka',
      vatPercent: 0
    });
  },

  async updateSettings(settings) {
    return safeFetch('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },

  // Time Change Requests
  async getTimeRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/time-requests${query ? `?${query}` : ''}`, {}, []);
  },

  async createTimeRequest(requestData) {
    return safeFetch('/time-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
  },

  async respondTimeRequest(id, status, teacherResponse = '') {
    return safeFetch(`/time-requests/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, teacherResponse }),
    });
  },

  // Gmail OTP Verification
  async sendOtp(email, name = '') {
    return safeFetch('/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    }, { success: true, otp: '123456', message: 'ডেমো ওটিপি সক্রিয়' });
  },

  async verifyOtp(email, otp) {
    return safeFetch('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    }, { success: true });
  },

  async getSmtpConfig() {
    return safeFetch('/settings/smtp', {}, { configured: false, user: '' });
  },

  async updateSmtpConfig(config) {
    return safeFetch('/settings/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },

  // SSLCommerz Gateway
  async initSSLCommerz(invoiceId, customerDetails = {}) {
    return safeFetch('/payments/sslcommerz/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, ...customerDetails }),
    });
  },

  async validateSSLCommerz(payload) {
    return safeFetch('/payments/sslcommerz/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Deductions
  async getDeductions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/deductions${query ? `?${query}` : ''}`, {}, []);
  },

  // Monthly Attendance & HW Reports
  async getMonthlyReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/reports/monthly${query ? `?${query}` : ''}`, {}, []);
  },

  // Study Notes
  async getStudyNotes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/study-notes${query ? `?${query}` : ''}`, {}, []);
  },

  async createStudyNote(data) {
    return safeFetch('/study-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteStudyNote(id) {
    return safeFetch(`/study-notes/${id}`, { method: 'DELETE' });
  },

  // Home Tuition Location Tracking
  async getTuitionLocations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`/tuition-location${query ? `?${query}` : ''}`, {}, []);
  },

  async updateTuitionLocation(data) {
    return safeFetch('/tuition-location/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async checkInTuitionLocation(data) {
    return safeFetch('/tuition-location/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async checkOutTuitionLocation(data) {
    return safeFetch('/tuition-location/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Exam Schedules
  async getExamSchedules(classId) {
    const path = classId ? `/exam-schedules?classId=${classId}` : `/exam-schedules`;
    return safeFetch(path, {}, []);
  },

  async createExamSchedule(data) {
    return safeFetch('/exam-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateExamSchedule(id, updates) {
    return safeFetch(`/exam-schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },

  async deleteExamSchedule(id) {
    return safeFetch(`/exam-schedules/${id}`, { method: 'DELETE' });
  },

  // Rewards
  async getRewards(studentId) {
    const path = studentId ? `/rewards?studentId=${studentId}` : `/rewards`;
    return safeFetch(path, {}, { xp: 350, vouchers: [] });
  },

  async claimRewardVoucher(studentId, voucherId) {
    return safeFetch('/rewards/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, voucherId }),
    });
  },

  async awardRewardXP(studentId, xpAmount, reason, badge) {
    return safeFetch('/rewards/award-xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, xpAmount, reason, badge }),
    });
  },

  // Parent Students
  async getParentStudents(parentId) {
    return safeFetch(`/parents/${parentId}/students`, {}, []);
  },

  async parentApproveReschedule(requestId, parentId, notes) {
    return safeFetch(`/time-requests/${requestId}/parent-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, notes }),
    });
  },

  // Home Tuition Marketplace & Requests
  async getTuitionRequests(params = {}) {
    const q = new URLSearchParams(params).toString();
    return safeFetch(`/tuition-requests${q ? '?' + q : ''}`, {}, MOCK_TUITION_REQUESTS);
  },

  async createTuitionRequest(requestData) {
    return safeFetch('/tuition-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
  },

  async respondToTuitionRequest(id, responseData) {
    return safeFetch(`/tuition-requests/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseData),
    });
  },

  async getTutors(params = {}) {
    const q = new URLSearchParams(params).toString();
    return safeFetch(`/tutors${q ? '?' + q : ''}`, {}, MOCK_TUTORS);
  },

  // Reset database demo data
  async resetData() {
    return safeFetch('/reset-data', { method: 'POST' });
  }
};
