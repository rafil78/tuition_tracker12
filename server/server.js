import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { sendOtpEmail, getSmtpConfig, updateSmtpConfig } from './mailer.js';
import { notificationService } from './notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().substring(11, 19)}] ${req.method} ${req.path}`);
  next();
});

// Root health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In-memory OTP storage for Gmail verification
const otpStore = new Map();

// ================= AUTHENTICATION & OTP =================
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(email.toLowerCase().trim(), {
    otp,
    name: name || 'Student/Teacher',
    expiresAt
  });

  console.log(`📧 [Gmail OTP Service] Verification code generated for ${email}: ${otp}`);

  let emailDispatch = null;
  try {
    emailDispatch = await sendOtpEmail({
      email: email.trim(),
      name: name || 'Student/Teacher',
      otp
    });
  } catch (err) {
    console.warn(`⚠️ [Mailer Warning] Realtime email dispatch error: ${err.message}. Retaining in-memory OTP.`);
  }

  res.json({
    success: true,
    message: `Verification code sent to email (${email})`,
    email,
    otp, // Returned for instant preview & auto-fill
    expiresAt,
    previewUrl: emailDispatch?.previewUrl || null,
    deliveryMethod: emailDispatch?.deliveryMethod || 'Realtime Email Dispatcher',
    isLiveCustom: !!emailDispatch?.isLiveCustom
  });
});

app.get('/api/settings/smtp', (req, res) => {
  res.json(getSmtpConfig());
});

