import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial realistic seed dataset
const initialData = {
  users: [
    {
      id: 'admin-1',
      name: 'সিস্টেম অ্যাডমিনিস্ট্রেটর (System Admin)',
      email: 'admin@edutrack.com',
      password: 'admin123',
      role: 'admin',
      title: 'প্রধান একাডেমি পরিচালক ও কন্ট্রোলার (Academy Director)',
      phone: '+880 1700-ADMIN1',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      bio: 'একাডেমিক অপারেশনস, শিক্ষক-শিক্ষার্থী ডাটাবেস, ক্লাস শিডিউল ও পেমেন্ট কন্ট্রোলার।',
      hourlyRate: 0,
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'teacher-1',
      name: 'ড. রশিদুল করিম (Prof. David Miller)',
      email: 'david.miller@edutrack.com',
      password: 'password123',
      role: 'teacher',
      title: 'উচ্চতর গণিত ও পদার্থবিজ্ঞান বিশেষজ্ঞ (Mathematics & Physics Specialist)',
      phone: '+880 1712-345678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      bio: 'ফলিত গণিতে মাস্টার্স। ১০+ বছর ধরে শীর্ষ পর্যায়ের শিক্ষার্থীদের গণিত ও পদার্থবিজ্ঞানে এ+ অর্জনে সহায়তা করছেন।',
      hourlyRate: 500,
      createdAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'student-1',
      name: 'তানভীর আহমেদ (Alex Rivera)',
      email: 'alex.rivera@student.edu',
      password: 'password123',
      role: 'student',
      title: 'এইচএসসি ১ম বর্ষ / একাদশ শ্রেণী (Grade 11)',
      grade: 'একাদশ শ্রেণী (Grade 11)',
      phone: '+880 1819-234567',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
      parentName: 'মিসেস রাবেয়া আহমেদ (Elena Rivera)',
      parentPhone: '+880 1819-001122',
      bio: 'ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি এবং উচ্চতর ক্যালকুলাসে নিবেদিত শিক্ষার্থী।',
      createdAt: '2026-02-15T09:30:00Z'
    },
    {
      id: 'student-2',
      name: 'নুসরাত জাহান (Emily Zhang)',
      email: 'emily.zhang@student.edu',
      password: 'password123',
      role: 'student',
      title: 'এইচএসসি ২য় বর্ষ / দ্বাদশ শ্রেণী (Grade 12)',
      grade: 'দ্বাদশ শ্রেণী (Grade 12)',
      phone: '+880 1912-345678',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
      parentName: 'মো. জহিরুল ইসলাম (Hao Zhang)',
      parentPhone: '+880 1912-002233',
      bio: 'পদার্থবিজ্ঞান, রসায়ন ও অ্যাডভান্সড ক্যালকুলাসে অধ্যয়নরত।',
      createdAt: '2026-02-20T11:00:00Z'
    },
    {
      id: 'student-3',
      name: 'ফারহান কবির (Liam Vance)',
      email: 'liam.vance@student.edu',
      password: 'password123',
      role: 'student',
      title: 'এসএসসি পরীক্ষার্থী / দশম শ্রেণী (Grade 10)',
      grade: 'দশম শ্রেণী (Grade 10)',
      phone: '+880 1611-223344',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      parentName: 'কবির হোসেন (Marcus Vance)',
      parentPhone: '+880 1611-003344',
      bio: 'উচ্চতর গণিত ও পদার্থবিজ্ঞানের মৌলিক বিষয়ে প্রস্তুতি নিচ্ছেন।',
      createdAt: '2026-03-01T14:15:00Z'
    },
    {
      id: 'student-due',
      name: 'রাকিবুল ইসলাম (Rakibul Islam - বকেয়া ডেমো)',
      email: 'rakibul.dues@student.edu',
      password: 'password123',
      role: 'student',
      title: 'এইচএসসি বিজ্ঞান (HSC Science - ৳15,200 বকেয়া ডেমো)',
      grade: 'দ্বাদশ শ্রেণী (Grade 12)',
      phone: '+880 1711-998877',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      parentName: 'মো. রফিকুল ইসলাম (Rafiqul Islam - Parent)',
      parentPhone: '+880 1811-998877',
      bio: 'বকেয়া টিউশন ফি ও এসএসএলকমার্স (SSLCommerz) টেস্ট করার জন্য বিশেষ ডেমো একাউন্ট। মোট বকেয়া: ৳১৫,২০০ (৫টি ইনভয়েস)।',
      emailVerified: true,
      createdAt: '2026-06-01T00:00:00Z'
    }
  ],

  classes: [
    {
      id: 'cls-1',
      teacherId: 'teacher-1',
      title: 'উচ্চতর গণিত ও ক্যালকুলাস (Calculus BC & Exam Prep)',
      subject: 'উচ্চতর গণিত (Mathematics)',
      gradeLevel: 'একাদশ - দ্বাদশ শ্রেণী (Grade 11 - 12)',
      scheduleDays: ['Monday', 'Wednesday', 'Friday'],
      timeSlot: '05:00 PM - 06:30 PM',
      monthlyFee: 3000,
      hourlyRate: 500,
      meetingLink: 'https://meet.google.com/edu-calc-bc',
      room: 'অনলাইন ভার্চুয়াল ক্লাসরুম',
      description: 'ডিফারেনশিয়াল ও ইন্টিগ্রাল ক্যালকুলাস, সিরিজ এবং বোর্ড/ভর্তি পরীক্ষার নিবিড় অনুশীলন।',
      color: 'indigo',
      status: 'active'
    },
    {
      id: 'cls-2',
      teacherId: 'teacher-1',
      title: 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র (Physics Mechanics & Waves)',
      subject: 'পদার্থবিজ্ঞান (Physics)',
      gradeLevel: 'একাদশ - দ্বাদশ শ্রেণী (Grade 11 - 12)',
      scheduleDays: ['Tuesday', 'Thursday'],
      timeSlot: '04:30 PM - 06:00 PM',
      monthlyFee: 2500,
      hourlyRate: 450,
      meetingLink: 'https://meet.google.com/edu-phys-mech',
      room: 'বিজ্ঞান ল্যাব / অনলাইন',
      description: 'গতিবিদ্যা, নিউটোনিয়ান বলবিদ্যা, কাজ-শক্তি ও ঘূর্ণন গতিবিদ্যার থিওরি ও গাণিতিক সমাধান।',
      color: 'emerald',
      status: 'active'
    },
    {
      id: 'cls-3',
      teacherId: 'teacher-1',
      title: 'ভর্তি পরীক্ষা ও এসএটি গণিত (Admission Math Prep)',
      subject: 'ভর্তি প্রস্তুতি (Test Prep)',
      gradeLevel: 'এসএসসি - এইচএসসি (Grade 10 - 12)',
      scheduleDays: ['Saturday'],
      timeSlot: '10:00 AM - 12:30 PM',
      monthlyFee: 2000,
      hourlyRate: 400,
      meetingLink: 'https://meet.google.com/edu-sat-math',
      room: 'অনলাইন স্পেশাল গ্রুপ ব্যাচ',
      description: 'শর্টকাট কৌশল, বীজগণিত ও ত্রিকোণমিতি ড্রিল এবং স্পিড ম্যানেজমেন্ট মক টেস্ট।',
      color: 'amber',
      status: 'active'
    }
  ],

  enrollments: [
    { id: 'enr-1', classId: 'cls-1', studentId: 'student-1', enrolledAt: '2026-09-01', status: 'active' },
    { id: 'enr-2', classId: 'cls-3', studentId: 'student-1', enrolledAt: '2026-09-05', status: 'active' },
    { id: 'enr-3', classId: 'cls-1', studentId: 'student-2', enrolledAt: '2026-09-01', status: 'active' },
    { id: 'enr-4', classId: 'cls-2', studentId: 'student-2', enrolledAt: '2026-09-02', status: 'active' },
    { id: 'enr-5', classId: 'cls-2', studentId: 'student-3', enrolledAt: '2026-09-10', status: 'active' },
    { id: 'enr-due-1', classId: 'cls-1', studentId: 'student-due', enrolledAt: '2026-07-01', status: 'active' },
    { id: 'enr-due-2', classId: 'cls-2', studentId: 'student-due', enrolledAt: '2026-07-01', status: 'active' }
  ],

  attendance: [
    { id: 'att-1', classId: 'cls-1', studentId: 'student-1', date: '2026-10-12', status: 'present', notes: 'Active participation' },
    { id: 'att-2', classId: 'cls-1', studentId: 'student-2', date: '2026-10-12', status: 'present', notes: 'On time' },
    { id: 'att-3', classId: 'cls-1', studentId: 'student-1', date: '2026-10-09', status: 'present', notes: 'Completed in-class quiz' },
    { id: 'att-4', classId: 'cls-1', studentId: 'student-2', date: '2026-10-09', status: 'late', notes: 'Joined 10 mins late due to school bus' },
    { id: 'att-5', classId: 'cls-1', studentId: 'student-1', date: '2026-10-06', status: 'present', notes: '' },
    { id: 'att-6', classId: 'cls-1', studentId: 'student-2', date: '2026-10-06', status: 'absent', notes: 'Excused sick leave' },
    { id: 'att-7', classId: 'cls-2', studentId: 'student-2', date: '2026-10-08', status: 'present', notes: 'Great lab report submission' },
    { id: 'att-8', classId: 'cls-2', studentId: 'student-3', date: '2026-10-08', status: 'present', notes: '' },
    { id: 'att-9', classId: 'cls-3', studentId: 'student-1', date: '2026-10-10', status: 'present', notes: 'SAT Practice Section 3' }
  ],

  invoices: [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-001',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      classId: 'cls-1',
      title: 'AP Calculus BC - October Tuition Fee',
      amount: 180,
      dueDate: '2026-10-25',
      status: 'pending',
      billingMonth: 'October 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-002',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      classId: 'cls-3',
      title: 'SAT Math Mastery - October Tuition Fee',
      amount: 120,
      dueDate: '2026-10-10',
      status: 'overdue',
      billingMonth: 'October 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-09-28T09:00:00Z'
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-003',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      classId: 'cls-1',
      title: 'AP Calculus BC - September Tuition Fee',
      amount: 180,
      dueDate: '2026-09-25',
      status: 'paid',
      billingMonth: 'September 2026',
      paymentMethod: 'card',
      transactionId: 'TXN-STRIPE-928174',
      paidAt: '2026-09-22T14:10:00Z',
      createdAt: '2026-09-01T08:00:00Z'
    },
    {
      id: 'inv-4',
      invoiceNumber: 'INV-2026-004',
      studentId: 'student-2',
      teacherId: 'teacher-1',
      classId: 'cls-1',
      title: 'AP Calculus BC - October Tuition Fee',
      amount: 180,
      dueDate: '2026-10-20',
      status: 'paid',
      paymentMethod: 'paypal',
      transactionId: 'PAYPAL-89123847',
      paidAt: '2026-10-04T10:30:00Z',
      billingMonth: 'October 2026',
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'inv-5',
      invoiceNumber: 'INV-2026-005',
      studentId: 'student-2',
      teacherId: 'teacher-1',
      classId: 'cls-2',
      title: 'AP Physics Mechanics - October Tuition Fee',
      amount: 150,
      dueDate: '2026-10-22',
      status: 'pending',
      billingMonth: 'October 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'inv-6',
      invoiceNumber: 'INV-2026-006',
      studentId: 'student-3',
      teacherId: 'teacher-1',
      classId: 'cls-2',
      title: 'AP Physics Mechanics - October Tuition Fee',
      amount: 150,
      dueDate: '2026-10-18',
      status: 'paid',
      paymentMethod: 'upi',
      transactionId: 'UPI-REF-4491028',
      paidAt: '2026-10-06T18:45:00Z',
      billingMonth: 'October 2026',
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'inv-due-1',
      invoiceNumber: 'INV-2026-DUE-01',
      studentId: 'student-due',
      teacherId: 'teacher-1',
      classId: 'cls-1',
      title: 'উচ্চতর গণিত ও ক্যালকুলাস - জুলাই ২০২৬ টিউশন ফি',
      amount: 3000,
      dueDate: '2026-07-25',
      status: 'overdue',
      billingMonth: 'July 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-07-01T08:00:00Z'
    },
    {
      id: 'inv-due-2',
      invoiceNumber: 'INV-2026-DUE-02',
      studentId: 'student-due',
      teacherId: 'teacher-1',
      classId: 'cls-2',
      title: 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র - আগস্ট ২০২৬ টিউশন ফি',
      amount: 2500,
      dueDate: '2026-08-25',
      status: 'overdue',
      billingMonth: 'August 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-08-01T08:00:00Z'
    },
    {
      id: 'inv-due-3',
      invoiceNumber: 'INV-2026-DUE-03',
      studentId: 'student-due',
      teacherId: 'teacher-1',
      classId: 'cls-1',
      title: 'উচ্চতর গণিত ও ক্যালকুলাস - সেপ্টেম্বর ২০২৬ টিউশন ফি',
      amount: 3000,
      dueDate: '2026-09-25',
      status: 'overdue',
      billingMonth: 'September 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-09-01T08:00:00Z'
    },
    {
      id: 'inv-due-4',
      invoiceNumber: 'INV-2026-DUE-04',
      studentId: 'student-due',
      teacherId: 'teacher-1',
      classId: 'cls-2',
      title: 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র - অক্টোবর ২০২৬ টিউশন ফি',
      amount: 2500,
      dueDate: '2026-10-10',
      status: 'overdue',
      billingMonth: 'October 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'inv-due-5',
      invoiceNumber: 'INV-2026-DUE-05',
      studentId: 'student-due',
      teacherId: 'teacher-1',
      classId: 'cls-1',
      title: 'উচ্চতর গণিত ও ক্যালকুলাস - নভেম্বর ২০২৬ টিউশন ফি (চলতি)',
      amount: 3000,
      dueDate: '2026-11-20',
      status: 'pending',
      billingMonth: 'November 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-10-10T08:00:00Z'
    },
    {
      id: 'inv-due-6',
      invoiceNumber: 'INV-2026-DUE-06',
      studentId: 'student-due',
      teacherId: 'teacher-1',
      classId: 'cls-2',
      title: 'বোর্ড স্পেশাল মডেল টেস্ট ও প্র্যাক্টিক্যাল ল্যাব ফি',
      amount: 1200,
      dueDate: '2026-09-15',
      status: 'overdue',
      billingMonth: 'September 2026',
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: '2026-09-01T08:00:00Z'
    }
  ],

  messages: [
    {
      id: 'msg-1',
      senderId: 'teacher-1',
      receiverId: 'student-1',
      text: 'Hi Alex, don’t forget to check the revision notes on Integration by Parts ahead of tomorrow’s class.',
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: '2026-10-11T16:00:00Z'
    },
    {
      id: 'msg-2',
      senderId: 'student-1',
      receiverId: 'teacher-1',
      text: 'Thanks Prof. Miller! I solved questions 1 to 10. Could we review problem 8 during the warm-up?',
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: '2026-10-11T17:15:00Z'
    },
    {
      id: 'msg-3',
      senderId: 'teacher-1',
      receiverId: 'student-1',
      text: 'Absolutely! Problem 8 is a classic substitution trick. We will break it down first thing.',
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: '2026-10-11T17:40:00Z'
    },
    {
      id: 'msg-4',
      senderId: 'student-2',
      receiverId: 'teacher-1',
      text: 'Hello Professor, here is the formula sheet draft for the Physics rotation quiz.',
      attachmentName: 'rotational-dynamics-formulae.pdf',
      attachmentUrl: '#formula-sheet',
      isRead: true,
      createdAt: '2026-10-12T11:00:00Z'
    },
    {
      id: 'msg-5',
      senderId: 'teacher-1',
      receiverId: 'student-2',
      text: 'Looks very comprehensive Emily! Be sure to double-check the parallel axis theorem formula.',
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: '2026-10-12T13:20:00Z'
    }
  ],

  assignments: [
    {
      id: 'asg-1',
      classId: 'cls-1',
      teacherId: 'teacher-1',
      title: 'Taylor & Maclaurin Series Practice Set',
      description: 'Calculate series expansions for sin(x), e^(2x), and estimate error using Taylor Remainder theorem (Problems 1-12).',
      dueDate: '2026-10-18T23:59:00Z',
      maxScore: 100,
      resourceLink: 'https://ocw.mit.edu/calculus-taylor-series',
      createdAt: '2026-10-10T10:00:00Z'
    },
    {
      id: 'asg-2',
      classId: 'cls-1',
      teacherId: 'teacher-1',
      title: 'Definite Integrals & Area Between Curves',
      description: 'Solve questions from Textbook Section 6.2. Sketch the curves and show integration limits.',
      dueDate: '2026-10-14T23:59:00Z',
      maxScore: 50,
      resourceLink: null,
      createdAt: '2026-10-05T09:00:00Z'
    },
    {
      id: 'asg-3',
      classId: 'cls-2',
      teacherId: 'teacher-1',
      title: 'Lab Report: Conservation of Angular Momentum',
      description: 'Write up a 2-page report on gyroscope precession experiment with recorded angular velocities and error margins.',
      dueDate: '2026-10-21T23:59:00Z',
      maxScore: 100,
      resourceLink: null,
      createdAt: '2026-10-09T14:00:00Z'
    }
  ],

  submissions: [
    {
      id: 'sub-1',
      assignmentId: 'asg-2',
      studentId: 'student-1',
      submittedAt: '2026-10-13T10:30:00Z',
      submissionText: 'I finished all 8 questions. I used cross-sectional slicing for question 7.',
      fileUrl: 'alex-rivera-area-curves-solution.pdf',
      status: 'graded',
      score: 48,
      feedback: 'Splendid work Alex! Clean graphs and clear integration step transitions.'
    },
    {
      id: 'sub-2',
      assignmentId: 'asg-2',
      studentId: 'student-2',
      submittedAt: '2026-10-13T12:00:00Z',
      submissionText: 'Completed solutions attached. Included alternative solution for problem 4.',
      fileUrl: 'emily-zhang-calculus-ch6.pdf',
      status: 'submitted',
      score: null,
      feedback: null
    }
  ],

  exam_marks: [
    {
      id: 'exm-1',
      classId: 'cls-1',
      studentId: 'student-1',
      examTitle: 'AP Calculus Unit 2: Derivatives & Mean Value Theorem',
      maxMarks: 100,
      obtainedMarks: 94,
      examDate: '2026-09-28',
      remarks: 'Grade A+ • Outstanding problem solving speed'
    },
    {
      id: 'exm-2',
      classId: 'cls-1',
      studentId: 'student-2',
      examTitle: 'AP Calculus Unit 2: Derivatives & Mean Value Theorem',
      maxMarks: 100,
      obtainedMarks: 97,
      examDate: '2026-09-28',
      remarks: 'Grade A+ • Top mark in batch'
    },
    {
      id: 'exm-3',
      classId: 'cls-3',
      studentId: 'student-1',
      examTitle: 'SAT Math Diagnostic Full Test #1',
      maxMarks: 800,
      obtainedMarks: 760,
      examDate: '2026-10-02',
      remarks: '98th percentile • Improved 70 points since August'
    },
    {
      id: 'exm-4',
      classId: 'cls-2',
      studentId: 'student-2',
      examTitle: 'Physics Mechanics Midterm: Kinematics & Energy',
      maxMarks: 100,
      obtainedMarks: 91,
      examDate: '2026-09-30',
      remarks: 'Grade A • Strong conceptual clarity on friction forces'
    }
  ],

  announcements: [
    {
      id: 'anc-1',
      classId: 'cls-1',
      teacherId: 'teacher-1',
      title: 'Upcoming Weekend Mock Exam: AP Calculus',
      content: 'We will conduct a 90-minute timed mock test on Saturday at 4:00 PM. Please have your graphing calculators and scrap paper ready.',
      createdAt: '2026-10-12T08:30:00Z'
    },
    {
      id: 'anc-2',
      classId: 'cls-2',
      teacherId: 'teacher-1',
      title: 'Lab Simulation Link Updated',
      content: 'The PhET interactive physics simulation link for simple harmonic motion is now uploaded under class resources.',
      createdAt: '2026-10-08T15:00:00Z'
    }
  ],

  settings: {
    currencyCode: 'BDT',
    currencySymbol: '৳',
    currencyName: 'Bangladeshi Taka',
    vatPercent: 0
  },

  time_change_requests: [
    {
      id: 'tcr-1',
      studentId: 'student-1',
      classId: 'cls-1',
      currentSlot: '05:00 PM - 06:30 PM',
      proposedSlot: '06:30 PM - 08:00 PM',
      proposedDays: ['Monday', 'Wednesday', 'Friday'],
      reason: 'School exam preparation shifts our evening study slot.',
      status: 'pending',
      teacherResponse: null,
      createdAt: '2026-10-12T14:00:00Z'
    }
  ],

  tuition_requests: [
    {
      id: 'tr-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      studentName: 'তানভীর আহমেদ (Alex Rivera)',
      studentPhone: '+880 1819-234567',
      parentPhone: '+880 1819-001122',
      subject: 'উচ্চতর গণিত ও ক্যালকুলাস (Higher Math)',
      grade: 'একাদশ শ্রেণী (Grade 11)',
      location: 'ধানমন্ডি ৮/এ, ঢাকা',
      address: 'রোড #২৭, বাড়ি #১২, ধানমন্ডি',
      salary: 8000,
      daysPerWeek: '৩ দিন / সপ্তাহ (রবি, মঙ্গল, বৃহস্পতি)',
      timeSlot: '০৫:৩০ PM - ০৭:০০ PM',
      tuitionType: 'home',
      requirements: 'বাসায় এসে পড়াতে হবে। এইচএসসি বোর্ড পরীক্ষার উচ্চতর গণিতের প্রথম ও দ্বিতীয় পত্রের প্রব্লেম সলভিং ও রিভিশন প্রয়োজন।',
      status: 'pending',
      teacherResponseNote: null,
      acceptedAt: null,
      rejectedAt: null,
      createdAt: '2026-10-13T10:00:00Z'
    },
    {
      id: 'tr-2',
      studentId: 'student-2',
      teacherId: null,
      studentName: 'নুসরাত জাহান (Emily Zhang)',
      studentPhone: '+880 1911-345678',
      parentPhone: '+880 1911-002233',
      subject: 'পদার্থবিজ্ঞান ও উচ্চতর গণিত',
      grade: 'দ্বাদশ শ্রেণী (Grade 12 / HSC)',
      location: 'উত্তরা সেক্টর ৭, ঢাকা',
      address: 'সেক্টর ৭, রোড ৩, বাড়ি ১৫',
      salary: 10000,
      daysPerWeek: '৩ দিন / সপ্তাহ (শনি, সোম, বুধ)',
      timeSlot: '০৪:০০ PM - ০৫:৩০ PM',
      tuitionType: 'home',
      requirements: 'এইচএসসি পদার্থবিজ্ঞান ১ম ও ২য় পত্রের গাণিতিক সমস্যা এবং ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার প্রস্তুতি। অভিজ্ঞ টিউটর প্রয়োজন।',
      status: 'pending',
      teacherResponseNote: null,
      acceptedAt: null,
      rejectedAt: null,
      createdAt: '2026-10-13T14:30:00Z'
    },
    {
      id: 'tr-3',
      studentId: 'student-3',
      teacherId: 'teacher-1',
      studentName: 'ফারহান কবির (Liam Vance)',
      studentPhone: '+880 1612-456789',
      parentPhone: '+880 1612-003344',
      subject: 'মৌলিক পদার্থবিজ্ঞান ও বীজগণিত',
      grade: 'দশম শ্রেণী (Grade 10 / SSC)',
      location: 'মিরপুর ডিওএইচএস, ঢাকা',
      address: 'রোড ৪, বাড়ি ২২০, মিরপুর ডিওএইচএস',
      salary: 7500,
      daysPerWeek: '২ দিন / সপ্তাহ (শুক্র ও শনি)',
      timeSlot: '১০:০০ AM - ১১:৩০ AM',
      tuitionType: 'home',
      requirements: 'এসএসসি পরীক্ষার নিয়মিত রিভিশন ও অধ্যায়ভিত্তিক মক টেস্ট।',
      status: 'accepted',
      teacherResponseNote: 'রিকোয়েস্ট গ্রহণ করা হলো। আগামী শুক্রবার সকাল ১০টায় প্রথম ক্লাসের ওরিয়েন্টেশন হবে।',
      acceptedAt: '2026-10-12T16:00:00Z',
      rejectedAt: null,
      createdAt: '2026-10-11T12:00:00Z'
    }
  ]
};

