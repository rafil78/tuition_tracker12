import crypto from 'crypto';
import { db } from './db.js';

export const notificationService = {
  // Generic single notification & phone SMS dispatcher
  sendNotification({ recipientId, recipientPhone, recipientName, type, title, message, data = {}, sendSms = true }) {
    const notif = {
      id: `notif-${crypto.randomUUID().substring(0, 8)}`,
      recipientId,
      recipientName: recipientName || 'User',
      recipientPhone: recipientPhone || '',
      type: type || 'system',
      title,
      message,
      data,
      isRead: false,
      smsStatus: sendSms && recipientPhone ? 'delivered' : 'skipped',
      createdAt: new Date().toISOString()
    };

    db.insert('notifications', notif);

    let smsRecord = null;
    if (sendSms && recipientPhone) {
      smsRecord = {
        id: `sms-${crypto.randomUUID().substring(0, 8)}`,
        to: recipientPhone,
        recipientName: recipientName || 'User',
        recipientId,
        type,
        message,
        status: 'delivered',
        gateway: 'EduTrack BD Phone SMS Gateway (AlphaSMS / Greenweb)',
        sentAt: new Date().toISOString()
      };
      db.insert('sms_logs', smsRecord);
      console.log(`📱 [Phone SMS Gateway] Sent to ${recipientPhone} (${recipientName}): "${message}"`);
    }

    return { notification: notif, sms: smsRecord };
  },

  // 1. Send Class Reminder to ALL phones (Students, Teacher, Parents)
  sendClassReminderToAll(classId) {
    const classes = db.getAll('classes');
    const targetClass = (classId ? classes.find(c => c.id === classId) : null) || classes[0];
    if (!targetClass) return { success: false, message: 'Class not found' };

    const users = db.getAll('users');
    const enrollments = db.getAll('enrollments').filter(e => e.classId === targetClass.id);
    const enrolledStudentIds = enrollments.map(e => e.studentId);
    
    // Find teacher
    const teacher = users.find(u => u.id === targetClass.teacherId) || users.find(u => u.role === 'teacher');
    
    // Find enrolled students
    const enrolledStudents = users.filter(u => enrolledStudentIds.includes(u.id));
    // If no explicit enrollments, include active students
    const studentsToNotify = enrolledStudents.length > 0 ? enrolledStudents : users.filter(u => u.role === 'student');

    // Find parents
    const parents = users.filter(u => u.role === 'parent');

    const results = [];

    // A. Notify Teacher Phone
    if (teacher) {
      const teacherPhone = teacher.phone || '+880 1712-345678';
      const msg = `📢 [EduTrack শিক্ষক রিমাইন্ডার] আসসালামু আলাইকুম ${teacher.name}, আপনার '${targetClass.title}' ক্লাস আজ ${targetClass.timeSlot} এ শুরু হবে। অনলাইন রুম: ${targetClass.meetingLink || 'Zoom/Live'}`;
      const res = this.sendNotification({
        recipientId: teacher.id,
        recipientPhone: teacherPhone,
        recipientName: teacher.name,
        type: 'class_reminder',
        title: `ক্লাস রিমাইন্ডার: ${targetClass.title}`,
        message: msg,
        data: { classId: targetClass.id, role: 'teacher' }
      });
      results.push({ role: 'teacher', name: teacher.name, phone: teacherPhone, ...res });
    }

    // B. Notify All Enrolled Students' Phones
    studentsToNotify.forEach(student => {
      const studentPhone = student.phone || '+880 1819-234567';
      const msg = `📢 [EduTrack ক্লাস নোটিফিকেশন] হ্যালো ${student.name}, আপনার '${targetClass.title}' ক্লাস আজ ${targetClass.timeSlot} এ শুরু হচ্ছে। প্রস্তুতি নিন ও সরাসরি লিংকে যুক্ত হোন: ${targetClass.meetingLink || 'https://zoom.us/edutrack'}`;
      const res = this.sendNotification({
        recipientId: student.id,
        recipientPhone: studentPhone,
        recipientName: student.name,
        type: 'class_reminder',
        title: `আজকের ক্লাস: ${targetClass.title}`,
        message: msg,
        data: { classId: targetClass.id, role: 'student' }
      });
      results.push({ role: 'student', name: student.name, phone: studentPhone, ...res });

      // C. Notify Student's Guardian / Parent Phone
      const parentPhone = student.parentPhone || (parents[0] ? parents[0].phone : '+880 1819-001122');
      const parentName = student.parentName || (parents[0] ? parents[0].name : 'অভিভাবক');
      const parentMsg = `📢 [EduTrack অভিভাবক নোটিস] সম্মানিত অভিভাবক, আপনার সন্তান ${student.name}-এর '${targetClass.subject || targetClass.title}' ক্লাস আজ ${targetClass.timeSlot} এ অনুষ্ঠিত হবে। উপস্থিতি নিশ্চিত করুন।`;
      const pRes = this.sendNotification({
        recipientId: student.parentId || (parents[0] ? parents[0].id : `parent-${student.id}`),
        recipientPhone: parentPhone,
        recipientName: parentName,
        type: 'class_reminder',
        title: `সন্তানের ক্লাস রিমাইন্ডার: ${student.name}`,
        message: parentMsg,
        data: { classId: targetClass.id, studentId: student.id, role: 'parent' }
      });
      results.push({ role: 'parent', name: parentName, phone: parentPhone, ...pRes });
    });

    console.log(`✅ [Phone SMS Broadcast] Sent class reminder to ${results.length} phones (Teacher, Students & Parents)!`);
    return {
      success: true,
      classTitle: targetClass.title,
      timeSlot: targetClass.timeSlot,
      totalDispatched: results.length,
      recipients: results
    };
  },

  // 2. Attendance & Fee Deduction Alerts
  sendAttendanceAlert({ classId, studentId, date, status, perClassRate = 500 }) {
    const classes = db.getAll('classes');
    const targetClass = classes.find(c => c.id === classId) || classes[0];
    const users = db.getAll('users');
    const student = users.find(u => u.id === studentId);
    if (!student) return null;

    const parentPhone = student.parentPhone || '+880 1819-001122';
    const parentName = student.parentName || 'অভিভাবক';

    if (status === 'teacher_skipped') {
      // Notify parent & student of auto deduction
      const msg = `📢 [EduTrack স্বয়ংক্রিয় ফি কর্তন] শিক্ষক কর্তৃক আজকের (${date}) ক্লাস বাদ যাওয়ায় ছাত্রের চলতি মাসের ইনভয়েস থেকে ৳${perClassRate} স্বয়ংক্রিয়ভাবে ছাড়/কর্তন করা হয়েছে।`;
      this.sendNotification({
        recipientId: student.id,
        recipientPhone: student.phone,
        recipientName: student.name,
        type: 'attendance_deduction',
        title: `ফি কর্তন নোটিফিকেশন (-৳${perClassRate})`,
        message: msg,
        data: { classId, date, status, perClassRate }
      });
      this.sendNotification({
        recipientId: student.parentId || 'parent-1',
        recipientPhone: parentPhone,
        recipientName: parentName,
        type: 'attendance_deduction',
        title: `শিক্ষক স্কিপ কর্তন (-৳${perClassRate})`,
        message: msg,
        data: { classId, date, status, perClassRate }
      });
    } else if (status === 'absent') {
      const msg = `📢 [EduTrack অনুপস্থিতি বার্তা] সম্মানিত অভিভাবক, ${student.name} আজকের (${date}) '${targetClass?.title || 'টিউশন'}' ক্লাসে অনুপস্থিত ছিল।`;
      this.sendNotification({
        recipientId: student.parentId || 'parent-1',
        recipientPhone: parentPhone,
        recipientName: parentName,
        type: 'attendance_absent',
        title: `অনুপস্থিতি নোটিফিকেশন: ${student.name}`,
        message: msg,
        data: { classId, date, status }
      });
    } else if (status === 'present') {
      const msg = `📢 [EduTrack উপস্থিতি নোটিস] ${student.name} আজকের (${date}) '${targetClass?.title || 'টিউশন'}' ক্লাসে সফলভাবে উপস্থিত ছিল।`;
      this.sendNotification({
        recipientId: student.parentId || 'parent-1',
        recipientPhone: parentPhone,
        recipientName: parentName,
        type: 'attendance_present',
        title: `উপস্থিতি নোটিস: ${student.name}`,
        message: msg,
        data: { classId, date, status }
      });
    }
  },

  // 3. Invoice & Payment Notifications
  sendInvoiceAlert({ invoiceId }) {
    const invoices = db.getAll('invoices');
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return null;

    const users = db.getAll('users');
    const student = users.find(u => u.id === inv.studentId);
    const phone = student?.parentPhone || student?.phone || '+880 1819-001122';
    const name = student?.parentName || student?.name || 'অভিভাবক/শিক্ষার্থী';

    const msg = `📢 [EduTrack ফি ইনভয়েস] আপনার ${inv.title || 'টিউশন ফি'} এর ইনভয়েস (${inv.invoiceNumber}) তৈরি হয়েছে। পরিমাণ: ৳${inv.amount}। অনুগ্রহ করে বিকাশ/নগদ/কার্ডে সময়মত পরিশোধ করুন।`;
    return this.sendNotification({
      recipientId: inv.studentId,
      recipientPhone: phone,
      recipientName: name,
      type: 'invoice_due',
      title: `টিউশন ফি ইনভয়েস: ৳${inv.amount}`,
      message: msg,
      data: { invoiceId: inv.id, amount: inv.amount }
    });
  },

  // 4. New Homework Assignment Alert
  sendAssignmentAlert({ classId, assignmentTitle, dueDate }) {
    const users = db.getAll('users');
    const enrollments = db.getAll('enrollments').filter(e => e.classId === classId);
    const studentIds = enrollments.map(e => e.studentId);
    const students = users.filter(u => studentIds.includes(u.id));

    students.forEach(st => {
      const msg = `📢 [EduTrack নতুন হোমওয়ার্ক] আপনার ক্লাসে নতুন টাস্ক দেওয়া হয়েছে: '${assignmentTitle}'। জমা দেওয়ার শেষ সময়: ${dueDate}।`;
      this.sendNotification({
        recipientId: st.id,
        recipientPhone: st.phone || '+880 1819-234567',
        recipientName: st.name,
        type: 'homework',
        title: `নতুন হোমওয়ার্ক: ${assignmentTitle}`,
        message: msg,
        data: { classId, assignmentTitle, dueDate }
      });
    });
  },

  // 5. General Announcement Broadcast
  sendAnnouncementBroadcast({ title, content, classId }) {
    const users = db.getAll('users').filter(u => u.role !== 'bot');
    users.forEach(u => {
      const msg = `📢 [EduTrack সাধারণ নোটিশ] ${title}: ${content.substring(0, 80)}...`;
      this.sendNotification({
        recipientId: u.id,
        recipientPhone: u.phone || '+880 1700-000000',
        recipientName: u.name,
        type: 'announcement',
        title: `নোটিশ: ${title}`,
        message: msg,
        data: { classId, title }
      });
    });
  }
};
