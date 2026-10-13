// Base API URL configuration - supports Web, Native Android APK & Cloud backend
export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('edutrack_server_url');
    if (savedUrl) {
      return savedUrl.replace(/\/$/, '') + '/api';
    }
    // Detect Capacitor native platform or mobile webview running on localhost without dev port
    const isNativeMobile = 
      Boolean(window.Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === 'file:' ||
      window.location.origin.includes('capacitor://') ||
      (window.location.hostname === 'localhost' && !window.location.port) ||
      (window.location.origin === 'https://localhost');

    if (isNativeMobile) {
      return 'https://tuition-tracker12.onrender.com/api';
    }
  }
  return '/api';
};

const getUrl = (path) => `${getApiBase()}${path}`;

async function safeFetch(path, options = {}, fallback = null) {
  try {
    const url = getUrl(path);
    const res = await fetch(url, options);
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
    return safeFetch('/stats/summary', {}, {
      totalStudents: 12,
      activeBatches: 5,
      monthlyRevenue: 45000,
      attendanceRate: 94
    });
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
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ব্যবহারকারী ডিলিট ব্যর্থ হয়েছে');
    }
    return data;
  },

  async updateUser(id, userData) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ব্যবহারকারী আপডেট ব্যর্থ হয়েছে');
    }
    return data;
  },

  // Classes
  async getClasses(teacherId) {
    const url = teacherId ? `${API_BASE}/classes?teacherId=${teacherId}` : `${API_BASE}/classes`;
    const res = await fetch(url);
    return res.json();
  },

  async createClass(classData) {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ক্লাস তৈরি ব্যর্থ হয়েছে');
    }
    return data;
  },

  async updateClass(id, updates) {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ক্লাস আপডেট ব্যর্থ হয়েছে');
    }
    return data;
  },

  async deleteClass(id) {
    const res = await fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ক্লাস ডিলিট ব্যর্থ হয়েছে');
    }
    return data;
  },

  // Enrollments
  async getEnrollments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/enrollments${query ? `?${query}` : ''}`);
    return res.json();
  },

  async enrollStudent(classId, studentId) {
    const res = await fetch(`${API_BASE}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, studentId }),
    });
    return res.json();
  },

  async cancelEnrollment(id) {
    const res = await fetch(`${API_BASE}/enrollments/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Attendance
  async getAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/attendance${query ? `?${query}` : ''}`);
    return res.json();
  },

  async saveAttendance(records) {
    const res = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.isArray(records) ? { records } : records),
    });
    return res.json();
  },

  // Invoices & Payments
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/invoices${query ? `?${query}` : ''}`);
    return res.json();
  },

  async createInvoice(invoiceData) {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    return res.json();
  },

  async processPayment(paymentPayload) {
    const res = await fetch(`${API_BASE}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    });
    return res.json();
  },

  // Messages
  async getMessages(user1, user2) {
    let url = `${API_BASE}/messages`;
    if (user1 && user2) {
      url += `?user1=${user1}&user2=${user2}`;
    } else if (user1) {
      url += `?user1=${user1}`;
    }
    const res = await fetch(url);
    return res.json();
  },

  async sendMessage(messageData) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });
    return res.json();
  },

  async markMessageRead(id) {
    const res = await fetch(`${API_BASE}/messages/${id}/read`, { method: 'PUT' });
    return res.json();
  },

  async markMessageAsRead(id) {
    return this.markMessageRead(id);
  },

  // Notifications & Phone SMS Alerts
  async getNotifications(userId) {
    const url = userId ? `${API_BASE}/notifications?userId=${userId}` : `${API_BASE}/notifications`;
    const res = await fetch(url);
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
    return res.json();
  },

  async markAllNotificationsRead(userId) {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async sendClassReminder(classId) {
    const res = await fetch(`${API_BASE}/notifications/send-class-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId }),
    });
    return res.json();
  },

  async getSmsLogs() {
    const res = await fetch(`${API_BASE}/notifications/sms-logs`);
    return res.json();
  },

  async sendCustomSms(payload) {
    const res = await fetch(`${API_BASE}/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Assignments & Submissions
  async getAssignments(classId) {
    const url = classId ? `${API_BASE}/assignments?classId=${classId}` : `${API_BASE}/assignments`;
    const res = await fetch(url);
    return res.json();
  },

  async createAssignment(assignmentData) {
    const res = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentData),
    });
    return res.json();
  },

  async getSubmissions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/submissions${query ? `?${query}` : ''}`);
    return res.json();
  },

  async submitAssignment(submissionData) {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });
    return res.json();
  },

  async gradeSubmission(id, score, feedback) {
    const res = await fetch(`${API_BASE}/submissions/${id}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback }),
    });
    return res.json();
  },

  // Exam Marks
  async getExamMarks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/exam-marks${query ? `?${query}` : ''}`);
    return res.json();
  },

  async addExamMark(markData) {
    const res = await fetch(`${API_BASE}/exam-marks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markData),
    });
    return res.json();
  },

  // Announcements
  async getAnnouncements(classId) {
    const url = classId ? `${API_BASE}/announcements?classId=${classId}` : `${API_BASE}/announcements`;
    const res = await fetch(url);
    return res.json();
  },

  async createAnnouncement(data) {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Settings (Currency)
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Time Change Requests
  async getTimeRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/time-requests${query ? `?${query}` : ''}`);
    return res.json();
  },

  async createTimeRequest(requestData) {
    const res = await fetch(`${API_BASE}/time-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    return res.json();
  },

  async respondTimeRequest(id, status, teacherResponse = '') {
    const res = await fetch(`${API_BASE}/time-requests/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, teacherResponse }),
    });
    return res.json();
  },

  // Gmail OTP Verification
  async sendOtp(email, name = '') {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    return res.json();
  },

  async verifyOtp(email, otp) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },

  async getSmtpConfig() {
    const res = await fetch(`${API_BASE}/settings/smtp`);
    return res.json();
  },

  async updateSmtpConfig(config) {
    const res = await fetch(`${API_BASE}/settings/smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  // SSLCommerz Gateway
  async initSSLCommerz(invoiceId, customerDetails = {}) {
    const res = await fetch(`${API_BASE}/payments/sslcommerz/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, ...customerDetails }),
    });
    return res.json();
  },

  async validateSSLCommerz(payload) {
    const res = await fetch(`${API_BASE}/payments/sslcommerz/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Deductions (Fee reduction when teacher skips)
  async getDeductions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/deductions${query ? `?${query}` : ''}`);
    return res.json();
  },

  // Monthly Attendance & HW Reports
  async getMonthlyReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports/monthly${query ? `?${query}` : ''}`);
    return res.json();
  },

  // Study Notes & Lecture Materials
  async getStudyNotes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/study-notes${query ? `?${query}` : ''}`);
    return res.json();
  },

  async createStudyNote(data) {
    const res = await fetch(`${API_BASE}/study-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteStudyNote(id) {
    const res = await fetch(`${API_BASE}/study-notes/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Home Tuition Location Tracking
  async getTuitionLocations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/tuition-location${query ? `?${query}` : ''}`);
    return res.json();
  },

  async updateTuitionLocation(data) {
    const res = await fetch(`${API_BASE}/tuition-location/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async checkInTuitionLocation(data) {
    const res = await fetch(`${API_BASE}/tuition-location/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async checkOutTuitionLocation(data) {
    const res = await fetch(`${API_BASE}/tuition-location/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Exam Schedules & Timetables
  async getExamSchedules(classId) {
    const url = classId ? `${API_BASE}/exam-schedules?classId=${classId}` : `${API_BASE}/exam-schedules`;
    const res = await fetch(url);
    return res.json();
  },

  async createExamSchedule(data) {
    const res = await fetch(`${API_BASE}/exam-schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateExamSchedule(id, updates) {
    const res = await fetch(`${API_BASE}/exam-schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteExamSchedule(id) {
    const res = await fetch(`${API_BASE}/exam-schedules/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Performance Rewards & XP
  async getRewards(studentId) {
    const url = studentId ? `${API_BASE}/rewards?studentId=${studentId}` : `${API_BASE}/rewards`;
    const res = await fetch(url);
    return res.json();
  },

  async claimRewardVoucher(studentId, voucherId) {
    const res = await fetch(`${API_BASE}/rewards/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, voucherId }),
    });
    return res.json();
  },

  async awardRewardXP(studentId, xpAmount, reason, badge) {
    const res = await fetch(`${API_BASE}/rewards/award-xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, xpAmount, reason, badge }),
    });
    return res.json();
  },

  // Parent Multi-Role Linking
  async getParentStudents(parentId) {
    const res = await fetch(`${API_BASE}/parents/${parentId}/students`);
    return res.json();
  },

  async parentApproveReschedule(requestId, parentId, notes) {
    const res = await fetch(`${API_BASE}/time-requests/${requestId}/parent-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, notes }),
    });
    return res.json();
  },

  // Home Tuition Marketplace & Requests
  async getTuitionRequests(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/tuition-requests${q ? '?' + q : ''}`);
    return res.json();
  },

  async createTuitionRequest(requestData) {
    const res = await fetch(`${API_BASE}/tuition-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    return res.json();
  },

  async respondToTuitionRequest(id, responseData) {
    const res = await fetch(`${API_BASE}/tuition-requests/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseData),
    });
    return res.json();
  },

  async getTutors(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/tutors${q ? '?' + q : ''}`);
    return res.json();
  },

  // Reset database demo data
  async resetData() {
    const res = await fetch(`${API_BASE}/reset-data`, { method: 'POST' });
    return res.json();
  }
};