// Database class with disk persistence
class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('✅ Loaded existing database from:', DB_FILE);
      } else {
        this.data = JSON.parse(JSON.stringify(initialData));
        console.log('🌱 Seeded new database at:', DB_FILE);
      }

      // Ensure defaults for settings and collections
      if (!this.data.settings) {
        this.data.settings = {
          currencyCode: 'BDT',
          currencySymbol: '৳',
          currencyName: 'Bangladeshi Taka',
          vatPercent: 0
        };
      }
      if (!this.data.time_change_requests) {
        this.data.time_change_requests = JSON.parse(JSON.stringify(initialData.time_change_requests));
      }
      // Ensure users have password
      if (Array.isArray(this.data.users)) {
        this.data.users = this.data.users.map(u => ({
          ...u,
          password: u.password || 'password123'
        }));
      }
      // Ensure invoices have discount metadata
      if (Array.isArray(this.data.invoices)) {
        this.data.invoices = this.data.invoices.map(i => ({
          ...i,
          originalAmount: i.originalAmount !== undefined ? i.originalAmount : i.amount,
          discountAmount: i.discountAmount !== undefined ? i.discountAmount : 0,
          discountPercent: i.discountPercent !== undefined ? i.discountPercent : 0,
          discountReason: i.discountReason || ''
        }));
      }
      if (!this.data.tuition_locations) this.data.tuition_locations = [];
      if (!this.data.exam_schedules) this.data.exam_schedules = [];
      if (!this.data.student_rewards) this.data.student_rewards = [];
      if (!this.data.tuition_requests) {
        this.data.tuition_requests = JSON.parse(JSON.stringify(initialData.tuition_requests));
      }
      this.save();
    } catch (err) {
      console.error('Error initializing database, using in-memory seed:', err);
      this.data = JSON.parse(JSON.stringify(initialData));
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // Generic collection helpers
  getAll(collection) {
    return this.data[collection] || [];
  }

  getById(collection, id) {
    return (this.data[collection] || []).find(item => item.id === id) || null;
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].push(item);
    this.save();
    return item;
  }

  update(collection, id, updates) {
    const list = this.data[collection] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    this.save();
    return list[index];
  }

  delete(collection, id) {
    const list = this.data[collection] || [];
    const initialLen = list.length;
    this.data[collection] = list.filter(item => item.id !== id);
    if (this.data[collection].length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  getSettings() {
    return this.data.settings || {
      currencyCode: 'BDT',
      currencySymbol: '৳',
      currencyName: 'Bangladeshi Taka',
      vatPercent: 0
    };
  }

  updateSettings(updates) {
    this.data.settings = { ...this.getSettings(), ...updates };
    this.save();
    return this.data.settings;
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialData));
    this.save();
    return this.data;
  }
}

export const db = new Database();