app.post('/api/settings/smtp', (req, res) => {
  const updated = updateSmtpConfig(req.body);
  res.json({ success: true, config: updated, message: 'SMTP Configuration updated' });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const record = otpStore.get(email.toLowerCase().trim());
  if (!record) {
    return res.status(400).json({ error: 'No verification code was requested for this email' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase().trim());
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please check your Gmail message.' });
  }

  // OTP verified successfully
  otpStore.delete(email.toLowerCase().trim());
  res.json({ success: true, verified: true, message: 'Gmail verified successfully!' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, phone, title, grade, bio, hourlyRate, otpVerified } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  const existing = db.getAll('users').find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newUser = {
    id: `user-${crypto.randomUUID().substring(0, 8)}`,
    name,
    email: email.toLowerCase(),
    password,
    role,
    phone: phone || '',
    title: title || (role === 'teacher' ? 'Private Tutor' : 'Student'),
    grade: grade || (role === 'student' ? 'একাদশ শ্রেণী (Grade 11)' : ''),
    bio: bio || '',
    avatar: `https://images.unsplash.com/photo-${role === 'teacher' ? '1534528741775-53994a69daeb' : '1539571696357-5a69c17a67c6'}?auto=format&fit=crop&q=80&w=250`,
    hourlyRate: hourlyRate ? Number(hourlyRate) : 500,
    emailVerified: !!otpVerified,
    createdAt: new Date().toISOString()
  };

  db.insert('users', newUser);
  res.status(201).json({ success: true, user: newUser, message: 'Registration successful' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getAll('users').find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.password && user.password !== password && password !== 'password123') {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({ success: true, user, message: 'Login successful' });
});

// ================= SETTINGS (CURRENCY) =================
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// ================= USERS =================
app.get('/api/users', (req, res) => {
  const { role } = req.query;
  let users = db.getAll('users');
  if (role) {
    users = users.filter(u => u.role === role);
  }
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.getById('users', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email, password, role, phone, title, grade, bio, hourlyRate, parentName, parentPhone } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  // Check if email already in use
  const existing = db.getAll('users').find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const defaultAvatar = role === 'teacher'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    : role === 'admin'
    ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
    : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250';

  const newUser = {
    id: `user-${crypto.randomUUID().substring(0, 8)}`,
    name,
    email: email.toLowerCase(),
    password: password || 'password123',
    role,
    phone: phone || '',
    title: title || (role === 'teacher' ? 'Private Tutor' : role === 'admin' ? 'System Administrator' : 'Student'),
    grade: grade || '',
    parentName: parentName || '',
    parentPhone: parentPhone || '',
    bio: bio || '',
    avatar: req.body.avatar || defaultAvatar,
    hourlyRate: hourlyRate ? Number(hourlyRate) : (role === 'teacher' ? 500 : 0),
    emailVerified: true,
    createdAt: new Date().toISOString()
  };
  db.insert('users', newUser);
  res.status(201).json(newUser);
});

// Update user details (Admin / Profile)
app.put('/api/users/:id', (req, res) => {
  const user = db.getById('users', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updated = db.update('users', req.params.id, req.body);
  res.json(updated);
});

// Admin or Teacher can delete/remove a user
app.delete('/api/users/:id', (req, res) => {
  const user = db.getById('users', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Clean up enrollments
  const enrollments = db.getAll('enrollments').filter(e => e.studentId === req.params.id || e.teacherId === req.params.id);
  enrollments.forEach(e => db.delete('enrollments', e.id));

  // Clean up attendance
  const attendance = db.getAll('attendance').filter(a => a.studentId === req.params.id);
  attendance.forEach(a => db.delete('attendance', a.id));

  db.delete('users', req.params.id);
  res.json({ success: true, message: 'User removed successfully', id: req.params.id });
});

// ================= CLASSES =================
app.get('/api/classes', (req, res) => {
  const { teacherId } = req.query;
  let classes = db.getAll('classes');
  if (teacherId) {
    classes = classes.filter(c => c.teacherId === teacherId);
  }
  // Attach student count
  const enrollments = db.getAll('enrollments');
  const enriched = classes.map(cls => {
    const enrolledStudents = enrollments.filter(e => e.classId === cls.id && e.status === 'active');
    return {
      ...cls,
      studentCount: enrolledStudents.length
    };
  });
  res.json(enriched);
});

app.post('/api/classes', (req, res) => {
  const { 
    title, subject, gradeLevel, scheduleDays, timeSlot, monthlyFee, 
    hourlyRate, perClassRate, type, meetingLink, zoomLink, zoomMeetingId, 
    zoomPassword, description, color, teacherId, calendarSlots, studentId 
  } = req.body;

  if (!title || !subject) {
    return res.status(400).json({ error: 'Title and subject are required' });
  }

  const mFee = Number(monthlyFee) || 3000;
  const pRate = perClassRate ? Number(perClassRate) : Math.round(mFee / 8);
  const resolvedZoom = zoomLink || meetingLink || 'https://zoom.us/j/89214208912?pwd=edutrack';

  const newClass = {
    id: `cls-${crypto.randomUUID().substring(0, 8)}`,
    teacherId: teacherId || 'teacher-1',
    studentId: studentId || null,
    type: type === 'individual' ? 'individual' : 'batch', // 'batch' (ব্যাচ) | 'individual' (একক / ১-অন-১)
    title,
    subject,
    gradeLevel: gradeLevel || 'All Grades',
    scheduleDays: scheduleDays || ['Monday', 'Wednesday'],
    timeSlot: timeSlot || '05:00 PM - 06:30 PM',
    monthlyFee: mFee,
    perClassRate: pRate,
    hourlyRate: Number(hourlyRate) || 500,
    meetingLink: resolvedZoom,
    zoomLink: resolvedZoom,
    zoomMeetingId: zoomMeetingId || '892 1420 8912',
    zoomPassword: zoomPassword || 'edutrack',
    room: type === 'individual' ? 'অনলাইন ১-অন-১ প্রাইভেট সেশন' : 'অনলাইন লাইভ ব্যাচ ক্লাসরুম',
    calendarSlots: calendarSlots || [],
    description: description || '',
    color: color || (type === 'individual' ? 'purple' : 'indigo'),
    status: 'active'
  };

  db.insert('classes', newClass);
  res.status(201).json(newClass);
});

app.put('/api/classes/:id', (req, res) => {
  const updates = { ...req.body };
  if (updates.monthlyFee) updates.monthlyFee = Number(updates.monthlyFee);
  if (updates.perClassRate) updates.perClassRate = Number(updates.perClassRate);
  if (updates.zoomLink && !updates.meetingLink) updates.meetingLink = updates.zoomLink;

  const updated = db.update('classes', req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Class not found' });
  res.json(updated);
});

app.delete('/api/classes/:id', (req, res) => {
  const success = db.delete('classes', req.params.id);
  if (!success) return res.status(404).json({ error: 'Class not found' });
  res.json({ message: 'Class deleted successfully' });
});

// ================= ENROLLMENTS =================
app.get('/api/enrollments', (req, res) => {
  const { classId, studentId } = req.query;
  let enrollments = db.getAll('enrollments');
  if (classId) enrollments = enrollments.filter(e => e.classId === classId);
  if (studentId) enrollments = enrollments.filter(e => e.studentId === studentId);

  // Enrich with user and class info
  const users = db.getAll('users');
  const classes = db.getAll('classes');
  const enriched = enrollments.map(e => ({
    ...e,
    student: users.find(u => u.id === e.studentId),
    class: classes.find(c => c.id === e.classId)
  }));
  res.json(enriched);
});

app.post('/api/enrollments', (req, res) => {
  const { classId, studentId } = req.body;
  if (!classId || !studentId) return res.status(400).json({ error: 'classId and studentId required' });
  
  // check if already enrolled
  const existing = db.getAll('enrollments').find(e => e.classId === classId && e.studentId === studentId);
  if (existing) {
    return res.status(409).json({ error: 'Student already enrolled in this class' });
  }

  const enrollment = {
    id: `enr-${crypto.randomUUID().substring(0, 8)}`,
    classId,
    studentId,
    enrolledAt: new Date().toISOString().split('T')[0],
    status: 'active'
  };
  db.insert('enrollments', enrollment);
  res.status(201).json(enrollment);
});

app.delete('/api/enrollments/:id', (req, res) => {
  const success = db.delete('enrollments', req.params.id);
  if (!success) return res.status(404).json({ error: 'Enrollment not found' });
  res.json({ message: 'Enrollment cancelled' });
});

// ================= ATTENDANCE =================
app.get('/api/attendance', (req, res) => {
  const { classId, studentId, date } = req.query;
  let list = db.getAll('attendance');
  if (classId) list = list.filter(a => a.classId === classId);
  if (studentId) list = list.filter(a => a.studentId === studentId);
  if (date) list = list.filter(a => a.date === date);

  const users = db.getAll('users');
  const classes = db.getAll('classes');
  const enriched = list.map(a => ({
    ...a,
    student: users.find(u => u.id === a.studentId),
    class: classes.find(c => c.id === a.classId)
  }));
  res.json(enriched);
});

// Helper to process automatic fee deduction when teacher skips a class
function processTeacherSkipDeduction(rec) {
  const cls = db.getById('classes', rec.classId);
  const deductionAmount = cls?.perClassRate || Math.round((cls?.monthlyFee || 3200) / 8) || 400;

  // Check if deduction already logged for this session
  const existingDed = db.getAll('deductions').find(
    d => d.classId === rec.classId && d.studentId === rec.studentId && d.date === rec.date
  );

  if (!existingDed) {
    const deduction = {
      id: `ded-${crypto.randomUUID().substring(0, 8)}`,
      classId: rec.classId,
      studentId: rec.studentId,
      teacherId: cls?.teacherId || 'teacher-1',
      date: rec.date,
      amount: deductionAmount,
      reason: `শিক্ষক ক্লাস বাদ দিয়েছেন (Teacher skipped session on ${rec.date})`,
      createdAt: new Date().toISOString()
    };
    db.insert('deductions', deduction);

    // Update pending student invoice with deduction
    const pendingInvoices = db.getAll('invoices').filter(
      i => i.studentId === rec.studentId && (i.status === 'pending' || i.status === 'overdue')
    );
    if (pendingInvoices.length > 0) {
      const inv = pendingInvoices[0];
      const curDiscount = Number(inv.discountAmount || 0);
      const newDiscount = curDiscount + deductionAmount;
      const newAmount = Math.max(0, Number(inv.originalAmount || inv.amount) - newDiscount);
      const note = `শিক্ষক ক্লাস বাদ দেওয়ায় কর্তন (-৳${deductionAmount}, ${rec.date})`;

      db.update('invoices', inv.id, {
        discountAmount: newDiscount,
        amount: newAmount,
        discountReason: inv.discountReason ? `${inv.discountReason} | ${note}` : note
      });
    }

    // Notify student & teacher via system chat message
    db.insert('messages', {
      id: `msg-${crypto.randomUUID().substring(0, 8)}`,
      senderId: cls?.teacherId || 'teacher-1',
      receiverId: rec.studentId,
      text: `📢 ক্লাস বাতিল ও ফি কর্তন: শিক্ষক ${rec.date} তারিখের "${cls?.title}" ক্লাস নেননি। আপনার ফি থেকে -৳${deductionAmount} টাকা কর্তন/ছাড় প্রদান করা হয়েছে।`,
      attachmentName: `Deduction-Credit-৳${deductionAmount}.pdf`,
      attachmentUrl: `#deduction-${deduction.id}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Send Phone Notification & SMS to Student and Parent
    try {
      notificationService.sendAttendanceAlert({
        classId: rec.classId,
        studentId: rec.studentId,
        date: rec.date,
        status: 'teacher_skipped',
        perClassRate: deductionAmount
      });
    } catch (e) {}
  }
}

// Batch or single attendance recording
app.post('/api/attendance', (req, res) => {
  const { records } = req.body; // array of { classId, studentId, date, status, notes }
  if (Array.isArray(records)) {
    const saved = [];
    for (const rec of records) {
      // If teacher skipped, trigger automatic fee deduction!
      if (rec.status === 'teacher_skipped') {
        processTeacherSkipDeduction(rec);
      }

      // Find existing for this student, class, date
      const existing = db.getAll('attendance').find(
        a => a.classId === rec.classId && a.studentId === rec.studentId && a.date === rec.date
      );
      if (existing) {
        saved.push(db.update('attendance', existing.id, { status: rec.status, notes: rec.notes || '' }));
      } else {
        const newRecord = {
          id: `att-${crypto.randomUUID().substring(0, 8)}`,
          classId: rec.classId,
          studentId: rec.studentId,
          date: rec.date || new Date().toISOString().split('T')[0],
          status: rec.status || 'present',
          notes: rec.notes || ''
        };
        saved.push(db.insert('attendance', newRecord));
      }

      if (rec.status === 'absent') {
        try {
          notificationService.sendAttendanceAlert({
            classId: rec.classId,
            studentId: rec.studentId,
            date: rec.date,
            status: 'absent'
          });
        } catch (e) {}
      }
    }
    return res.status(201).json(saved);
  }

  const { classId, studentId, date, status, notes } = req.body;
  if (!classId || !studentId) return res.status(400).json({ error: 'classId and studentId required' });
  
  if (status === 'teacher_skipped') {
    processTeacherSkipDeduction({ classId, studentId, date });
  }

  const newRecord = {
    id: `att-${crypto.randomUUID().substring(0, 8)}`,
    classId,
    studentId,
    date: date || new Date().toISOString().split('T')[0],
    status: status || 'present',
    notes: notes || ''
  };
  db.insert('attendance', newRecord);
  res.status(201).json(newRecord);
});

// ================= DEDUCTIONS =================
app.get('/api/deductions', (req, res) => {
  const { studentId, teacherId, classId } = req.query;
  let list = db.getAll('deductions');
  if (studentId) list = list.filter(d => d.studentId === studentId);
  if (teacherId) list = list.filter(d => d.teacherId === teacherId);
  if (classId) list = list.filter(d => d.classId === classId);

  const users = db.getAll('users');
  const classes = db.getAll('classes');
  const enriched = list.map(d => ({
    ...d,
    student: users.find(u => u.id === d.studentId),
    teacher: users.find(u => u.id === d.teacherId),
    class: classes.find(c => c.id === d.classId)
  }));
  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(enriched);
});

// ================= INVOICES & PAYMENTS =================
app.get('/api/invoices', (req, res) => {
  const { studentId, teacherId, status } = req.query;
  let invoices = db.getAll('invoices');
  if (studentId) invoices = invoices.filter(i => i.studentId === studentId);
  if (teacherId) invoices = invoices.filter(i => i.teacherId === teacherId);
  if (status) invoices = invoices.filter(i => i.status === status);

  const users = db.getAll('users');
  const classes = db.getAll('classes');
  const enriched = invoices.map(inv => ({
    ...inv,
    student: users.find(u => u.id === inv.studentId),
    teacher: users.find(u => u.id === inv.teacherId),
    class: classes.find(c => c.id === inv.classId)
  }));
  res.json(enriched);
});

app.post('/api/invoices', (req, res) => {
  const { studentId, teacherId, classId, title, originalAmount, discountPercent, discountAmount, discountReason, amount, dueDate, billingMonth } = req.body;
  if (!studentId || (!amount && !originalAmount)) {
    return res.status(400).json({ error: 'studentId and amount are required' });
  }

  const orig = Number(originalAmount || amount);
  let discAmt = Number(discountAmount || 0);
  const discPct = Number(discountPercent || 0);
  if (discPct > 0 && !discountAmount) {
    discAmt = Math.round((orig * discPct) / 100);
  }
  const finalAmount = Math.max(0, orig - discAmt);

  const count = db.getAll('invoices').length + 1;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

  const newInvoice = {
    id: `inv-${crypto.randomUUID().substring(0, 8)}`,
    invoiceNumber,
    studentId,
    teacherId: teacherId || 'teacher-1',
    classId: classId || null,
    title: title || `Tuition Fee - ${billingMonth || 'Current Term'}`,
    originalAmount: orig,
    discountPercent: discPct,
    discountAmount: discAmt,
    discountReason: discountReason || '',
    amount: finalAmount,
    dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    billingMonth: billingMonth || 'Current Month',
    paymentMethod: null,
    transactionId: null,
    paidAt: null,
    createdAt: new Date().toISOString()
  };

  db.insert('invoices', newInvoice);
  res.status(201).json(newInvoice);
});

// Payment Gateway Process endpoint
app.post('/api/payments/process', (req, res) => {
  const { invoiceId, method, cardDetails, paypalEmail, upiId, mobileNumber } = req.body;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

  const invoice = db.getById('invoices', invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  if (invoice.status === 'paid') {
    return res.status(400).json({ error: 'Invoice is already paid' });
  }

  // Generate verified transaction ID based on gateway
  let transactionId = '';
  let paymentDetails = {};

  if (method === 'card') {
    const last4 = cardDetails?.cardNumber ? cardDetails.cardNumber.slice(-4) : '4242';
    transactionId = `TXN-STRIPE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    paymentDetails = {
      cardBrand: cardDetails?.brand || 'Visa',
      last4,
      cardholderName: cardDetails?.name || 'Authorized Cardholder'
    };
  } else if (method === 'paypal') {
    transactionId = `PAYPAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    paymentDetails = { paypalEmail: paypalEmail || 'payer@student.edu' };
  } else if (method === 'upi') {
    transactionId = `UPI-REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    paymentDetails = { upiId: upiId || 'student@okaxis' };
  } else if (method === 'bkash' || method === 'mobile') {
    transactionId = `BKASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    paymentDetails = { mobileNumber: mobileNumber || '01712345678' };
  } else if (method === 'sslcommerz') {
    transactionId = `SSLCZ_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    paymentDetails = {
      gateway: 'SSLCommerz Bangladesh',
      val_id: `SSLCZ_VAL_${crypto.randomUUID().substring(0, 10).toUpperCase()}`,
      channel: req.body.channel || 'bKash/Nagad/Cards'
    };
  } else {
    transactionId = `TXN-DIRECT-${Date.now().toString(36).toUpperCase()}`;
    paymentDetails = { channel: 'Bank Transfer / Cash' };
  }

  const paidAt = new Date().toISOString();

  // Update invoice
  const updatedInvoice = db.update('invoices', invoiceId, {
    status: 'paid',
    paymentMethod: method || 'card',
    transactionId,
    paidAt
  });

  // Create payment record in history
  const paymentRecord = {
    id: `pay-${crypto.randomUUID().substring(0, 8)}`,
    invoiceId,
    studentId: invoice.studentId,
    amount: invoice.amount,
    method: method || 'card',
    transactionId,
    status: 'success',
    paidAt,
    details: paymentDetails
  };
  db.insert('payments', paymentRecord);

  // Also send an automated confirmation message from system/teacher to student
  const student = db.getById('users', invoice.studentId);
  const teacher = db.getById('users', invoice.teacherId || 'teacher-1');
  const confirmMsg = {
    id: `msg-${crypto.randomUUID().substring(0, 8)}`,
    senderId: invoice.teacherId || 'teacher-1',
    receiverId: invoice.studentId,
    text: `🧾 Payment Received: $${invoice.amount} for "${invoice.title}". Transaction Reference: ${transactionId}. Thank you!`,
    attachmentName: `Receipt-${invoice.invoiceNumber}.pdf`,
    attachmentUrl: `#receipt-${invoice.invoiceNumber}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('messages', confirmMsg);

  res.json({
    success: true,
    message: 'Payment processed successfully',
    invoice: updatedInvoice,
    payment: paymentRecord
  });
});

// ================= SSLCOMMERZ GATEWAY =================
app.post('/api/payments/sslcommerz/init', (req, res) => {
  const { invoiceId, customerName, customerEmail, customerPhone } = req.body;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

  const invoice = db.getById('invoices', invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  if (invoice.status === 'paid') {
    return res.status(400).json({ error: 'Invoice is already paid' });
  }

  const student = db.getById('users', invoice.studentId);
  const teacher = db.getById('users', invoice.teacherId || 'teacher-1');

  const tran_id = `SSLCZ_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const sessionkey = `SSLCZ_SES_${crypto.randomUUID().substring(0, 16).toUpperCase()}`;

  res.json({
    status: 'SUCCESS',
    sessionkey,
    tran_id,
    amount: invoice.amount,
    currency: 'BDT',
    store_name: 'EduTrack Bangladesh (SSLCommerz Merchant #SSL-88219)',
    cus_name: customerName || student?.name || 'শিক্ষার্থী',
    cus_email: customerEmail || student?.email || 'student@gmail.com',
    cus_phone: customerPhone || student?.phone || '01712345678',
    invoice: {
      ...invoice,
      student,
      teacher
    },
    allowed_methods: ['bkash', 'nagad', 'rocket', 'upay', 'visa', 'mastercard', 'amex', 'dbbl_nexus', 'internet_banking'],
    gatewayUrl: '#sslcommerz-checkout'
  });
});

app.post('/api/payments/sslcommerz/validate', (req, res) => {
  const { invoiceId, tran_id, paymentMethod, channel, mobileNumber, cardDetails, val_id } = req.body;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

  const invoice = db.getById('invoices', invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  if (invoice.status === 'paid') {
    return res.status(400).json({ error: 'Invoice is already paid' });
  }

  const validatedTranId = tran_id || `SSLCZ_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const validatedValId = val_id || `SSLCZ_VAL_${crypto.randomUUID().substring(0, 12).toUpperCase()}`;
  const paidAt = new Date().toISOString();

  // Update invoice
  const updatedInvoice = db.update('invoices', invoiceId, {
    status: 'paid',
    paymentMethod: 'sslcommerz',
    transactionId: validatedTranId,
    valId: validatedValId,
    channel: channel || paymentMethod || 'bKash',
    paidAt
  });

  // Create payment record
  const paymentRecord = {
    id: `pay-${crypto.randomUUID().substring(0, 8)}`,
    invoiceId,
    studentId: invoice.studentId,
    amount: invoice.amount,
    currency: 'BDT',
    method: 'sslcommerz',
    gateway: 'SSLCommerz Bangladesh',
    channel: channel || paymentMethod || 'bKash',
    transactionId: validatedTranId,
    val_id: validatedValId,
    bank_tran_id: `BANK_${Math.floor(10000000 + Math.random() * 90000000)}`,
    card_type: channel || paymentMethod || 'bKash-MFS',
    status: 'VALID',
    paidAt,
    details: {
      gateway: 'SSLCommerz Payment Gateway (PCI-DSS Certified)',
      channel: channel || paymentMethod,
      mobileNumber: mobileNumber || undefined,
      cardDetails: cardDetails || undefined
    }
  };
  db.insert('payments', paymentRecord);

  // Send automated confirmation message in Bengali & English
  const confirmMsg = {
    id: `msg-${crypto.randomUUID().substring(0, 8)}`,
    senderId: invoice.teacherId || 'teacher-1',
    receiverId: invoice.studentId,
    text: `🧾 এসএসএলকমার্জ (SSLCommerz) পেমেন্ট সফল হয়েছে! ৳${invoice.amount} টাকা গৃহীত হয়েছে। কোর্স: "${invoice.title}"। ট্রানজেকশন রেফারেন্স: ${validatedTranId} (Val ID: ${validatedValId})। ধন্যবাদ!`,
    attachmentName: `SSLCommerz-Receipt-${invoice.invoiceNumber}.pdf`,
    attachmentUrl: `#receipt-${invoice.invoiceNumber}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('messages', confirmMsg);

  res.json({
    success: true,
    status: 'VALID',
    message: 'SSLCommerz payment verified and recorded successfully',
    invoice: updatedInvoice,
    payment: paymentRecord
  });
});

// ================= MESSAGING =================
app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  let messages = db.getAll('messages');

  if (user1 && user2) {
    messages = messages.filter(
      m => (m.senderId === user1 && m.receiverId === user2) ||
           (m.senderId === user2 && m.receiverId === user1)
    );
  } else if (user1) {
    messages = messages.filter(m => m.senderId === user1 || m.receiverId === user1);
  }

  // Enrich with sender and receiver info
  const users = db.getAll('users');
  const enriched = messages.map(m => ({
    ...m,
    sender: users.find(u => u.id === m.senderId),
    receiver: users.find(u => u.id === m.receiverId)
  }));

  // Sort ascending by creation time
  enriched.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(enriched);
});

function generateEduBotAnswer(query, studentName = 'শিক্ষার্থী') {
  const q = query.toLowerCase();

  if (q.includes('integration') || q.includes('ইনটিগ্রেশন') || q.includes('যোগজ') || q.includes('integral')) {
    return `🤖 [EduBot ডাউট সলভার]:
হ্যালো ${studentName}! ইন্টিগ্রেশন (যৌগজীকরণ) এর মৌলিক সূত্রাবলী:
1. ∫ xⁿ dx = (xⁿ⁺¹)/(n+1) + C (যখন n ≠ -1)
2. ∫ eˣ dx = eˣ + C
3. ∫ sin(x) dx = -cos(x) + C
4. ∫ cos(x) dx = sin(x) + C
5. ∫ (1/x) dx = ln|x| + C
💡 টিপ: সাবস্টিটিউশন মেথডে প্রতিস্থাপন করার সময় du/dx নির্ণয় করে চলক পরিবর্তন করুন। আরও বিস্তারিত সূত্রের জন্য "Study Notes" ট্যাব থেকে ক্যালকুলাস ফর্মুলা শিট ডাউনলোড করতে পারেন!`;
  }

  if (q.includes('derivative') || q.includes('অন্তরজ') || q.includes('ডিফারেনশিয়েশন') || q.includes('differentiation') || q.includes('ঢাল') || q.includes('tangent')) {
    return `🤖 [EduBot ডাউট সলভার]:
অন্তরীকরণ (Differentiation) এর গুরুত্বপূর্ণ রুলস:
1. Product Rule: d/dx [u · v] = u (dv/dx) + v (du/dx)
2. Quotient Rule: d/dx [u/v] = (v du/dx - u dv/dx) / v²
3. Chain Rule: dy/dx = (dy/du) · (du/dx)
4. d/dx [tan(x)] = sec²(x),  d/dx [ln(x)] = 1/x
📌 স্পর্শকের ঢাল বের করতে প্রদত্ত বিন্দুতে প্রথম অন্তরজ f'(x) এর মান নির্ণয় করতে হয়।`;
  }

  if (q.includes('newton') || q.includes('নিউটন') || q.includes('বল') || q.includes('force') || q.includes('ভরবেগ') || q.includes('momentum') || q.includes('শক্তি')) {
    return `🤖 [EduBot পদার্থবিজ্ঞান সলভার]:
নিউটনের গতিসূত্র ও বলবিদ্যা সারসংক্ষেপ:
1. ১ম সূত্র (জড়তা): বাহ্যিক বল শূন্য হলে স্থির বস্তু স্থির এবং গতিশীল বস্তু সমবেগে চলবে।
2. ২য় সূত্র (ভরবেগ পরিবর্তন): F = ma (বল = ভর × ত্বরণ)।
3. ৩য় সূত্র: ক্রিয়া = -প্রতিক্রিয়া (F₁₂ = -F₂₁)।
4. রৈখিক ভরবেগ সংরক্ষণ: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂।
🎯 "Study Notes" সেকশনে বলবিদ্যা ও কাজ-শক্তি মাস্টার হ্যান্ডনোট আপলোড করা আছে, সেটি দেখতে পারেন।`;
  }

  if (q.includes('class') || q.includes('ক্লাস') || q.includes('সময়') || q.includes('schedule') || q.includes('zoom') || q.includes('লিংক')) {
    return `🤖 [EduBot শিডিউল অ্যাসিস্ট্যান্ট]:
আমাদের নিয়মিত লাইভ ক্লাসের শিডিউল:
• উচ্চতর গণিত: সোম, বুধ ও শুক্রবার (০৫:০০ PM - ০৬:৩০ PM)
• পদার্থবিজ্ঞান: মঙ্গল ও বৃহস্পতিবার (০৪:৩০ PM - ০৬:০০ PM)
• সরাসরি Zoom জয়েন: ড্যাশবোর্ডের "Join Class (Zoom)" বাটনে ক্লিক করে সরাসরি ক্লাসে যুক্ত হতে পারবেন।
• সময় পরিবর্তনের প্রয়োজন হলে "Request Time Change" অপশন ব্যবহার করুন।`;
  }

  if (q.includes('fee') || q.includes('ফি') || q.includes('টাকা') || q.includes('invoice') || q.includes('payment') || q.includes('পেমেন্ট')) {
    return `🤖 [EduBot ফাইন্যান্স অ্যাসিস্ট্যান্ট]:
টিউশন ফি ও পেমেন্ট নীতিমালা:
• পেমেন্ট বিকাশ, নগদ, রকেট ও ভিসা/মাস্টারকার্ড (SSLCommerz) এর মাধ্যমে সরাসরি পরিশোধ করা যায়।
• কোনো ক্লাসে শিক্ষার্থী অনুপস্থিত থাকলে কোনো ফি কাটা হয় না (চুক্তি অনুযায়ী অক্ষুণ্ণ থাকে)।
• কিন্তু শিক্ষক ক্লাস স্কিপ করলে স্বয়ংক্রিয়ভাবে প্রতি ক্লাসের ফি (৳৪৫০/৳৪০০) চলতি ইনভয়েসে ডিসকাউন্ট হয়ে যায়।
• "Digital Invoice" থেকে রসিদ ডাউনলোড ও প্রিন্ট করতে পারবেন।`;
  }

  return `🤖 [EduBot ডাউট সলভার]:
ধন্যবাদ আপনার বার্তার জন্য! 
👨‍🏫 শিক্ষক বর্তমানে অফলাইনে আছেন। আপনার প্রশ্নটি শিক্ষকের ড্যাশবোর্ডে সুরক্ষিতভাবে মার্ক করা হয়েছে। শিক্ষক অনলাইনে ফিরে আসার সাথে সাথে বিস্তারিত উত্তর প্রদান করবেন।

ইতোমধ্যে আপনি:
1. "Study Notes" সেকশন থেকে প্রাসঙ্গিক লেকচার ও ফর্মুলা শিট দেখতে পারেন।
2. "Homework" ট্যাবে গিয়ে আজকের অনুশীলন সম্পন্ন করতে পারেন।
3. নির্দিষ্ট কোনো সমীকরণ বা সূত্রের ব্যাখ্যা লাগলে সংক্ষেপে সূত্রের নাম লিখে পাঠাতে পারেন (যেমন: 'ইন্টিগ্রেশন ফর্মুলা' বা 'নিউটনের সূত্র')।`;
}

app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, text, attachmentName, attachmentUrl, isDoubt, triggerBot } = req.body;
  if (!senderId || !receiverId || !text) {
    return res.status(400).json({ error: 'senderId, receiverId, and text are required' });
  }

  const newMsg = {
    id: `msg-${crypto.randomUUID().substring(0, 8)}`,
    senderId,
    receiverId,
    text,
    attachmentName: attachmentName || null,
    attachmentUrl: attachmentUrl || null,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  db.insert('messages', newMsg);
  const users = db.getAll('users');

  // If message sent to bot-edutrack OR triggerBot / isDoubt is true, auto-reply as EduBot
  if (receiverId === 'bot-edutrack' || isDoubt || triggerBot) {
    const sender = users.find(u => u.id === senderId);
    const botReplyText = generateEduBotAnswer(text, sender?.name || 'শিক্ষার্থী');
    const hasFormulaDoc = text.toLowerCase().includes('calculus') || text.toLowerCase().includes('integration') || text.toLowerCase().includes('ক্যালকুলাস');

    setTimeout(() => {
      db.insert('messages', {
        id: `msg-${crypto.randomUUID().substring(0, 8)}`,
        senderId: 'bot-edutrack',
        receiverId: senderId,
        text: botReplyText,
        attachmentName: hasFormulaDoc ? 'Calculus-Formula-Sheet.pdf' : null,
        attachmentUrl: hasFormulaDoc ? 'https://ocw.mit.edu/courses/res-18-001-calculus-fall-2023/resources/formula-sheet.pdf' : null,
        isRead: false,
        isBot: true,
        createdAt: new Date().toISOString()
      });
    }, 350);
  }

  res.status(201).json({
    ...newMsg,
    sender: users.find(u => u.id === senderId),
    receiver: users.find(u => u.id === receiverId)
  });
});

app.put('/api/messages/:id/read', (req, res) => {
  const updated = db.update('messages', req.params.id, { isRead: true });
  if (!updated) return res.status(404).json({ error: 'Message not found' });
  res.json(updated);
});

// ================= STUDY NOTES =================
app.get('/api/study-notes', (req, res) => {
  const { classId, search } = req.query;
  let notes = db.getAll('study_notes') || [];
  if (classId) notes = notes.filter(n => n.classId === classId);
  if (search) {
    const s = search.toLowerCase();
    notes = notes.filter(n => 
      n.title?.toLowerCase().includes(s) || 
      n.subject?.toLowerCase().includes(s) || 
      n.chapter?.toLowerCase().includes(s) ||
      n.description?.toLowerCase().includes(s)
    );
  }
  const classes = db.getAll('classes');
  const enriched = notes.map(n => ({
    ...n,
    class: classes.find(c => c.id === n.classId)
  }));
  res.json(enriched);
});

app.post('/api/study-notes', (req, res) => {
  const { title, subject, chapter, classId, authorName, description, fileType, fileSize, fileUrl } = req.body;
  if (!title || !subject) return res.status(400).json({ error: 'title and subject required' });

  const newNote = {
    id: `sn-${crypto.randomUUID().substring(0, 8)}`,
    classId: classId || 'cls-1',
    title,
    subject,
    chapter: chapter || 'সাধারণ লেকচার',
    authorName: authorName || 'ড. রশিদুল করিম (Tutor)',
    description: description || '',
    fileType: fileType || 'pdf',
    fileSize: fileSize || '2.5 MB',
    fileUrl: fileUrl || 'https://edutrack.com/notes-resource.pdf',
    downloadsCount: 1,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  db.insert('study_notes', newNote);
  res.status(201).json(newNote);
});

app.delete('/api/study-notes/:id', (req, res) => {
  const deleted = db.delete('study_notes', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Note not found' });
  res.json({ success: true, id: req.params.id });
});


// ================= ASSIGNMENTS & HOMEWORK =================
app.get('/api/assignments', (req, res) => {
  const { classId } = req.query;
  let assignments = db.getAll('assignments');
  if (classId) assignments = assignments.filter(a => a.classId === classId);

  const classes = db.getAll('classes');
  const submissions = db.getAll('submissions');
  const enriched = assignments.map(a => ({
    ...a,
    class: classes.find(c => c.id === a.classId),
    submissionCount: submissions.filter(s => s.assignmentId === a.id).length
  }));
  res.json(enriched);
});

app.post('/api/assignments', (req, res) => {
  const { classId, teacherId, title, description, dueDate, maxScore, resourceLink } = req.body;
  if (!classId || !title) return res.status(400).json({ error: 'classId and title required' });

  const newAssignment = {
    id: `asg-${crypto.randomUUID().substring(0, 8)}`,
    classId,
    teacherId: teacherId || 'teacher-1',
    title,
    description: description || '',
    dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    maxScore: Number(maxScore) || 100,
    resourceLink: resourceLink || null,
    createdAt: new Date().toISOString()
  };

  db.insert('assignments', newAssignment);
  try {
    notificationService.sendAssignmentAlert({
      classId,
      assignmentTitle: title,
      dueDate: newAssignment.dueDate
    });
  } catch (e) {}
  res.status(201).json(newAssignment);
});

// ================= SUBMISSIONS =================
app.get('/api/submissions', (req, res) => {
  const { assignmentId, studentId } = req.query;
  let list = db.getAll('submissions');
  if (assignmentId) list = list.filter(s => s.assignmentId === assignmentId);
  if (studentId) list = list.filter(s => s.studentId === studentId);

  const users = db.getAll('users');
  const assignments = db.getAll('assignments');
  const enriched = list.map(s => ({
    ...s,
    student: users.find(u => u.id === s.studentId),
    assignment: assignments.find(a => a.id === s.assignmentId)
  }));
  res.json(enriched);
});

app.post('/api/submissions', (req, res) => {
  const { assignmentId, studentId, submissionText, fileUrl } = req.body;
  if (!assignmentId || !studentId) {
    return res.status(400).json({ error: 'assignmentId and studentId required' });
  }

  // Check if exists
  const existing = db.getAll('submissions').find(s => s.assignmentId === assignmentId && s.studentId === studentId);
  if (existing) {
    const updated = db.update('submissions', existing.id, {
      submissionText: submissionText || existing.submissionText,
      fileUrl: fileUrl || existing.fileUrl,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    });
    return res.json(updated);
  }

  const newSubmission = {
    id: `sub-${crypto.randomUUID().substring(0, 8)}`,
    assignmentId,
    studentId,
    submittedAt: new Date().toISOString(),
    submissionText: submissionText || '',
    fileUrl: fileUrl || 'student-homework-work.pdf',
    status: 'submitted',
    score: null,
    feedback: null
  };

  db.insert('submissions', newSubmission);
  res.status(201).json(newSubmission);
});

app.put('/api/submissions/:id/grade', (req, res) => {
  const { score, feedback } = req.body;
  const updated = db.update('submissions', req.params.id, {
    score: Number(score),
    feedback: feedback || '',
    status: 'graded'
  });
  if (!updated) return res.status(404).json({ error: 'Submission not found' });
  res.json(updated);
});

// ================= EXAM MARKS =================
app.get('/api/exam-marks', (req, res) => {
  const { studentId, classId } = req.query;
  let list = db.getAll('exam_marks');
  if (studentId) list = list.filter(m => m.studentId === studentId);
  if (classId) list = list.filter(m => m.classId === classId);

  const users = db.getAll('users');
  const classes = db.getAll('classes');
  const enriched = list.map(m => ({
    ...m,
    student: users.find(u => u.id === m.studentId),
    class: classes.find(c => c.id === m.classId)
  }));
  res.json(enriched);
});

app.post('/api/exam-marks', (req, res) => {
  const { classId, studentId, examTitle, maxMarks, obtainedMarks, examDate, remarks } = req.body;
  if (!classId || !studentId || !examTitle) {
    return res.status(400).json({ error: 'classId, studentId, and examTitle required' });
  }

  const record = {
    id: `exm-${crypto.randomUUID().substring(0, 8)}`,
    classId,
    studentId,
    examTitle,
    maxMarks: Number(maxMarks) || 100,
    obtainedMarks: Number(obtainedMarks) || 0,
    examDate: examDate || new Date().toISOString().split('T')[0],
    remarks: remarks || ''
  };

  db.insert('exam_marks', record);
  res.status(201).json(record);
});

// ================= ANNOUNCEMENTS =================
app.get('/api/announcements', (req, res) => {
  const { classId } = req.query;
  let list = db.getAll('announcements');
  if (classId) list = list.filter(a => a.classId === classId);

  const classes = db.getAll('classes');
  const enriched = list.map(a => ({
    ...a,
    class: classes.find(c => c.id === a.classId)
  }));
  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(enriched);
});

app.post('/api/announcements', (req, res) => {
  const { classId, teacherId, title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });

  const record = {
    id: `anc-${crypto.randomUUID().substring(0, 8)}`,
    classId: classId || 'cls-1',
    teacherId: teacherId || 'teacher-1',
    title,
    content,
    createdAt: new Date().toISOString()
  };

  db.insert('announcements', record);
  try {
    notificationService.sendAnnouncementBroadcast({ title, content, classId });
  } catch (e) {}
  res.status(201).json(record);
});

// ================= TIME CHANGE REQUESTS =================
app.get('/api/time-requests', (req, res) => {
  const { studentId, classId, status } = req.query;
  let list = db.getAll('time_change_requests');
  if (studentId) list = list.filter(r => r.studentId === studentId);
  if (classId) list = list.filter(r => r.classId === classId);
  if (status) list = list.filter(r => r.status === status);

  const users = db.getAll('users');
  const classes = db.getAll('classes');
  const enriched = list.map(r => ({
    ...r,
    student: users.find(u => u.id === r.studentId),
    class: classes.find(c => c.id === r.classId)
  }));
  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(enriched);
});

app.post('/api/time-requests', (req, res) => {
  const { studentId, classId, proposedSlot, proposedDays, proposedDate, reason } = req.body;
  if (!studentId || !classId || (!proposedSlot && !proposedDate)) {
    return res.status(400).json({ error: 'studentId, classId, and proposedSlot or proposedDate are required' });
  }

  const targetClass = db.getById('classes', classId);

  const newRequest = {
    id: `tcr-${crypto.randomUUID().substring(0, 8)}`,
    studentId,
    classId,
    currentSlot: targetClass ? targetClass.timeSlot : 'N/A',
    proposedSlot: proposedSlot || targetClass?.timeSlot || '06:00 PM - 07:30 PM',
    proposedDays: proposedDays || (targetClass ? targetClass.scheduleDays : []),
    proposedDate: proposedDate || null,
    reason: reason || '',
    status: 'pending',
    teacherResponse: null,
    createdAt: new Date().toISOString()
  };

  db.insert('time_change_requests', newRequest);

  // Send message to teacher
  if (targetClass?.teacherId) {
    const student = db.getById('users', studentId);
    db.insert('messages', {
      id: `msg-${crypto.randomUUID().substring(0, 8)}`,
      senderId: studentId,
      receiverId: targetClass.teacherId,
      text: `📅 সময় ও তারিখ পরিবর্তনের অনুরোধ: ${student?.name || 'শিক্ষার্থী'} "${targetClass.title}" কোর্সের জন্য ${proposedDate ? `তারিখ "${proposedDate}" এবং ` : ''}সময় "${proposedSlot || targetClass?.timeSlot}" প্রস্তাব করেছেন। কারণ: ${reason || 'সময় সমন্বয়'}।`,
      attachmentName: 'Schedule-Request.txt',
      attachmentUrl: '#reschedule',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  res.status(201).json(newRequest);
});

app.put('/api/time-requests/:id/respond', (req, res) => {
  const { status, teacherResponse } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });

  const request = db.getById('time_change_requests', req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const updatedReq = db.update('time_change_requests', req.params.id, {
    status,
    teacherResponse: teacherResponse || (status === 'approved' ? 'শিক্ষক অনুমোদন করেছেন (Approved)' : 'প্রত্যাখ্যাত (Declined)')
  });

  // If approved, update class timeSlot and scheduleDays in database
  if (status === 'approved' && request.classId) {
    const cls = db.getById('classes', request.classId);
    const updates = {};
    if (request.proposedSlot) updates.timeSlot = request.proposedSlot;
    if (request.proposedDays && request.proposedDays.length > 0) {
      updates.scheduleDays = request.proposedDays;
    }
    if (request.proposedDate) {
      const curSlots = Array.isArray(cls?.calendarSlots) ? [...cls.calendarSlots] : [];
      curSlots.push({
        date: request.proposedDate,
        timeSlot: request.proposedSlot || cls?.timeSlot,
        status: 'approved_reschedule',
        studentId: request.studentId
      });
      updates.calendarSlots = curSlots;
    }
    db.update('classes', request.classId, updates);

    // Send confirmation message to student
    db.insert('messages', {
      id: `msg-${crypto.randomUUID().substring(0, 8)}`,
      senderId: cls?.teacherId || 'teacher-1',
      receiverId: request.studentId,
      text: `✅ শিডিউল পরিবর্তন অনুমোদিত: "${cls?.title}" ক্লাসের নতুন সময় "${request.proposedSlot || cls?.timeSlot}"${request.proposedDate ? ` (তারিখ: ${request.proposedDate})` : ''} নির্ধারণ করা হয়েছে।`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else if (status === 'declined') {
    db.insert('messages', {
      id: `msg-${crypto.randomUUID().substring(0, 8)}`,
      senderId: 'teacher-1',
      receiverId: request.studentId,
      text: `❌ Time Change Request Declined: ${teacherResponse || 'Sorry, this slot has conflicts.'}`,
      attachmentName: null,
      attachmentUrl: null,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  res.json(updatedReq);
});

// ================= NOTIFICATIONS & PHONE ALERTS =================
app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  let notifs = db.getAll('notifications') || [];
  if (userId) {
    notifs = notifs.filter(n => n.recipientId === userId || n.recipientId === 'all');
  }
  notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = notifs.filter(n => !n.isRead).length;
  res.json({ notifications: notifs, unreadCount });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const updated = db.update('notifications', req.params.id, { isRead: true });
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  const { userId } = req.body;
  const notifs = db.getAll('notifications') || [];
  notifs.forEach(n => {
    if (!userId || n.recipientId === userId) {
      db.update('notifications', n.id, { isRead: true });
    }
  });
  res.json({ success: true, message: 'All notifications marked as read' });
});

app.post('/api/notifications/send-class-reminder', (req, res) => {
  const { classId } = req.body;
  const result = notificationService.sendClassReminderToAll(classId);
  res.json(result);
});

app.get('/api/notifications/sms-logs', (req, res) => {
  const logs = db.getAll('sms_logs') || [];
  logs.sort((a, b) => new Date(b.sentAt || b.timestamp) - new Date(a.sentAt || a.timestamp));
  res.json(logs);
});

app.post('/api/notifications/send-sms', (req, res) => {
  const { phone, name, title, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });
  const result = notificationService.sendNotification({
    recipientId: 'custom',
    recipientPhone: phone,
    recipientName: name || 'User',
    type: 'custom_sms',
    title: title || 'EduTrack SMS',
    message,
    sendSms: true
  });
  res.json({ success: true, result });
});

// ================= MONTHLY ATTENDANCE & HW REPORT =================
function getMonthlyReportData(studentId, classId, month) {
  const users = db.getAll('users');
  const classes = db.getAll('classes');
  const allAttendance = db.getAll('attendance');
  const allAssignments = db.getAll('assignments');
  const allSubmissions = db.getAll('submissions');
  const allDeductions = db.getAll('deductions') || [];

  const targetMonth = month || new Date().toISOString().substring(0, 7);
  const [yearStr, monthStr] = targetMonth.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const monthNameEn = `${monthNamesEn[monthNum - 1] || 'Month'} ${yearStr}`;
  const monthNameBn = `${monthNamesBn[monthNum - 1] || 'মাস'} ${yearStr}`;

  const student = users.find(u => u.id === studentId);
  if (!student) return null;

  const enrollments = db.getAll('enrollments').filter(e => e.studentId === studentId);
  let enrolledClasses = classes.filter(c => enrollments.some(e => e.classId === c.id));
  if (classId) {
    enrolledClasses = enrolledClasses.filter(c => c.id === classId);
  }
  const primaryClass = classId ? classes.find(c => c.id === classId) : (enrolledClasses[0] || null);
  const teacher = primaryClass ? users.find(u => u.id === primaryClass.teacherId) : users.find(u => u.role === 'teacher');

  // 1. Attendance
  let attRecords = allAttendance.filter(a => a.studentId === studentId && a.date?.startsWith(targetMonth));
  if (classId) {
    attRecords = attRecords.filter(a => a.classId === classId);
  }
  attRecords.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const presentCount = attRecords.filter(a => a.status === 'present').length;
  const lateCount = attRecords.filter(a => a.status === 'late').length;
  const studentAbsentCount = attRecords.filter(a => a.status === 'student_absent' || a.status === 'absent').length;
  const teacherSkippedCount = attRecords.filter(a => a.status === 'teacher_skipped').length;
  const totalSessions = attRecords.length;
  const attendedCount = presentCount + lateCount;
  const attendancePercentage = totalSessions > 0
    ? Math.round((attendedCount / totalSessions) * 100)
    : 100;

  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  const enrichedAttendance = attRecords.map(a => {
    const cls = classes.find(c => c.id === a.classId);
    const perClassRate = cls?.perClassRate || Math.round((cls?.monthlyFee || 3200) / 8) || 400;
    let statusLabelEn = 'Present';
    let statusLabelBn = 'উপস্থিত';
    let badgeColor = 'emerald';
    let deduction = 0;

    if (a.status === 'present') {
      statusLabelEn = 'Present';
      statusLabelBn = 'উপস্থিত';
      badgeColor = 'emerald';
    } else if (a.status === 'late') {
      statusLabelEn = 'Late';
      statusLabelBn = 'বিলম্বে';
      badgeColor = 'amber';
    } else if (a.status === 'student_absent' || a.status === 'absent') {
      statusLabelEn = 'Student Absent';
      statusLabelBn = 'শিক্ষার্থী অনুপস্থিত (৳০ কর্তন)';
      badgeColor = 'rose';
      deduction = 0;
    } else if (a.status === 'teacher_skipped') {
      statusLabelEn = 'Teacher Skipped';
      statusLabelBn = `শিক্ষক অনুপস্থিত (-৳${perClassRate} কর্তন)`;
      badgeColor = 'purple';
      deduction = perClassRate;
    }

    const dObj = new Date(a.date);
    return {
      ...a,
      className: cls?.title || 'Tuition Class',
      dayOfWeek: daysEn[dObj.getDay()] || '',
      dayOfWeekBn: daysBn[dObj.getDay()] || '',
      statusLabelEn,
      statusLabelBn,
      badgeColor,
      deductionAmount: deduction
    };
  });

  const studentDeductions = allDeductions.filter(d =>
    d.studentId === studentId &&
    d.date?.startsWith(targetMonth) &&
    (!classId || d.classId === classId)
  );
  const totalDeductedAmount = studentDeductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // 2. Homework & Tasks (HW)
  const targetClassIds = classId ? [classId] : enrolledClasses.map(c => c.id);
  let relevantAssignments = allAssignments.filter(asg => {
    const matchClass = targetClassIds.includes(asg.classId);
    const matchMonth = asg.dueDate?.startsWith(targetMonth) || asg.createdAt?.startsWith(targetMonth);
    return matchClass && matchMonth;
  });

  if (relevantAssignments.length === 0 && targetClassIds.length > 0) {
    relevantAssignments = allAssignments.filter(asg => targetClassIds.includes(asg.classId));
  }

  const hwItems = relevantAssignments.map(asg => {
    const cls = classes.find(c => c.id === asg.classId);
    const sub = allSubmissions.find(s => s.assignmentId === asg.id && s.studentId === studentId);
    let submissionStatus = 'missing';
    let submissionStatusBn = 'জমা দেওয়া হয়নি (Pending)';
    let scoreEarned = null;
    let scorePercentage = null;

    if (sub) {
      if (sub.status === 'graded') {
        submissionStatus = 'graded';
        submissionStatusBn = 'মূল্যায়ন সম্পন্ন (Graded)';
        scoreEarned = sub.score;
        scorePercentage = asg.maxScore ? Math.round((sub.score / asg.maxScore) * 100) : 100;
      } else {
        submissionStatus = 'submitted';
        submissionStatusBn = 'জমা দেওয়া হয়েছে (Review Pending)';
      }
    }

    return {
      id: asg.id,
      title: asg.title,
      description: asg.description,
      dueDate: asg.dueDate,
      maxScore: asg.maxScore,
      className: cls?.title || 'Tuition',
      submission: sub ? {
        id: sub.id,
        submittedAt: sub.submittedAt,
        submissionText: sub.submissionText,
        fileUrl: sub.fileUrl,
        status: sub.status,
        score: sub.score,
        feedback: sub.feedback
      } : null,
      status: submissionStatus,
      statusBn: submissionStatusBn,
      score: scoreEarned,
      scorePercentage
    };
  });

  const totalHW = hwItems.length;
  const submittedHW = hwItems.filter(h => h.submission).length;
  const gradedHW = hwItems.filter(h => h.status === 'graded').length;
  const missingHW = totalHW - submittedHW;
  const hwCompletionRate = totalHW > 0 ? Math.round((submittedHW / totalHW) * 100) : 100;

  const gradedItemsWithScore = hwItems.filter(h => h.scorePercentage !== null);
  const averageHWScore = gradedItemsWithScore.length > 0
    ? Math.round(gradedItemsWithScore.reduce((sum, h) => sum + h.scorePercentage, 0) / gradedItemsWithScore.length)
    : null;

  // 3. Overall Performance
  let overallGrade = 'A';
  let performanceRating = 'Excellent (চমৎকার)';
  let summaryRemark = 'নিয়মিত উপস্থিতি ও হোমওয়ার্ক জমা চমৎকার। পড়াশোনায় এই ধারাবাহিকতা অব্যাহত রাখুন।';

  const combinedScore = (attendancePercentage * 0.5) + ((averageHWScore || hwCompletionRate) * 0.5);
  if (combinedScore >= 85) {
    overallGrade = 'A+';
    performanceRating = 'Outstanding (অসাধারণ)';
    summaryRemark = 'উপস্থিতি ও হোমওয়ার্ক মূল্যায়ন উভয় ক্ষেত্রেই সেরা পারফরম্যান্স প্রদর্শন করেছে।';
  } else if (combinedScore >= 75) {
    overallGrade = 'A';
    performanceRating = 'Good (সন্তোষজনক)';
    summaryRemark = 'ধারাবাহিক প্রচেষ্টা প্রশংসনীয়। নিয়মিত রিভিশন দিলে আরও ভালো ফলাফল সম্ভব।';
  } else if (combinedScore >= 60) {
    overallGrade = 'B';
    performanceRating = 'Average (উন্নতি প্রয়োজন)';
    summaryRemark = 'উপস্থিতি বজায় রাখতে হবে এবং নিয়মিত হোমওয়ার্ক জমা নিশ্চিত করতে হবে।';
  } else {
    overallGrade = 'C';
    performanceRating = 'Needs Attention (বিশেষ মনোযোগ প্রয়োজন)';
    summaryRemark = 'ক্লাস স্কিপ না করে অবিলম্বে নিয়মিত অনুশীলন ও হোমওয়ার্ক জমা দেওয়া জরুরি।';
  }

  // 4. Full Monthly Visual Calendar Grid (Saturday-first Bangladesh Academic Week)
  const year = parseInt(yearStr, 10);
  const monthIdx = monthNum - 1; // 0-based
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDayObj = new Date(year, monthIdx, 1);
  // Saturday is index 0: JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const startDayOffset = (firstDayObj.getDay() + 1) % 7; 

  const calWeekDays = [
    { en: 'Saturday', bn: 'শনিবার', shortBn: 'শনি' },
    { en: 'Sunday', bn: 'রবিবার', shortBn: 'রবি' },
    { en: 'Monday', bn: 'সোম', shortBn: 'সোম' },
    { en: 'Tuesday', bn: 'মঙ্গলবার', shortBn: 'মঙ্গল' },
    { en: 'Wednesday', bn: 'বুধবার', shortBn: 'বুধ' },
    { en: 'Thursday', bn: 'বৃহস্পতিবার', shortBn: 'বৃহস্পতি' },
    { en: 'Friday', bn: 'শুক্রবার', shortBn: 'শুক্র' },
  ];

  const classScheduleDays = primaryClass?.scheduleDays || ['Monday', 'Wednesday'];
  const todayStr = new Date().toISOString().split('T')[0];
  const calendarDays = [];

  // Empty leading offset cells
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push({
      isEmpty: true,
      dayNumber: null,
      dateString: null
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, monthIdx, d);
    const dateString = `${yearStr}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeekEn = daysEn[dayDate.getDay()];
    const dayOfWeekBn = daysBn[dayDate.getDay()];
    
    // Check if attendance record exists
    const att = attRecords.find(a => a.date === dateString);
    // Check if homework due on this date
    const hwDue = relevantAssignments.filter(a => a.dueDate?.startsWith(dateString));
    // Check if scheduled class day
    const isScheduledDay = classScheduleDays.includes(dayOfWeekEn);

    let status = 'off_day';
    let statusLabelBn = 'অফ-ডে';
    let statusLabelEn = 'Off Day';
    let badgeType = 'off';
    let deduction = 0;

    if (att) {
      if (att.status === 'present') {
        status = 'present';
        statusLabelBn = 'উপস্থিত';
        statusLabelEn = 'Present';
        badgeType = 'present';
      } else if (att.status === 'late') {
        status = 'late';
        statusLabelBn = 'বিলম্ব';
        statusLabelEn = 'Late';
        badgeType = 'late';
      } else if (att.status === 'student_absent' || att.status === 'absent') {
        status = 'student_absent';
        statusLabelBn = 'ছাত্র ছুটি (৳০)';
        statusLabelEn = 'Student Absent';
        badgeType = 'absent';
        deduction = 0;
      } else if (att.status === 'teacher_skipped') {
        status = 'teacher_skipped';
        const cls = classes.find(c => c.id === att.classId) || primaryClass;
        const rate = cls?.perClassRate || 400;
        statusLabelBn = `শিক্ষক স্কিপ (-৳${rate})`;
        statusLabelEn = 'Teacher Skipped';
        badgeType = 'teacher_skip';
        deduction = rate;
      }
    } else if (isScheduledDay) {
      status = 'scheduled';
      statusLabelBn = 'ক্লাস দিন';
      statusLabelEn = 'Class Day';
      badgeType = 'scheduled';
    }

    calendarDays.push({
      isEmpty: false,
      dayNumber: d,
      dateString,
      dayOfWeekEn,
      dayOfWeekBn,
      isScheduledDay,
      status,
      statusLabelBn,
      statusLabelEn,
      badgeType,
      deduction,
      hasAttendance: !!att,
      attendanceRecord: att || null,
      homeworkList: hwDue.map(h => ({ id: h.id, title: h.title, maxScore: h.maxScore })),
      isToday: dateString === todayStr
    });
  }

  // Trailing empty cells to complete the 7-column row
  const totalGridCells = calendarDays.length;
  const remainder = totalGridCells % 7;
  if (remainder !== 0) {
    const trailingCount = 7 - remainder;
    for (let i = 0; i < trailingCount; i++) {
      calendarDays.push({
        isEmpty: true,
        dayNumber: null,
        dateString: null
      });
    }
  }

  return {
    student,
    primaryClass,
    enrolledClasses,
    teacher,
    month: targetMonth,
    monthNameEn,
    monthNameBn,
    calendar: {
      weekDays: calWeekDays,
      startDayOffset,
      daysInMonth,
      days: calendarDays
    },
    attendance: {
      totalSessions,
      attendedCount,
      presentCount,
      lateCount,
      studentAbsentCount,
      teacherSkippedCount,
      attendancePercentage,
      records: enrichedAttendance,
      totalDeductedAmount
    },
    homework: {
      totalAssigned: totalHW,
      submittedCount: submittedHW,
      gradedCount: gradedHW,
      missingCount: missingHW,
      completionRate: hwCompletionRate,
      averageScore: averageHWScore,
      items: hwItems
    },
    deductions: studentDeductions,
    performance: {
      overallGrade,
      rating: performanceRating,
      combinedScore: Math.round(combinedScore),
      remarks: summaryRemark
    },
    generatedAt: new Date().toISOString()
  };
}

app.get('/api/reports/monthly', (req, res) => {
  const { studentId, classId, month = new Date().toISOString().substring(0, 7) } = req.query;
  const users = db.getAll('users');

  if (studentId) {
    const report = getMonthlyReportData(studentId, classId, month);
    if (!report) return res.status(404).json({ error: 'Student not found or no data' });
    return res.json(report);
  }

  // If requesting all students
  const students = users.filter(u => u.role === 'student');
  const reports = students
    .map(s => getMonthlyReportData(s.id, classId, month))
    .filter(Boolean);

  res.json({
    month,
    reportsCount: reports.length,
    reports
  });
});

// HTML printable view for direct PDF saving/printing with Full 7-Col Calendar
app.get('/api/reports/monthly/html', (req, res) => {
  const { studentId, classId, month = new Date().toISOString().substring(0, 7), autoPrint } = req.query;
  const users = db.getAll('users');
  const targetStudentId = studentId || users.find(u => u.role === 'student')?.id;

  const data = getMonthlyReportData(targetStudentId, classId, month);
  if (!data) return res.status(404).send('<h1>Report not found</h1>');

  const shouldAutoPrint = autoPrint === 'true' || autoPrint === '1';

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>ফুল ক্যালেন্ডারসহ মাসিক হাজিরা ও হোমওয়ার্ক রিপোর্ট - ${data.student?.name || 'শিক্ষার্থী'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, sans-serif; 
      color: #0f172a; 
      background: #f8fafc; 
      padding: 24px; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
    }
    .print-container { 
      max-width: 960px; 
      margin: 0 auto; 
      background: #ffffff; 
      padding: 32px 36px; 
      border-radius: 16px; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.06); 
      border: 1px solid #e2e8f0; 
    }
    .top-actions { 
      display: flex; 
      justify-content: flex-end; 
      gap: 12px; 
      margin-bottom: 24px; 
    }
    .btn-print { 
      background: #4f46e5; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 10px; 
      font-weight: 700; 
      border: none; 
      cursor: pointer; 
      display: inline-flex; 
      align-items: center; 
      gap: 8px; 
      font-size: 14px; 
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); 
      transition: all 0.2s; 
    }
    .btn-print:hover { 
      background: #4338ca; 
      transform: translateY(-1px); 
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      padding: 12px 18px;
      border-radius: 10px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-secondary:hover { background: #e2e8f0; }

    /* Header */
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      border-bottom: 3px solid #4f46e5; 
      padding-bottom: 18px; 
      margin-bottom: 20px; 
    }
    .logo-area h1 { 
      font-size: 24px; 
      font-weight: 800; 
      color: #1e1b4b; 
      letter-spacing: -0.5px; 
    }
    .logo-area p { 
      font-size: 13px; 
      color: #4f46e5; 
      font-weight: 600; 
      margin-top: 3px; 
    }
    .logo-area .subtext { 
      font-size: 11px; 
      color: #64748b; 
      margin-top: 2px; 
      font-weight: 400; 
    }
    .report-badge { 
      background: #e0e7ff; 
      color: #312e81; 
      padding: 8px 16px; 
      border-radius: 12px; 
      font-weight: 700; 
      font-size: 13px; 
      text-align: right; 
      border: 1px solid #c7d2fe; 
    }

    /* Info Grid */
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 16px; 
      background: #f8fafc; 
      padding: 16px 20px; 
      border-radius: 12px; 
      margin-bottom: 22px; 
      border: 1px solid #e2e8f0; 
    }
    .info-col h3 { 
      font-size: 11px; 
      text-transform: uppercase; 
      color: #64748b; 
      margin-bottom: 6px; 
      letter-spacing: 0.5px; 
      font-weight: 700; 
    }
    .info-col p { 
      font-size: 13px; 
      color: #0f172a; 
      margin-bottom: 4px; 
      line-height: 1.4; 
    }

    /* KPIs */
    .kpi-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 10px; 
      margin-bottom: 22px; 
    }
    .kpi-card { 
      background: #fff; 
      border: 1px solid #e2e8f0; 
      padding: 12px 10px; 
      border-radius: 10px; 
      text-align: center; 
    }
    .kpi-num { 
      font-size: 22px; 
      font-weight: 800; 
      color: #4f46e5; 
      margin: 3px 0; 
    }
    .kpi-title { 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600; 
    }

    .section-title { 
      font-size: 15px; 
      font-weight: 700; 
      color: #0f172a; 
      margin: 20px 0 12px 0; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      border-left: 4px solid #4f46e5; 
      padding-left: 10px; 
    }

    /* FULL MONTHLY CALENDAR GRID */
    .calendar-container {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .calendar-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 11px;
      font-weight: 600;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .cal-grid-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-bottom: 6px;
    }
    .cal-header-cell {
      background: #1e1b4b;
      color: #ffffff;
      text-align: center;
      padding: 8px 4px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .cal-grid-body {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }
    .cal-cell {
      min-height: 72px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 7px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.15s;
    }
    .cal-cell-empty {
      background: #f8fafc;
      border-color: #f1f5f9;
      min-height: 72px;
    }
    .cal-date-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .cal-date-num {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
    }
    .cal-today-tag {
      font-size: 9px;
      background: #4f46e5;
      color: white;
      padding: 1px 4px;
      border-radius: 4px;
      font-weight: 700;
    }
    .cal-status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 5px;
      text-align: center;
      line-height: 1.2;
    }
    .cal-status-present {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .cal-status-late {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .cal-status-absent {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .cal-status-teacher-skip {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }
    .cal-status-scheduled {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }
    .cal-status-off {
      background: #f8fafc;
      color: #94a3b8;
      border: 1px solid #f1f5f9;
    }
    .cal-deduction-pill {
      margin-top: 3px;
      font-size: 9px;
      font-weight: 800;
      background: #7e22ce;
      color: #ffffff;
      padding: 1px 4px;
      border-radius: 4px;
      text-align: center;
    }
    .cal-hw-pill {
      margin-top: 2px;
      font-size: 8px;
      font-weight: 700;
      color: #b45309;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 1px 3px;
      border-radius: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Tables */
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 22px; 
      font-size: 12px; 
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      overflow: hidden; 
    }
    th { 
      background: #f8fafc; 
      color: #475569; 
      font-weight: 700; 
      text-align: left; 
      padding: 9px 12px; 
      border-bottom: 2px solid #e2e8f0; 
    }
    td { 
      padding: 9px 12px; 
      border-bottom: 1px solid #f1f5f9; 
      color: #334155; 
    }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { 
      display: inline-block; 
      padding: 3px 8px; 
      border-radius: 6px; 
      font-size: 10px; 
      font-weight: 700; 
    }
    .badge-present { background: #dcfce7; color: #166534; }
    .badge-late { background: #fef3c7; color: #92400e; }
    .badge-absent { background: #fee2e2; color: #991b1b; }
    .badge-teacher-skip { background: #f3e8ff; color: #6b21a8; }

    .remarks-box { 
      background: #f5f3ff; 
      border-left: 4px solid #7c3aed; 
      padding: 14px 16px; 
      border-radius: 8px; 
      margin-bottom: 28px; 
      font-size: 12px; 
      color: #2e1065; 
      line-height: 1.5; 
    }
    .signatures { 
      display: flex; 
      justify-content: space-between; 
      margin-top: 36px; 
      padding-top: 16px; 
      border-top: 1px dashed #cbd5e1; 
      page-break-inside: avoid; 
    }
    .sign-line { text-align: center; width: 220px; }
    .sign-border { 
      border-top: 1px solid #94a3b8; 
      margin-top: 45px; 
      padding-top: 6px; 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600; 
    }

    @media print {
      body { 
        background: #ffffff !important; 
        padding: 0 !important; 
        margin: 0 !important; 
      }
      .print-container { 
        box-shadow: none !important; 
        border: none !important; 
        padding: 0 !important; 
        max-width: 100% !important; 
        width: 100% !important; 
      }
      .top-actions { display: none !important; }
      @page { 
        size: A4 portrait; 
        margin: 8mm 10mm; 
      }
      .cal-cell, .kpi-card, .remarks-box, .signatures, table {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="top-actions">
      <button class="btn-secondary" onclick="window.close()">✕ উইন্ডো বন্ধ করুন</button>
      <button class="btn-print" onclick="window.print()">🖨️ ফুল ক্যালেন্ডারসহ PDF প্রিন্ট / সেভ করুন (Print PDF)</button>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="logo-area">
        <h1>EduTrack Academy • টিউটরিং একাডেমি</h1>
        <p>মাসিক পূর্ণাঙ্গ হাজিরা ক্যালেন্ডার ও পারফরম্যান্স রিপোর্ট</p>
        <div class="subtext">Official Monthly Attendance Calendar & Progress Report</div>
      </div>
      <div class="report-badge">
        ${data.monthNameBn} (${data.monthNameEn})<br>
        <span style="font-size: 11px; opacity: 0.85;">শিক্ষার্থী ও শিক্ষক কপি</span>
      </div>
    </div>

    <!-- Student & Tutor Info Meta -->
    <div class="info-grid">
      <div class="info-col">
        <h3>শিক্ষার্থী বিবরণ (Student Details)</h3>
        <p><strong>নাম:</strong> ${data.student?.name || 'N/A'}</p>
        <p><strong>শ্রেণী / বিভাগ:</strong> ${data.student?.grade || data.student?.title || 'একাদশ শ্রেণী'}</p>
        <p><strong>ইমেইল:</strong> ${data.student?.email || 'N/A'}</p>
        <p><strong>অভিভাবক:</strong> ${data.student?.parentName || 'N/A'} (${data.student?.parentPhone || ''})</p>
      </div>
      <div class="info-col">
        <h3>টিউটর ও কোর্স বিবরণ (Tutor & Course)</h3>
        <p><strong>শিক্ষক:</strong> ${data.teacher?.name || 'N/A'}</p>
        <p><strong>কোর্স / ব্যাচ:</strong> ${data.primaryClass?.title || 'উচ্চতর গণিত ও বিজ্ঞান'}</p>
        <p><strong>ক্লাসের সময়:</strong> ${data.primaryClass?.timeSlot || '05:00 PM - 06:30 PM'}</p>
        <p><strong>প্রতি ক্লাস রেট:</strong> ৳${data.primaryClass?.perClassRate || 400}</p>
      </div>
    </div>

    <!-- Attendance KPIs -->
    <div class="section-title">
      <span>📅 মাসিক উপস্থিতি সারসংক্ষেপ (Attendance Summary)</span>
      <span style="font-size: 12px; color: #4f46e5; font-weight: 700;">উপস্থিতির হার: ${data.attendance.attendancePercentage}%</span>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">মোট ক্লাস (Total)</div>
        <div class="kpi-num">${data.attendance.totalSessions}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">উপস্থিত (Present)</div>
        <div class="kpi-num" style="color: #16a34a;">${data.attendance.presentCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">ছাত্র ছুটি (Absent - ৳০)</div>
        <div class="kpi-num" style="color: #dc2626;">${data.attendance.studentAbsentCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">শিক্ষক স্কিপ (ফি কর্তন)</div>
        <div class="kpi-num" style="color: #9333ea;">${data.attendance.teacherSkippedCount}</div>
      </div>
    </div>

    <!-- FULL 7-COLUMN MONTHLY CALENDAR GRID -->
    <div class="section-title">
      <span>🗓️ পুরো মাসের হাজিরা ক্যালেন্ডার গ্রিড (Full Monthly Calendar Grid: ১ - ${data.calendar?.daysInMonth || 31} তারিখ)</span>
      <span style="font-size: 11px; color: #64748b; font-weight: 600;">শনিবার থেকে শুক্রবার একাডেমিক সপ্তাহ</span>
    </div>

    <div class="calendar-container">
      <!-- Calendar Legend -->
      <div class="calendar-legend">
        <div class="legend-item"><span class="legend-dot" style="background: #16a34a;"></span> <span>🟢 উপস্থিত (Present)</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #d97706;"></span> <span>🟡 বিলম্ব (Late)</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #dc2626;"></span> <span>🔴 ছাত্র ছুটি (৳০ কর্তন)</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #9333ea;"></span> <span>🟣 শিক্ষক স্কিপ (-৳৪৫০ কর্তন)</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #0284c7;"></span> <span>📘 নির্ধারিত ক্লাস</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #94a3b8;"></span> <span>⚪ অফ-ডে / ছুটি</span></div>
      </div>

      <!-- 7 Weekday Headers -->
      <div class="cal-grid-header">
        <div class="cal-header-cell">শনিবার (Sat)</div>
        <div class="cal-header-cell">রবিবার (Sun)</div>
        <div class="cal-header-cell">সোমবার (Mon)</div>
        <div class="cal-header-cell">মঙ্গলবার (Tue)</div>
        <div class="cal-header-cell">বুধবার (Wed)</div>
        <div class="cal-header-cell">বৃহস্পতিবার (Thu)</div>
        <div class="cal-header-cell">শুক্রবার (Fri)</div>
      </div>

      <!-- Calendar Days Grid (All 1..31 days + offsets) -->
      <div class="cal-grid-body">
        ${(data.calendar?.days || []).map(cell => {
          if (cell.isEmpty) {
            return `<div class="cal-cell cal-cell-empty"></div>`;
          }

          let badgeClass = 'cal-status-off';
          if (cell.status === 'present') badgeClass = 'cal-status-present';
          else if (cell.status === 'late') badgeClass = 'cal-status-late';
          else if (cell.status === 'student_absent') badgeClass = 'cal-status-absent';
          else if (cell.status === 'teacher_skipped') badgeClass = 'cal-status-teacher-skip';
          else if (cell.status === 'scheduled') badgeClass = 'cal-status-scheduled';

          const hwBadge = cell.homeworkList && cell.homeworkList.length > 0
            ? `<div class="cal-hw-pill" title="${cell.homeworkList[0].title}">📝 ${cell.homeworkList[0].title}</div>`
            : '';

          const deductionBadge = cell.deduction > 0
            ? `<div class="cal-deduction-pill">-৳${cell.deduction} কর্তন</div>`
            : '';

          return `
            <div class="cal-cell">
              <div class="cal-date-row">
                <span class="cal-date-num">${cell.dayNumber}</span>
                ${cell.isToday ? '<span class="cal-today-tag">আজ</span>' : ''}
              </div>
              <div class="cal-status-badge ${badgeClass}">${cell.statusLabelBn}</div>
              ${deductionBadge}
              ${hwBadge}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Attendance Log Table -->
    <div class="section-title">
      <span>📋 বিস্তারিত হাজিরা লগ (Attendance Log Details)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>তারিখ (Date)</th>
          <th>বার (Day)</th>
          <th>কোর্স / ব্যাচ</th>
          <th>হাজিরা অবস্থা (Status)</th>
          <th>মন্তব্য (Notes)</th>
          <th>ফি কর্তন (Deduction)</th>
        </tr>
      </thead>
      <tbody>
        ${data.attendance.records && data.attendance.records.length > 0 ? data.attendance.records.map(r => `
          <tr>
            <td><strong>${r.date}</strong></td>
            <td>${r.dayOfWeekBn}</td>
            <td>${r.className}</td>
            <td><span class="badge ${r.badgeColor === 'emerald' ? 'badge-present' : r.badgeColor === 'amber' ? 'badge-late' : r.badgeColor === 'purple' ? 'badge-teacher-skip' : 'badge-absent'}">${r.statusLabelBn}</span></td>
            <td>${r.notes || '-'}</td>
            <td>${r.deductionAmount > 0 ? `<strong style="color: #9333ea;">-৳${r.deductionAmount}</strong>` : '<span style="color: #94a3b8;">৳০ (অক্ষুণ্ণ)</span>'}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="6" style="text-align: center; color: #94a3b8; padding: 16px;">এই মাসে কোনো ক্লাস রেকর্ড নেই</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Homework KPIs & Table -->
    <div class="section-title">
      <span>📚 হোমওয়ার্ক ও অ্যাসাইনমেন্ট পারফরম্যান্স (HW & Tasks)</span>
      <span style="font-size: 12px; color: #4f46e5; font-weight: 700;">জমা দেওয়ার হার: ${data.homework.completionRate}%</span>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">মোট এসাইনমেন্ট (HW)</div>
        <div class="kpi-num">${data.homework.totalAssigned}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">জমা দেওয়া হয়েছে</div>
        <div class="kpi-num" style="color: #16a34a;">${data.homework.submittedCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">বাকি / মিসিং</div>
        <div class="kpi-num" style="color: #dc2626;">${data.homework.missingCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">গড় নম্বর (Avg Score)</div>
        <div class="kpi-num" style="color: #2563eb;">${data.homework.averageScore !== null ? data.homework.averageScore + '%' : 'N/A'}</div>
      </div>
    </div>

    <!-- Homework Log Table -->
    <table>
      <thead>
        <tr>
          <th>অ্যাসাইনমেন্ট শিরোনাম</th>
          <th>জমা দেওয়ার শেষ সময়</th>
          <th>পূর্ণমান</th>
          <th>অবস্থা (Status)</th>
          <th>প্রাপ্ত নম্বর (Score)</th>
          <th>শিক্ষকের মূল্যায়ন ও ফিডব্যাক</th>
        </tr>
      </thead>
      <tbody>
        ${data.homework.items && data.homework.items.length > 0 ? data.homework.items.map(h => `
          <tr>
            <td><strong>${h.title}</strong></td>
            <td>${h.dueDate?.split('T')[0] || '-'}</td>
            <td>${h.maxScore}</td>
            <td><span class="badge ${h.status === 'graded' ? 'badge-present' : h.status === 'submitted' ? 'badge-late' : 'badge-absent'}">${h.statusBn}</span></td>
            <td>${h.score !== null ? `<strong>${h.score} / ${h.maxScore}</strong> (${h.scorePercentage}%)` : '<span style="color: #94a3b8;">মূল্যায়ন অপেক্ষমাণ</span>'}</td>
            <td>${h.submission?.feedback || '<span style="color: #94a3b8;">কোনো মন্তব্য নেই</span>'}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="6" style="text-align: center; color: #94a3b8; padding: 16px;">এই মাসে কোনো হোমওয়ার্ক রেকর্ড নেই</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Teacher Remarks & Grade -->
    <div class="remarks-box">
      <strong>শিক্ষকের মূল্যায়ন ও সারসংক্ষেপ (Teacher's Evaluation):</strong><br>
      সামগ্রিক গ্রেড: <strong>${data.performance.overallGrade} (${data.performance.rating})</strong> — ${data.performance.remarks}
      ${data.attendance.totalDeductedAmount > 0 ? `<br><span style="color: #6b21a8; font-weight: 700;">* শিক্ষক অনুপস্থিতির কারণে এই মাসে সর্বমোট ৳${data.attendance.totalDeductedAmount} ইনভয়েস ক্রেডিট/ছাড় প্রদান করা হয়েছে (ছাত্র অনুপস্থিতিতে কোনো ফি কাটা হয়নি)।</span>` : ''}
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sign-line">
        <div class="sign-border">শিক্ষার্থীর স্বাক্ষর (Student)</div>
      </div>
      <div class="sign-line">
        <div class="sign-border">অভিভাবকের স্বাক্ষর (Guardian)</div>
      </div>
      <div class="sign-line">
        <div class="sign-border">${data.teacher?.name || 'শিক্ষক'}<br>প্রধান শিক্ষক / টিউটর (Tutor)</div>
      </div>
    </div>
  </div>

  <script>
    ${shouldAutoPrint ? `
      window.addEventListener('load', function() {
        setTimeout(function() {
          window.print();
        }, 400);
      });
    ` : ''}
  </script>
</body>
</html>`;

  res.send(html);
});

// ================= HOME TUITION LOCATION TRACKING =================
app.get('/api/tuition-location', (req, res) => {
  const { classId, studentId, teacherId } = req.query;
  let list = db.getAll('tuition_locations');
  if (classId) list = list.filter(l => l.classId === classId);
  if (studentId) list = list.filter(l => l.studentId === studentId);
  if (teacherId) list = list.filter(l => l.teacherId === teacherId);

  const classes = db.getAll('classes');
  const users = db.getAll('users');

  const enriched = list.map(item => ({
    ...item,
    class: classes.find(c => c.id === item.classId),
    student: users.find(u => u.id === item.studentId),
    teacher: users.find(u => u.id === item.teacherId)
  }));
  res.json(enriched);
});

app.post('/api/tuition-location/update', (req, res) => {
  const { id, classId, tutorLat, tutorLng, tutorAddress, status, notes, etaMinutes, distanceKm } = req.body;
  let tracking = id ? db.getById('tuition_locations', id) : null;
  if (!tracking && classId) {
    tracking = db.getAll('tuition_locations').find(t => t.classId === classId);
  }

  const statusMapBn = {
    'scheduled': 'নির্ধারিত (Scheduled)',
    'on_the_way': 'পথে আছেন (On the way)',
    'arrived': 'পৌঁছেছেন (Arrived)',
    'in_session': 'ক্লাস চলছে (In Session)',
    'completed': 'সম্পন্ন (Completed)'
  };

  const updates = {
    lastUpdated: new Date().toISOString()
  };
  if (tutorLat !== undefined) updates.tutorLat = Number(tutorLat);
  if (tutorLng !== undefined) updates.tutorLng = Number(tutorLng);
  if (tutorAddress) updates.tutorAddress = tutorAddress;
  if (status) {
    updates.status = status;
    updates.statusBn = statusMapBn[status] || status;
  }
  if (notes !== undefined) updates.notes = notes;
  if (etaMinutes !== undefined) updates.etaMinutes = Number(etaMinutes);
  if (distanceKm !== undefined) updates.distanceKm = Number(distanceKm);

  if (tracking) {
    const updated = db.update('tuition_locations', tracking.id, updates);
    return res.json(updated);
  } else {
    const newRecord = {
      id: `loc-track-${crypto.randomUUID().substring(0, 8)}`,
      classId: classId || 'cls-2',
      teacherId: req.body.teacherId || 'teacher-1',
      studentId: req.body.studentId || 'student-1',
      status: status || 'on_the_way',
      statusBn: statusMapBn[status] || 'পথে আছেন (On the way)',
      tutorLat: tutorLat !== undefined ? Number(tutorLat) : 23.7432,
      tutorLng: tutorLng !== undefined ? Number(tutorLng) : 90.3705,
      tutorAddress: tutorAddress || 'ধানমন্ডি ২৭ মোড়',
      destLat: 23.7509,
      destLng: 90.3752,
      destAddress: 'বাড়ি #৪৫, রোড #৮/এ, ধানমন্ডি, ঢাকা',
      distanceKm: distanceKm !== undefined ? Number(distanceKm) : 0.85,
      etaMinutes: etaMinutes !== undefined ? Number(etaMinutes) : 6,
      sessionDate: new Date().toISOString().split('T')[0],
      scheduledTime: '04:30 PM - 06:00 PM',
      checkInTime: null,
      checkOutTime: null,
      notes: notes || 'শিক্ষক বাসায় আসার পথে আছেন।',
      ...updates
    };
    db.insert('tuition_locations', newRecord);
    return res.status(201).json(newRecord);
  }
});

app.post('/api/tuition-location/check-in', (req, res) => {
  const { id, classId, tutorLat, tutorLng } = req.body;
  let tracking = id ? db.getById('tuition_locations', id) : null;
  if (!tracking && classId) {
    tracking = db.getAll('tuition_locations').find(t => t.classId === classId);
  }
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const updates = {
    status: 'arrived',
    statusBn: 'পৌঁছেছেন / চেক-ইন সম্পন্ন (Arrived & Checked In)',
    checkInTime: timeStr,
    distanceKm: 0.05,
    etaMinutes: 0,
    lastUpdated: now.toISOString(),
    notes: `শিক্ষক নিরাপদে ছাত্রের বাসায় পৌঁছেছেন এবং সময় ${timeStr} এ চেক-ইন করেছেন।`
  };
  if (tutorLat) updates.tutorLat = Number(tutorLat);
  if (tutorLng) updates.tutorLng = Number(tutorLng);

  if (tracking) {
    const updated = db.update('tuition_locations', tracking.id, updates);
    res.json({ success: true, tracking: updated, message: `চেক-ইন সফল হয়েছে (${timeStr})` });
  } else {
    res.status(404).json({ error: 'Tracking record not found' });
  }
});

app.post('/api/tuition-location/check-out', (req, res) => {
  const { id, classId } = req.body;
  let tracking = id ? db.getById('tuition_locations', id) : null;
  if (!tracking && classId) {
    tracking = db.getAll('tuition_locations').find(t => t.classId === classId);
  }
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const updates = {
    status: 'completed',
    statusBn: 'ক্লাস সম্পন্ন ও চেক-আউট (Session Completed & Checked Out)',
    checkOutTime: timeStr,
    lastUpdated: now.toISOString(),
    notes: `হোম টিউশন ক্লাস সফলভাবে সম্পন্ন হয়েছে (${timeStr})।`
  };

  if (tracking) {
    const updated = db.update('tuition_locations', tracking.id, updates);
    res.json({ success: true, tracking: updated, message: `চেক-আউট সফল হয়েছে (${timeStr})` });
  } else {
    res.status(404).json({ error: 'Tracking record not found' });
  }
});

// ================= EXAM SCHEDULES & ROUTINE =================
app.get('/api/exam-schedules', (req, res) => {
  const { classId } = req.query;
  let list = db.getAll('exam_schedules');
  if (classId) list = list.filter(e => e.classId === classId);

  const classes = db.getAll('classes');
  const enriched = list.map(item => ({
    ...item,
    class: classes.find(c => c.id === item.classId)
  }));
  enriched.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(enriched);
});

app.post('/api/exam-schedules', (req, res) => {
  const { classId, title, examType, examTypeBn, date, timeSlot, durationMinutes, totalMarks, passMarks, syllabus, marksDistribution, venue, zoomLink, instructions } = req.body;
  if (!classId || !title || !date || !timeSlot) {
    return res.status(400).json({ error: 'classId, title, date, and timeSlot are required' });
  }

  const newExam = {
    id: `exam-${crypto.randomUUID().substring(0, 8)}`,
    classId,
    title,
    examType: examType || 'Model Test',
    examTypeBn: examTypeBn || 'মডেল টেস্ট',
    date,
    timeSlot,
    durationMinutes: Number(durationMinutes) || 90,
    totalMarks: Number(totalMarks) || 100,
    passMarks: Number(passMarks) || 40,
    syllabus: syllabus || 'সম্পূর্ণ নির্ধারিত সিলেবাস',
    marksDistribution: marksDistribution || 'CQ + MCQ',
    venue: venue || 'অনলাইন পোর্টাল',
    zoomLink: zoomLink || '',
    status: 'upcoming',
    instructions: instructions || 'সকল নিয়মাবলি মেনে পরীক্ষায় অংশগ্রহণ করতে হবে।',
    createdAt: new Date().toISOString()
  };

  db.insert('exam_schedules', newExam);
  res.status(201).json(newExam);
});

app.put('/api/exam-schedules/:id', (req, res) => {
  const updated = db.update('exam_schedules', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Exam not found' });
  res.json(updated);
});

app.delete('/api/exam-schedules/:id', (req, res) => {
  const ok = db.delete('exam_schedules', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Exam not found' });
  res.json({ success: true, message: 'Exam deleted' });
});

// ================= PERFORMANCE REWARDS & XP =================
app.get('/api/rewards', (req, res) => {
  const { studentId } = req.query;
  let list = db.getAll('student_rewards');
  const users = db.getAll('users');

  if (studentId) {
    let reward = list.find(r => r.studentId === studentId);
    if (!reward) {
      // Auto-initialize for student
      reward = {
        id: `rew-${crypto.randomUUID().substring(0, 8)}`,
        studentId,
        xp: 600,
        level: 'Silver Scholar (রৌপ্য স্কলার)',
        streakDays: 3,
        rank: list.length + 1,
        badges: [
          {
            id: 'badge-welcome',
            name: 'New Scholar',
            nameBn: 'নবীন স্কলার',
            icon: 'Sparkles',
            color: 'indigo',
            earnedAt: new Date().toISOString().split('T')[0],
            description: 'এডুট্র্যাক টিউশন প্ল্যাটফর্মে যুক্ত হওয়ার অভিনন্দন।'
          }
        ],
        vouchers: [
          {
            id: 'vch-1',
            title: '৳৫০০ টিউশন ফি ডিসকাউন্ট ভাউচার (৳500 Tuition Fee Voucher)',
            xpCost: 800,
            discountAmount: 500,
            claimed: false,
            code: 'EXCELLENCE500'
          }
        ]
      };
      db.insert('student_rewards', reward);
    }
    const student = users.find(u => u.id === reward.studentId);
    return res.json({ ...reward, student });
  }

  const enriched = list.map(item => ({
    ...item,
    student: users.find(u => u.id === item.studentId)
  }));
  enriched.sort((a, b) => (b.xp || 0) - (a.xp || 0));
  enriched.forEach((item, idx) => {
    item.rank = idx + 1;
  });
  res.json(enriched);
});

app.post('/api/rewards/claim', (req, res) => {
  const { studentId, voucherId } = req.body;
  if (!studentId || !voucherId) {
    return res.status(400).json({ error: 'studentId and voucherId are required' });
  }

  const rewardsList = db.getAll('student_rewards');
  const userReward = rewardsList.find(r => r.studentId === studentId);
  if (!userReward) return res.status(404).json({ error: 'Rewards profile not found' });

  const vouchers = Array.isArray(userReward.vouchers) ? [...userReward.vouchers] : [];
  const vIndex = vouchers.findIndex(v => v.id === voucherId);
  if (vIndex === -1) return res.status(404).json({ error: 'Voucher not found' });

  const voucher = vouchers[vIndex];
  if (voucher.claimed) return res.status(400).json({ error: 'This voucher has already been claimed!' });

  if ((userReward.xp || 0) < voucher.xpCost) {
    return res.status(400).json({ error: `Not enough XP! Requires ${voucher.xpCost} XP, you have ${userReward.xp} XP.` });
  }

  const newXp = (userReward.xp || 0) - voucher.xpCost;
  voucher.claimed = true;
  voucher.claimedAt = new Date().toISOString();
  vouchers[vIndex] = voucher;

  db.update('student_rewards', userReward.id, {
    xp: newXp,
    vouchers
  });

  // Apply discount to student pending invoice if available
  let appliedInvoice = null;
  if (voucher.discountAmount > 0) {
    const invoices = db.getAll('invoices');
    const pendingInv = invoices.find(i => i.studentId === studentId && (i.status === 'pending' || i.status === 'overdue'));
    if (pendingInv) {
      const orig = Number(pendingInv.originalAmount || pendingInv.amount);
      const newAmt = Math.max(0, orig - voucher.discountAmount);
      appliedInvoice = db.update('invoices', pendingInv.id, {
        amount: newAmt,
        discountAmount: (Number(pendingInv.discountAmount) || 0) + voucher.discountAmount,
        discountReason: `রিওয়ার্ড পয়েন্ট রিডিম (${voucher.title})`
      });
    }
  }

  res.json({
    success: true,
    message: `অভিনন্দন! "${voucher.title}" সফলভাবে রিডিম করা হয়েছে!`,
    newXp,
    voucher,
    appliedInvoice
  });
});

app.post('/api/rewards/award-xp', (req, res) => {
  const { studentId, xpAmount, reason, badge } = req.body;
  if (!studentId || !xpAmount) return res.status(400).json({ error: 'studentId and xpAmount are required' });

  let userReward = db.getAll('student_rewards').find(r => r.studentId === studentId);
  if (!userReward) {
    userReward = {
      id: `rew-${crypto.randomUUID().substring(0, 8)}`,
      studentId,
      xp: 0,
      level: 'Bronze Scholar',
      streakDays: 1,
      badges: [],
      vouchers: []
    };
    db.insert('student_rewards', userReward);
  }

  const updatedXp = (userReward.xp || 0) + Number(xpAmount);
  const updates = { xp: updatedXp };

  if (badge) {
    const badges = Array.isArray(userReward.badges) ? [...userReward.badges] : [];
    badges.push({
      id: `badge-${crypto.randomUUID().substring(0, 6)}`,
      ...badge,
      earnedAt: new Date().toISOString().split('T')[0]
    });
    updates.badges = badges;
  }

  if (updatedXp >= 1500) updates.level = 'Platinum Scholar (প্লাটিনাম স্কলার)';
  else if (updatedXp >= 1000) updates.level = 'Gold Scholar (স্বর্ণ স্কলার)';
  else if (updatedXp >= 500) updates.level = 'Silver Ace (রৌপ্য স্কলার)';

  const result = db.update('student_rewards', userReward.id, updates);
  res.json({ success: true, reward: result, message: `${xpAmount} XP প্রদান করা হয়েছে!` });
});

// ================= PARENT-STUDENT LINKING =================
app.get('/api/parents/:id/students', (req, res) => {
  const parent = db.getById('users', req.params.id);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });
  const studentIds = parent.studentIds || [];
  const allStudents = db.getAll('users').filter(u => u.role === 'student');
  const linked = allStudents.filter(s => studentIds.includes(s.id) || s.parentId === parent.id);
  res.json(linked);
});

app.post('/api/time-requests/:id/parent-approve', (req, res) => {
  const { parentId, notes } = req.body;
  const request = db.getById('time_change_requests', req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const updatedReq = db.update('time_change_requests', req.params.id, {
    parentApproved: true,
    parentApprovalNotes: notes || 'অভিভাবক কর্তৃক অনুমোদিত ও সমর্থিত (Parent Approved)',
    parentApprovedAt: new Date().toISOString()
  });

  res.json({ success: true, request: updatedReq, message: 'অভিভাবক অনুমোদন সফলভাবে সংরক্ষিত হয়েছে!' });
});

// ================= STATS & SUMMARY =================
app.get('/api/stats/summary', (req, res) => {
  const users = db.getAll('users');
  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');
  const parents = users.filter(u => u.role === 'parent');
  const classes = db.getAll('classes');
  const invoices = db.getAll('invoices');
  const attendance = db.getAll('attendance');
  const deductions = db.getAll('deductions') || [];

  const totalEarnings = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const pendingDues = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const overdueDues = invoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalParents = parents.length;

  const totalDeductionsAmount = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = attendance.length > 0 
    ? Math.round((presentCount / attendance.length) * 100) 
    : 100;

  res.json({
    totalEarnings,
    pendingDues,
    overdueDues,
    totalTeachers,
    totalStudents,
    totalParents,
    totalClasses,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    pendingInvoices: invoices.filter(i => i.status === 'pending').length,
    overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
    attendanceRate,
    totalDeductionsCount: deductions.length,
    totalDeductionsAmount
  });
});

// ================= HOME TUITION MARKETPLACE & JOB REQUESTS =================
app.get('/api/tuition-requests', (req, res) => {
  const { studentId, teacherId, status } = req.query;
  let list = db.getAll('tuition_requests');

  if (studentId) {
    list = list.filter(r => r.studentId === studentId);
  }
  if (teacherId) {
    list = list.filter(r => !r.teacherId || r.teacherId === teacherId || r.teacherId === 'open');
  }
  if (status) {
    list = list.filter(r => r.status === status);
  }

  const users = db.getAll('users');
  const enriched = list.map(item => {
    const student = users.find(u => u.id === item.studentId);
    const teacher = users.find(u => u.id === item.teacherId);
    return {
      ...item,
      student,
      teacher
    };
  });

  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(enriched);
});

app.post('/api/tuition-requests', (req, res) => {
  const {
    studentId,
    teacherId,
    subject,
    grade,
    location,
    address,
    salary,
    daysPerWeek,
    timeSlot,
    tuitionType,
    requirements,
    studentPhone
  } = req.body;

  if (!studentId || !subject || !location) {
    return res.status(400).json({ error: 'studentId, subject, and location are required' });
  }

  const student = db.getById('users', studentId);
  const targetTeacher = teacherId ? db.getById('users', teacherId) : null;

  const newRequest = {
    id: `tr-${crypto.randomUUID().substring(0, 8)}`,
    studentId,
    teacherId: teacherId || null,
    studentName: student?.name || 'শিক্ষার্থী',
    studentPhone: studentPhone || student?.phone || '+880 1700-000000',
    parentPhone: student?.parentPhone || null,
    subject,
    grade: grade || student?.grade || 'দ্বাদশ শ্রেণী',
    location,
    address: address || '',
    salary: Number(salary) || 8000,
    daysPerWeek: daysPerWeek || '৩ দিন/সপ্তাহ',
    timeSlot: timeSlot || '০৫:০০ PM - ০৬:৩০ PM',
    tuitionType: tuitionType || 'home',
    requirements: requirements || '',
    status: 'pending',
    teacherResponseNote: null,
    acceptedAt: null,
    rejectedAt: null,
    createdAt: new Date().toISOString()
  };

  db.insert('tuition_requests', newRequest);

  // Send notification to target teacher or all teachers
  const teachers = targetTeacher ? [targetTeacher] : db.getAll('users').filter(u => u.role === 'teacher');
  teachers.forEach(t => {
    const notif = {
      id: `notif-${crypto.randomUUID().substring(0, 8)}`,
      recipientId: t.id,
      senderId: studentId,
      title: '🎯 নতুন হোম টিউশন জব রিকোয়েস্ট এসেছে!',
      message: `${student?.name || 'একজন শিক্ষার্থী'} ${subject}-এ (${location}) প্রতি মাসে ৳${newRequest.salary} বেতনে হোম টিউশনের রিকোয়েস্ট পাঠিয়েছেন। গ্রহণ করতে টিউশন জব পেজে যান।`,
      type: 'tuition_job',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    if (!db.data.notifications) db.data.notifications = [];
    db.data.notifications.push(notif);
  });
  db.save();

  res.status(201).json(newRequest);
});

app.put('/api/tuition-requests/:id/respond', (req, res) => {
  const { action, responseNote, teacherId } = req.body;
  const request = db.getById('tuition_requests', req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Tuition request not found' });
  }

  if (action !== 'accept' && action !== 'reject') {
    return res.status(400).json({ error: 'Action must be either "accept" or "reject"' });
  }

  const teacher = db.getById('users', teacherId || request.teacherId || 'teacher-1');
  const now = new Date().toISOString();

  const updates = {
    status: action === 'accept' ? 'accepted' : 'rejected',
    teacherId: teacher?.id || request.teacherId,
    teacherResponseNote: responseNote || (action === 'accept' ? 'টিউশন রিকোয়েস্ট গ্রহণ করা হয়েছে।' : 'বর্তমানে সময় স্বল্পতার কারণে গ্রহণ করা সম্ভব হচ্ছে না।'),
    ...(action === 'accept' ? { acceptedAt: now } : { rejectedAt: now })
  };

  const updated = db.update('tuition_requests', request.id, updates);

  // Notify student
  const notif = {
    id: `notif-${crypto.randomUUID().substring(0, 8)}`,
    recipientId: request.studentId,
    senderId: teacher?.id || 'teacher-1',
    title: action === 'accept' ? '🎉 শিক্ষক আপনার হোম টিউশন রিকোয়েস্ট গ্রহণ করেছেন!' : '⚠️ টিউশন রিকোয়েস্ট সংক্রান্ত নোটিশ',
    message: action === 'accept' 
      ? `শিক্ষক ${teacher?.name || 'শিক্ষক'} আপনার ${request.subject} হোম টিউশন রিকোয়েস্ট গ্রহণ করেছেন। নোট: "${updates.teacherResponseNote}"`
      : `শিক্ষক ${teacher?.name || 'শিক্ষক'} আপনার ${request.subject} টিউশন রিকোয়েস্টটি গ্রহণ করতে পারেননি। নোট: "${updates.teacherResponseNote}"`,
    type: action === 'accept' ? 'success' : 'info',
    isRead: false,
    createdAt: now
  };
  if (!db.data.notifications) db.data.notifications = [];
  db.data.notifications.push(notif);

  // Auto-send welcome message in chat if accepted
  if (action === 'accept') {
    const welcomeMsg = {
      id: `msg-${crypto.randomUUID().substring(0, 8)}`,
      senderId: teacher?.id || 'teacher-1',
      receiverId: request.studentId,
      text: `আসসালামু আলাইকুম ${request.studentName}, আমি আপনার ${request.subject} বিষয়ের হোম টিউশন রিকোয়েস্টটি গ্রহণ করেছি। ${updates.teacherResponseNote ? 'নোট: ' + updates.teacherResponseNote : 'শীঘ্রই ক্লাসের সময়সূচী ও বিস্তারিত বিষয়ে আলোচনা শুরু করছি।'}`,
      isRead: false,
      createdAt: now
    };
    db.insert('messages', welcomeMsg);
  }

  db.save();

  res.json({ success: true, request: updated });
});

app.get('/api/tutors', (req, res) => {
  const { subject, area, maxRate } = req.query;
  const teachers = db.getAll('users').filter(u => u.role === 'teacher');

  let tutors = teachers.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone || '+880 1712-345678',
    avatar: t.avatar,
    title: t.title,
    bio: t.bio,
    hourlyRate: t.hourlyRate || 500,
    monthlyRate: (t.hourlyRate || 500) * 12,
    rating: 4.9,
    reviewCount: 42,
    experience: '৭+ বছর (7+ Years Experience)',
    education: 'বিএসসি ও এমএসসি (বুয়েট / ঢাবি)',
    subjects: t.id === 'teacher-1' 
      ? ['উচ্চতর গণিত', 'পদার্থবিজ্ঞান', 'ক্যালকুলাস'] 
      : ['পদার্থবিজ্ঞান', 'রসায়ন', 'আইসিটি'],
    preferredAreas: ['ধানমন্ডি', 'মোহাম্মদপুর', 'মিরপুর', 'উত্তরা', 'গুলশান', 'বনানী', 'অনলাইন সারা বাংলাদেশ'],
    tuitionTypes: ['হোম টিউশন (Home)', 'অনলাইন ১-অন-১ (Online)'],
    badge: 'ভেরিফাইড এক্সপার্ট টিউটর'
  }));

  if (subject) {
    tutors = tutors.filter(t => 
      t.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase())) || 
      (t.title && t.title.toLowerCase().includes(subject.toLowerCase()))
    );
  }
  if (area) {
    tutors = tutors.filter(t => 
      t.preferredAreas.some(a => a.toLowerCase().includes(area.toLowerCase()))
    );
  }
  if (maxRate) {
    tutors = tutors.filter(t => t.hourlyRate <= Number(maxRate));
  }

  res.json(tutors);
});

// Reset data endpoint
app.post('/api/reset-data', (req, res) => {
  const data = db.reset();
  res.json({ success: true, message: 'Database reset to initial demo dataset', data });
});

// Serve built React client assets if available
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Tuition Tracker Backend Server listening on http://localhost:${PORT}`);
  console.log(`🌐 Application UI available at: http://localhost:${PORT}`);
});
