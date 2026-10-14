/**
 * EduTrack Offline Database Engine (Offline-First Persistent Storage)
 * 
 * Provides full offline client-side storage using localStorage.
 * Every read, insert, update, and delete operation persists across reloads and device restarts.
 * Works seamlessly with ZERO server dependency, 0ms latency, and automatic fallbacks.
 */

const STORAGE_KEY = 'edutrack_offline_db_v1';

export const INITIAL_OFFLINE_DATA = {
  users: [
    {
      id: "admin-1",
      name: "সিস্টেম অ্যাডমিনিস্ট্রেটর (System Admin)",
      email: "admin@edutrack.com",
      password: "admin123",
      role: "admin",
      title: "প্রধান একাডেমি পরিচালক ও কন্ট্রোলার (Academy Director)",
      phone: "+880 1700-ADMIN1",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
      bio: "একাডেমিক অপারেশনস, শিক্ষক-শিক্ষার্থী ডাটাবেস, ক্লাস শিডিউল ও পেমেন্ট কন্ট্রোলার।",
      hourlyRate: 0,
      emailVerified: true,
      createdAt: "2026-01-01T00:00:00Z"
    },
    {
      id: "teacher-1",
      name: "ড. রশিদুল করিম (Prof. David Miller)",
      email: "david.miller@edutrack.com",
      password: "password123",
      role: "teacher",
      title: "উচ্চতর গণিত ও পদার্থবিজ্ঞান বিশেষজ্ঞ (Mathematics & Physics Specialist)",
      phone: "+880 1712-345678",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      bio: "ফলিত গণিতে পিএইচডি। ১০+ বছর ধরে শীর্ষ পর্যায়ের শিক্ষার্থীদের গণিত ও পদার্থবিজ্ঞানে এ+ অর্জনে সহায়তা করছেন।",
      hourlyRate: 600,
      emailVerified: true,
      createdAt: "2026-01-10T08:00:00Z"
    },
    {
      id: "student-1",
      name: "তানভীর আহমেদ (Alex Rivera)",
      email: "alex.rivera@student.edu",
      password: "password123",
      role: "student",
      title: "এইচএসসি ১ম বর্ষ / একাদশ শ্রেণী (Grade 11)",
      grade: "একাদশ শ্রেণী (Grade 11)",
      phone: "+880 1819-234567",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250",
      parentName: "মিসেস রাবেয়া আহমেদ (Elena Rivera)",
      parentPhone: "+880 1819-001122",
      parentId: "parent-1",
      bio: "ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি এবং উচ্চতর ক্যালকুলাসে নিবেদিত শিক্ষার্থী।",
      hourlyRate: 0,
      emailVerified: true,
      createdAt: "2026-02-15T09:30:00Z"
    },
    {
      id: "student-2",
      name: "নুসরাত জাহান (Emily Zhang)",
      email: "emily.zhang@student.edu",
      password: "password123",
      role: "student",
      title: "এইচএসসি ২য় বর্ষ / দ্বাদশ শ্রেণী (Grade 12)",
      grade: "দ্বাদশ শ্রেণী (Grade 12)",
      phone: "+880 1912-345678",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
      parentName: "মো. জহিরুল ইসলাম (Hao Zhang)",
      parentPhone: "+880 1912-002233",
      parentId: "parent-1",
      bio: "পদার্থবিজ্ঞান, রসায়ন ও অ্যাডভান্সড ক্যালকুলাসে অধ্যয়নরত।",
      hourlyRate: 0,
      emailVerified: true,
      createdAt: "2026-02-20T11:00:00Z"
    },
    {
      id: "student-3",
      name: "ফারহান কবির (Liam Vance)",
      email: "liam.vance@student.edu",
      password: "password123",
      role: "student",
      title: "এসএসসি পরীক্ষার্থী / দশম শ্রেণী (Grade 10)",
      grade: "দশম শ্রেণী (Grade 10)",
      phone: "+880 1611-223344",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
      parentName: "কবির হোসেন (Marcus Vance)",
      parentPhone: "+880 1611-003344",
      bio: "উচ্চতর গণিত ও পদার্থবিজ্ঞানের মৌলিক বিষয়ে প্রস্তুতি নিচ্ছেন।",
      hourlyRate: 0,
      emailVerified: true,
      createdAt: "2026-03-01T14:15:00Z"
    },
    {
      id: "student-due",
      name: "রাকিবুল ইসলাম (Rakibul Islam - বকেয়া ডেমো)",
      email: "rakibul.dues@student.edu",
      password: "password123",
      role: "student",
      title: "এইচএসসি বিজ্ঞান (HSC Science - ৳15,200 বকেয়া ডেমো)",
      grade: "দ্বাদশ শ্রেণী (Grade 12)",
      phone: "+880 1711-998877",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250",
      parentName: "মো. রফিকুল ইসলাম (Rafiqul Islam - Parent)",
      parentPhone: "+880 1811-998877",
      parentId: "parent-1",
      bio: "বকেয়া টিউশন ফি ও পেমেন্ট গেটওয়ে টেস্ট করার বিশেষ ডেমো অ্যাকাউন্ট।",
      hourlyRate: 0,
      emailVerified: true,
      createdAt: "2026-06-01T00:00:00Z"
    },
    {
      id: "parent-1",
      name: "মিসেস রাবেয়া আহমেদ / রফিক আহমেদ (Parent)",
      email: "parent@edutrack.com",
      password: "password123",
      role: "parent",
      title: "অভিভাবক (Parent / Guardian)",
      phone: "+880 1819-001122",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250",
      studentIds: ["student-1", "student-due"],
      bio: "তানভীর আহমেদ ও রাকিবুল ইসলামের অভিভাবক। ক্লাসের উপস্থিতি, অগ্রগতি এবং টিউশন ফি ট্র্যাক করছেন।",
      emailVerified: true,
      createdAt: "2026-02-15T09:30:00Z"
    }
  ],

  classes: [
    {
      id: "cls-1",
      teacherId: "teacher-1",
      title: "উচ্চতর গণিত ও ক্যালকুলাস (Higher Math & Calculus)",
      subject: "উচ্চতর গণিত (Higher Math)",
      gradeLevel: "একাদশ - দ্বাদশ শ্রেণী (Grade 11-12)",
      type: "batch",
      scheduleDays: ["Tuesday", "Thursday"],
      timeSlot: "07:00 PM - 08:30 PM",
      monthlyFee: 3500,
      perClassRate: 450,
      hourlyRate: 600,
      meetingLink: "https://meet.google.com/edu-math-live",
      room: "অনলাইন লাইভ স্টুডিও (Studio 1)",
      description: "ডিফারেন্সিয়াল ও ইন্টিগ্রাল ক্যালকুলাস, লিমিট এবং বোর্ড ও ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার প্রস্তুতি।",
      color: "indigo",
      status: "active",
      mode: "online",
      modeBn: "অনলাইন লাইভ ক্লাস (Zoom/Meet)"
    },
    {
      id: "cls-2",
      teacherId: "teacher-1",
      title: "পদার্থবিজ্ঞান ১ম ও ২য় পত্র (Physics Mechanics)",
      subject: "পদার্থবিজ্ঞান (Physics)",
      gradeLevel: "একাদশ - দ্বাদশ শ্রেণী (Grade 11-12)",
      type: "individual",
      scheduleDays: ["Monday", "Wednesday"],
      timeSlot: "05:00 PM - 06:30 PM",
      monthlyFee: 4000,
      perClassRate: 500,
      hourlyRate: 650,
      meetingLink: "",
      room: "ধানমন্ডি শাখা (Room 204)",
      description: "গতিবিদ্যা, কাজ-শক্তি-ক্ষমতা, মহাকর্ষ তত্ত্ব এবং গাণিতিক সমস্যার নিবিড় প্রস্তুতি।",
      color: "emerald",
      status: "active",
      mode: "offline",
      modeBn: "অফলাইন হোম / কোচিং ব্যাচ"
    },
    {
      id: "cls-3",
      teacherId: "teacher-1",
      title: "ভর্তি পরীক্ষা ও এসএটি গণিত (Admission Math Prep)",
      subject: "ভর্তি প্রস্তুতি (Test Prep)",
      gradeLevel: "এসএসসি - এইচএসসি (Grade 10 - 12)",
      scheduleDays: ["Saturday"],
      timeSlot: "10:00 AM - 12:30 PM",
      monthlyFee: 2500,
      perClassRate: 400,
      hourlyRate: 500,
      meetingLink: "https://meet.google.com/edu-sat-math",
      room: "অনলাইন স্পেশাল গ্রুপ ব্যাচ",
      description: "শর্টকাট কৌশল, ত্রিকোণমিতি ড্রিল এবং স্পিড ম্যানেজমেন্ট মক টেস্ট।",
      color: "amber",
      status: "active",
      mode: "online",
      modeBn: "অনলাইন লাইভ ক্লাস (Meet)"
    }
  ],

  enrollments: [
    { id: "enr-1", classId: "cls-1", studentId: "student-1", enrolledAt: "2026-09-01", status: "active" },
    { id: "enr-2", classId: "cls-3", studentId: "student-1", enrolledAt: "2026-09-05", status: "active" },
    { id: "enr-3", classId: "cls-1", studentId: "student-2", enrolledAt: "2026-09-01", status: "active" },
    { id: "enr-4", classId: "cls-2", studentId: "student-2", enrolledAt: "2026-09-02", status: "active" },
    { id: "enr-5", classId: "cls-2", studentId: "student-3", enrolledAt: "2026-09-10", status: "active" },
    { id: "enr-due-1", classId: "cls-1", studentId: "student-due", enrolledAt: "2026-07-01", status: "active" },
    { id: "enr-due-2", classId: "cls-2", studentId: "student-due", enrolledAt: "2026-07-01", status: "active" }
  ],

  attendance: [
    { id: "att-1", classId: "cls-1", studentId: "student-1", date: "2026-10-12", status: "present", notes: "সক্রিয় অংশগ্রহণ" },
    { id: "att-2", classId: "cls-1", studentId: "student-2", date: "2026-10-12", status: "present", notes: "সময়মতো উপস্থিত" },
    { id: "att-3", classId: "cls-1", studentId: "student-1", date: "2026-10-09", status: "present", notes: "ইন-ক্লাস কুইজে পূর্ণ নম্বর" },
    { id: "att-4", classId: "cls-1", studentId: "student-2", date: "2026-10-09", status: "late", notes: "১০ মিনিট দেরিতে যুক্ত" },
    { id: "att-5", classId: "cls-1", studentId: "student-1", date: "2026-10-06", status: "present", notes: "" },
    { id: "att-6", classId: "cls-1", studentId: "student-2", date: "2026-10-06", status: "absent", notes: "অসুস্থতাজনিত ছুটি" },
    { id: "att-7", classId: "cls-2", studentId: "student-2", date: "2026-10-08", status: "present", notes: "ল্যাব রিপোর্ট জমা সম্পন্ন" },
    { id: "att-8", classId: "cls-2", studentId: "student-3", date: "2026-10-08", status: "present", notes: "" },
    { id: "att-9", classId: "cls-3", studentId: "student-1", date: "2026-10-10", status: "present", notes: "মক টেস্ট সম্পন্ন" }
  ],

  invoices: [
    {
      id: "inv-1",
      invoiceNumber: "INV-2026-001",
      studentId: "student-1",
      teacherId: "teacher-1",
      classId: "cls-1",
      title: "উচ্চতর গণিত ও ক্যালকুলাস - অক্টোবর ২০২৬ টিউশন ফি",
      amount: 3500,
      originalAmount: 3500,
      discountAmount: 0,
      discountPercent: 0,
      discountReason: "",
      dueDate: "2026-10-25",
      status: "pending",
      billingMonth: "অক্টোবর ২০২৬",
      paymentMethod: null,
      transactionId: null,
      paidAt: null,
      createdAt: "2026-10-01T08:00:00Z"
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-2026-002",
      studentId: "student-1",
      teacherId: "teacher-1",
      classId: "cls-3",
      title: "ভর্তি পরীক্ষা ও এসএটি গণিত - সেপ্টেম্বর ২০২৬",
      amount: 2250,
      originalAmount: 2500,
      discountAmount: 250,
      discountPercent: 10,
      discountReason: "মেধাবী শিক্ষার্থী ডিসকাউন্ট (10% Waiver)",
      dueDate: "2026-09-25",
      status: "paid",
      billingMonth: "সেপ্টেম্বর ২০২৬",
      paymentMethod: "bkash",
      transactionId: "BKASH-TRX-882910",
      paidAt: "2026-09-22T14:10:00Z",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: "inv-3",
      invoiceNumber: "INV-2026-003",
      studentId: "student-2",
      teacherId: "teacher-1",
      classId: "cls-1",
      title: "উচ্চতর গণিত ও ক্যালকুলাস - অক্টোবর ২০২৬ টিউশন ফি",
      amount: 3500,
      originalAmount: 3500,
      discountAmount: 0,
      discountPercent: 0,
      discountReason: "",
      dueDate: "2026-10-20",
      status: "paid",
      billingMonth: "অক্টোবর ২০২৬",
      paymentMethod: "card",
      transactionId: "STRIPE-CARD-90182",
      paidAt: "2026-10-04T10:30:00Z",
      createdAt: "2026-10-01T08:00:00Z"
    },
    {
      id: "inv-4",
      invoiceNumber: "INV-2026-004",
      studentId: "student-3",
      teacherId: "teacher-1",
      classId: "cls-2",
      title: "পদার্থবিজ্ঞান ১ম ও ২য় পত্র - অক্টোবর ২০২৬",
      amount: 4000,
      originalAmount: 4000,
      discountAmount: 0,
      discountPercent: 0,
      discountReason: "",
      dueDate: "2026-10-18",
      status: "paid",
      billingMonth: "অক্টোবর ২০২৬",
      paymentMethod: "nagad",
      transactionId: "NAGAD-TXN-49021",
      paidAt: "2026-10-06T18:45:00Z",
      createdAt: "2026-10-01T08:00:00Z"
    },
    {
      id: "inv-due-1",
      invoiceNumber: "INV-2026-DUE-01",
      studentId: "student-due",
      teacherId: "teacher-1",
      classId: "cls-1",
      title: "উচ্চতর গণিত ও ক্যালকুলাস - জুলাই ২০২৬ টিউশন ফি",
      amount: 3000,
      originalAmount: 3000,
      discountAmount: 0,
      discountPercent: 0,
      dueDate: "2026-07-25",
      status: "overdue",
      billingMonth: "জুলাই ২০২৬",
      createdAt: "2026-07-01T08:00:00Z"
    },
    {
      id: "inv-due-2",
      invoiceNumber: "INV-2026-DUE-02",
      studentId: "student-due",
      teacherId: "teacher-1",
      classId: "cls-2",
      title: "পদার্থবিজ্ঞান ১ম ও ২য় পত্র - আগস্ট ২০২৬ টিউশন ফি",
      amount: 2500,
      originalAmount: 2500,
      discountAmount: 0,
      discountPercent: 0,
      dueDate: "2026-08-25",
      status: "overdue",
      billingMonth: "আগস্ট ২০২৬",
      createdAt: "2026-08-01T08:00:00Z"
    },
    {
      id: "inv-due-3",
      invoiceNumber: "INV-2026-DUE-03",
      studentId: "student-due",
      teacherId: "teacher-1",
      classId: "cls-1",
      title: "উচ্চতর গণিত ও ক্যালকুলাস - সেপ্টেম্বর ২০২৬ টিউশন ফি",
      amount: 3000,
      originalAmount: 3000,
      discountAmount: 0,
      discountPercent: 0,
      dueDate: "2026-09-25",
      status: "overdue",
      billingMonth: "সেপ্টেম্বর ২০২৬",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: "inv-due-4",
      invoiceNumber: "INV-2026-DUE-04",
      studentId: "student-due",
      teacherId: "teacher-1",
      classId: "cls-2",
      title: "পদার্থবিজ্ঞান ১ম ও ২য় পত্র - অক্টোবর ২০২৬ টিউশন ফি",
      amount: 2500,
      originalAmount: 2500,
      discountAmount: 0,
      discountPercent: 0,
      dueDate: "2026-10-10",
      status: "overdue",
      billingMonth: "অক্টোবর ২০২৬",
      createdAt: "2026-10-01T08:00:00Z"
    },
    {
      id: "inv-due-5",
      invoiceNumber: "INV-2026-DUE-05",
      studentId: "student-due",
      teacherId: "teacher-1",
      classId: "cls-1",
      title: "উচ্চতর গণিত ও ক্যালকুলাস - নভেম্বর ২০২৬ টিউশন ফি (চলতি)",
      amount: 3000,
      originalAmount: 3000,
      discountAmount: 0,
      discountPercent: 0,
      dueDate: "2026-11-20",
      status: "pending",
      billingMonth: "নভেম্বর ২০২৬",
      createdAt: "2026-10-10T08:00:00Z"
    },
    {
      id: "inv-due-6",
      invoiceNumber: "INV-2026-DUE-06",
      studentId: "student-due",
      teacherId: "teacher-1",
      classId: "cls-2",
      title: "বোর্ড স্পেশাল মডেল টেস্ট ও প্র্যাক্টিক্যাল ল্যাব ফি",
      amount: 1200,
      originalAmount: 1200,
      discountAmount: 0,
      discountPercent: 0,
      dueDate: "2026-09-15",
      status: "overdue",
      billingMonth: "সেপ্টেম্বর ২০২৬",
      createdAt: "2026-09-01T08:00:00Z"
    }
  ],

  messages: [
    {
      id: "msg-1",
      senderId: "teacher-1",
      receiverId: "student-1",
      text: "তানভীর, আগামী ক্লাসে ইনটিগ্রেশনের বাই-পার্টস পদ্ধতির রিভিশন শিট নিয়ে আলোচনা করব। প্রস্তুত থেকো।",
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: "2026-10-12T16:00:00Z"
    },
    {
      id: "msg-2",
      senderId: "student-1",
      receiverId: "teacher-1",
      text: "ধন্যবাদ স্যার! আমি অনুশীলনীর ১ থেকে ১০ পর্যন্ত সমাধান করেছি। ৮ নম্বর গাণিতিক সমস্যাটি একটু কঠিন লেগেছে।",
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: "2026-10-12T17:15:00Z"
    },
    {
      id: "msg-3",
      senderId: "teacher-1",
      receiverId: "student-1",
      text: "নিশ্চয়ই! ৮ নম্বর সমস্যাটি সাবস্টিটিউশন মেথডে খুব সহজে সমাধান করা যায়। ক্লাসের শুরুতে এটি দিয়ে শুরু করব।",
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: "2026-10-12T17:40:00Z"
    },
    {
      id: "msg-4",
      senderId: "student-2",
      receiverId: "teacher-1",
      text: "স্যার, পদার্থবিজ্ঞান রোটেশনাল ডায়নামিক্সের সূত্রগুলোর ড্রাফট হ্যান্ডনোট তৈরি করেছি।",
      attachmentName: "rotational-dynamics-formulae.pdf",
      attachmentUrl: "#formula-sheet",
      isRead: true,
      createdAt: "2026-10-13T11:00:00Z"
    },
    {
      id: "msg-5",
      senderId: "teacher-1",
      receiverId: "student-2",
      text: "খুব চমৎকার হয়েছে নুসরাত! প্যারালাল এক্সিস থিওরেমের সমীকরণটি পুনরায় মিলিয়ে নিও।",
      attachmentName: null,
      attachmentUrl: null,
      isRead: true,
      createdAt: "2026-10-13T13:20:00Z"
    }
  ],

  assignments: [
    {
      id: "asg-1",
      classId: "cls-1",
      teacherId: "teacher-1",
      title: "টেলর ও ম্যাকলরিন সিরিজ অনুশীলন সেট (Taylor & Maclaurin Series)",
      description: "sin(x) এবং e^(2x) এর জন্য সিরিজ বিস্তার নির্ণয় কর এবং সমস্যা ১ থেকে ১২ সমাধান কর।",
      dueDate: "2026-10-25T23:59:00Z",
      maxScore: 100,
      resourceLink: "https://ocw.mit.edu/calculus-taylor-series",
      createdAt: "2026-10-10T10:00:00Z"
    },
    {
      id: "asg-2",
      classId: "cls-1",
      teacherId: "teacher-1",
      title: "নির্দিষ্ট যৌগজ ও বক্ররেখার মধ্যবর্তী ক্ষেত্রফল",
      description: "পাঠ্যবইয়ের অধ্যায় ৬.২ এর প্রশ্নাবলি সমাধান কর। লেখচিত্র স্কেচ করে সীমা চিহ্নিত কর।",
      dueDate: "2026-10-22T23:59:00Z",
      maxScore: 50,
      resourceLink: null,
      createdAt: "2026-10-05T09:00:00Z"
    },
    {
      id: "asg-3",
      classId: "cls-2",
      teacherId: "teacher-1",
      title: "ল্যাব রিপোর্ট: কৌণিক ভরবেগের সংরক্ষণ সূত্র",
      description: "ঘূর্ণন গতি এবং গাইরোস্কোপ প্রিসেশনের উপর ২ পৃষ্ঠার সংক্ষিপ্ত ল্যাব রিপোর্ট তৈরি কর।",
      dueDate: "2026-10-28T23:59:00Z",
      maxScore: 100,
      resourceLink: null,
      createdAt: "2026-10-09T14:00:00Z"
    }
  ],

  submissions: [
    {
      id: "sub-1",
      assignmentId: "asg-2",
      studentId: "student-1",
      submittedAt: "2026-10-13T10:30:00Z",
      submissionText: "আমি সব ৮টি প্রশ্ন সমাধান করেছি। ৭ নম্বর প্রশ্নে ক্রস-সেকশনাল স্লাইসিং পদ্ধতি ব্যবহার করেছি।",
      fileUrl: "alex-rivera-area-curves-solution.pdf",
      status: "graded",
      score: 48,
      feedback: "চমৎকার কাজ তানভীর! পরিষ্কার গ্রাফ ও নির্ভুল ইন্টিগ্রেশন ধাপ।"
    },
    {
      id: "sub-2",
      assignmentId: "asg-2",
      studentId: "student-2",
      submittedAt: "2026-10-13T12:00:00Z",
      submissionText: "সমাধান ফাইল সংযুক্ত করা হলো। সমস্যা ৪ এর জন্য বিকল্প সমাধানও যুক্ত করেছি।",
      fileUrl: "emily-zhang-calculus-ch6.pdf",
      status: "submitted",
      score: null,
      feedback: null
    }
  ],

  exam_marks: [
    {
      id: "exm-1",
      classId: "cls-1",
      studentId: "student-1",
      examTitle: "ক্যালকুলাস ইউনিট ২: ডিফারেনসিয়েশন ও গড় মান উপপাদ্য",
      maxMarks: 100,
      obtainedMarks: 94,
      examDate: "2026-09-28",
      remarks: "গ্রেড A+ • অসামান্য সমাধান গতি ও নির্ভুলতা"
    },
    {
      id: "exm-2",
      classId: "cls-1",
      studentId: "student-2",
      examTitle: "ক্যালকুলাস ইউনিট ২: ডিফারেনসিয়েশন ও গড় মান উপপাদ্য",
      maxMarks: 100,
      obtainedMarks: 97,
      examDate: "2026-09-28",
      remarks: "গ্রেড A+ • ব্যাচের সর্বোচ্চ নম্বর"
    },
    {
      id: "exm-3",
      classId: "cls-3",
      studentId: "student-1",
      examTitle: "ভর্তি পরীক্ষা গণিত পূর্ণাঙ্গ ডায়াগনস্টিক টেস্ট #১",
      maxMarks: 800,
      obtainedMarks: 760,
      examDate: "2026-10-02",
      remarks: "টপ ৯৮তম পার্সেন্টাইল • গত মাসের চেয়ে ৭০ নম্বর উন্নতি"
    },
    {
      id: "exm-4",
      classId: "cls-2",
      studentId: "student-2",
      examTitle: "পদার্থবিজ্ঞান মিডটার্ম: গতিবিদ্যা ও কাজ-শক্তি",
      maxMarks: 100,
      obtainedMarks: 91,
      examDate: "2026-09-30",
      remarks: "গ্রেড A • ঘর্ষণ বল ও শক্তির সংরক্ষণ ধারণায় স্পষ্টতা"
    }
  ],

  announcements: [
    {
      id: "anc-1",
      classId: "cls-1",
      teacherId: "teacher-1",
      title: "উচ্চতর গণিত উইকেন্ড স্পেশাল মক টেস্ট",
      content: "আগামী শনিবার বিকাল ৪:০০ টায় ৯০ মিনিটের একটি মডেল টেস্ট অনুষ্ঠিত হবে। ক্যালকুলেটর ও গ্রাফ পেপার প্রস্তুত রেখো।",
      createdAt: "2026-10-12T08:30:00Z"
    },
    {
      id: "anc-2",
      classId: "cls-2",
      teacherId: "teacher-1",
      title: "পদার্থবিজ্ঞান সিমুলেশন লিংক আপডেট",
      content: "সরল ছন্দিত স্পন্দনের জন্য PhET ইন্টারেক্টিভ সিমুলেশনের লিংক ক্লাস রিসোর্সে আপলোড করা হয়েছে।",
      createdAt: "2026-10-08T15:00:00Z"
    }
  ],

  study_notes: [
    {
      id: "note-1",
      classId: "cls-1",
      title: "ক্যালকুলাস ও যৌগজীকরণ শর্টকাট সূত্র সংকলন",
      subject: "উচ্চতর গণিত",
      description: "ত্রিকোণমিতিক ও এক্সপোনেনশিয়াল ইন্টিগ্রেশনের ২০টি গুরুত্বপূর্ণ ফর্মুলা ও শর্টকাট।",
      fileUrl: "https://example.com/notes/calculus-summary.pdf",
      fileName: "Calculus_Summary_Formulae.pdf",
      fileSize: "1.8 MB",
      createdAt: "2026-10-04T10:00:00Z"
    },
    {
      id: "note-2",
      classId: "cls-2",
      title: "পদার্থবিজ্ঞান মহাকর্ষ ও তড়িৎ বল হ্যান্ডনোট",
      subject: "পদার্থবিজ্ঞান",
      description: "কেপলারের সূত্র, মহাকর্ষীয় বিভব এবং কুলম্বের সূত্রের তুলনামূলক বিশ্লেষণ।",
      fileUrl: "https://example.com/notes/physics-gravitation.pdf",
      fileName: "Physics_Gravitation_Notes.pdf",
      fileSize: "2.4 MB",
      createdAt: "2026-10-06T14:30:00Z"
    }
  ],

  time_change_requests: [
    {
      id: "tcr-1",
      studentId: "student-1",
      classId: "cls-1",
      currentSlot: "07:00 PM - 08:30 PM",
      proposedSlot: "06:30 PM - 08:00 PM",
      proposedDays: ["Tuesday", "Thursday"],
      reason: "কলেজের প্র্যাকটিক্যাল ক্লাসের সময় পরিবর্তনের কারণে আধা ঘণ্টা এগিয়ে আনার অনুরোধ।",
      status: "pending",
      teacherResponse: null,
      createdAt: "2026-10-12T14:00:00Z"
    }
  ],

  tuition_requests: [
    {
      id: "tr-1",
      studentId: "student-1",
      teacherId: "teacher-1",
      studentName: "তানভীর আহমেদ (Alex Rivera)",
      studentPhone: "+880 1819-234567",
      parentPhone: "+880 1819-001122",
      subject: "উচ্চতর গণিত ও ক্যালকুলাস (Higher Math)",
      grade: "একাদশ শ্রেণী (Grade 11)",
      location: "ধানমন্ডি ৮/এ, ঢাকা",
      address: "রোড #২৭, বাড়ি #১২, ধানমন্ডি",
      salary: 8000,
      daysPerWeek: "৩ দিন / সপ্তাহ (রবি, মঙ্গল, বৃহস্পতি)",
      timeSlot: "০৫:৩০ PM - ০৭:০০ PM",
      tuitionType: "home",
      requirements: "বাসায় এসে পড়াতে হবে। এইচএসসি বোর্ড পরীক্ষার প্রব্লেম সলভিং ও রিভিশন প্রয়োজন।",
      status: "pending",
      teacherResponseNote: null,
      acceptedAt: null,
      createdAt: "2026-10-13T10:00:00Z"
    },
    {
      id: "tr-2",
      studentId: "student-2",
      teacherId: null,
      studentName: "নুসরাত জাহান (Emily Zhang)",
      studentPhone: "+880 1911-345678",
      parentPhone: "+880 1911-002233",
      subject: "পদার্থবিজ্ঞান ও উচ্চতর গণিত",
      grade: "দ্বাদশ শ্রেণী (Grade 12 / HSC)",
      location: "উত্তরা সেক্টর ৭, ঢাকা",
      address: "সেক্টর ৭, রোড ৩, বাড়ি ১৫",
      salary: 10000,
      daysPerWeek: "৩ দিন / সপ্তাহ (শনি, সোম, বুধ)",
      timeSlot: "০৪:০০ PM - ০৫:৩০ PM",
      tuitionType: "home",
      requirements: "ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার প্রস্তুতি। অভিজ্ঞ টিউটর প্রয়োজন।",
      status: "pending",
      teacherResponseNote: null,
      acceptedAt: null,
      createdAt: "2026-10-13T14:30:00Z"
    }
  ],

  tuition_locations: [
    {
      id: "loc-1",
      studentId: "student-1",
      teacherId: "teacher-1",
      status: "checked-in",
      locationName: "ধানমন্ডি ৮/এ, ঢাকা (শিক্ষার্থীর বাসা)",
      coordinates: { lat: 23.7465, lng: 90.3760 },
      checkInTime: "2026-10-14T08:30:00Z",
      checkOutTime: null,
      notes: "ক্লাস শুরু হয়েছে। ডিফারেন্সিয়াল ক্যালকুলাস চ্যাপ্টার ৯।"
    }
  ],

  exam_schedules: [
    {
      id: "exs-1",
      classId: "cls-1",
      title: "এইচএসসি ১ম সাময়িক মডেল টেস্ট: উচ্চতর গণিত",
      subject: "উচ্চতর গণিত ১ম পত্র",
      examDate: "2026-10-24",
      timeSlot: "১০:০০ AM - ০১:০০ PM",
      room: "রুম ৩০১ (মেইন অডিটরিয়াম)",
      syllabus: "ম্যাট্রিক্স ও নির্ণায়ক, সরলরেখা, অন্তরীকরণ",
      totalMarks: 100
    },
    {
      id: "exs-2",
      classId: "cls-2",
      title: "পদার্থবিজ্ঞান অধ্যায়ভিত্তিক মূল্যায়ন পরীক্ষা",
      subject: "পদার্থবিজ্ঞান ১ম পত্র",
      examDate: "2026-10-29",
      timeSlot: "০৩:০০ PM - ০৫:০০ PM",
      room: "ল্যাব ২",
      syllabus: "গতিবিদ্যা ও নিউটনিয়ান বলবিদ্যা",
      totalMarks: 50
    }
  ],

  student_rewards: [
    {
      studentId: "student-1",
      xp: 680,
      level: 4,
      streakDays: 14,
      badges: ["ম্যাথ উইজার্ড", "সময়নিষ্ঠ শিক্ষার্থী", "১০০% উপস্থিতি"],
      vouchers: [
        { id: "vch-1", code: "EARLYBIRD10", title: "১০% টিউশন ফি ছাড়", discount: 10, claimed: false }
      ]
    }
  ],

  notifications: [
    {
      id: "notif-1",
      userId: "student-1",
      type: "class_reminder",
      title: "উচ্চতর গণিত ক্লাস রিমাইন্ডার",
      message: "আজ বিকাল ০৭:০০ টায় আপনার লাইভ ক্লাস শুরু হবে।",
      isRead: false,
      createdAt: "2026-10-14T06:00:00Z"
    },
    {
      id: "notif-2",
      userId: "teacher-1",
      type: "time_change",
      title: "নতুন সময় পরিবর্তনের অনুরোধ",
      message: "তানভীর আহমেদ উচ্চতর গণিত ক্লাসের সময় ০৬:৩০ PM করার অনুরোধ করেছেন।",
      isRead: false,
      createdAt: "2026-10-12T14:00:00Z"
    }
  ],

  sms_logs: [
    {
      id: "sms-1",
      phone: "+880 1819-001122",
      studentName: "তানভীর আহমেদ",
      recipientType: "Parent",
      message: "EduTrack: তানভীর আহমেদ আজকের উচ্চতর গণিত ক্লাসে যথাসময়ে উপস্থিত ছিলেন।",
      status: "delivered",
      timestamp: "2026-10-12T19:05:00Z"
    }
  ],

  tutors: [
    {
      id: "tutor-1",
      name: "ড. রশিদুল করিম (Prof. David Miller)",
      title: "উচ্চতর গণিত ও পদার্থবিজ্ঞান বিশেষজ্ঞ",
      qualification: "M.Sc in Applied Mathematics (DU)",
      experience: "১০+ বছর",
      rating: 4.9,
      reviewsCount: 38,
      hourlyRate: 600,
      preferredAreas: ["ধানমন্ডি", "মোহাম্মদপুর", "লালমাটিয়া"],
      subjects: ["উচ্চতর গণিত", "পদার্থবিজ্ঞান"],
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
    },
    {
      id: "tutor-2",
      name: "তানিয়া সুলতানা (Tania Sultana)",
      title: "রসায়ন ও জীববিজ্ঞান প্রশিক্ষক",
      qualification: "B.Sc in Biochemistry (RU)",
      experience: "৫+ বছর",
      rating: 4.8,
      reviewsCount: 24,
      hourlyRate: 500,
      preferredAreas: ["মিরপুর", "উত্তরা", "বনানী"],
      subjects: ["রসায়ন", "জীববিজ্ঞান"],
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250"
    }
  ],

  settings: {
    currencyCode: "BDT",
    currencySymbol: "৳",
    currencyName: "Bangladeshi Taka",
    vatPercent: 0
  }
};

class OfflineDatabase {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (typeof window === 'undefined') {
      this.data = JSON.parse(JSON.stringify(INITIAL_OFFLINE_DATA));
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_OFFLINE_DATA));
        this.save();
      }

      // Ensure all collections exist
      Object.keys(INITIAL_OFFLINE_DATA).forEach(key => {
        if (!this.data[key]) {
          this.data[key] = JSON.parse(JSON.stringify(INITIAL_OFFLINE_DATA[key]));
        }
      });
    } catch (err) {
      console.warn('Failed to parse offline database, reinitializing from initial seed:', err);
      this.data = JSON.parse(JSON.stringify(INITIAL_OFFLINE_DATA));
      this.save();
    }
  }

  save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Failed to save offline database to localStorage:', err);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_OFFLINE_DATA));
    this.save();
    return this.data;
  }

  // Generic collection operations
  getAll(collection) {
    return this.data[collection] || [];
  }

  getById(collection, id) {
    const list = this.data[collection] || [];
    return list.find(item => item.id === id) || null;
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const withId = {
      ...item,
      id: item.id || `${collection.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: item.createdAt || new Date().toISOString()
    };
    this.data[collection].unshift(withId);
    this.save();
    return withId;
  }

  update(collection, id, updates) {
    const list = this.data[collection] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return list[index];
  }

  delete(collection, id) {
    const list = this.data[collection] || [];
    const beforeLen = list.length;
    this.data[collection] = list.filter(item => item.id !== id);
    if (this.data[collection].length !== beforeLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Specialized Aggregates & Business Logic

  getStats() {
    const students = (this.data.users || []).filter(u => u.role === 'student');
    const classes = this.data.classes || [];
    const invoices = this.data.invoices || [];
    const attendance = this.data.attendance || [];

    const totalEarnings = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const pendingDues = invoices
      .filter(i => i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = attendance.length > 0 
      ? Math.round((presentCount / attendance.length) * 100) 
      : 94;

    return {
      totalStudents: students.length,
      activeBatches: classes.filter(c => c.status !== 'inactive').length,
      monthlyRevenue: totalEarnings,
      totalEarnings,
      pendingDues,
      totalDue: pendingDues,
      attendanceRate,
      pendingRequests: (this.data.time_change_requests || []).filter(r => r.status === 'pending').length
    };
  }

  // Classes with enriched studentCount
  getEnrichedClasses(teacherId) {
    let list = this.getAll('classes');
    if (teacherId) {
      list = list.filter(c => c.teacherId === teacherId);
    }
    const enrollments = this.getAll('enrollments');
    return list.map(cls => {
      const activeEnrollments = enrollments.filter(e => e.classId === cls.id && e.status === 'active');
      return {
        ...cls,
        studentCount: activeEnrollments.length
      };
    });
  }

  // Attendance batch save
  saveAttendanceRecords(records) {
    const list = Array.isArray(records) ? records : [records];
    if (!this.data.attendance) this.data.attendance = [];

    list.forEach(rec => {
      const existingIdx = this.data.attendance.findIndex(a => 
        a.classId === rec.classId && 
        a.studentId === rec.studentId && 
        a.date === rec.date
      );
      if (existingIdx >= 0) {
        this.data.attendance[existingIdx] = { ...this.data.attendance[existingIdx], ...rec };
      } else {
        this.data.attendance.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...rec,
          createdAt: new Date().toISOString()
        });
      }
    });

    this.save();
    return { success: true, count: list.length, records: this.data.attendance };
  }

  // Process payment
  processInvoicePayment(payload) {
    const { invoiceId, paymentMethod = 'cash', transactionId } = payload;
    const invoice = this.getById('invoices', invoiceId);
    if (!invoice) return { error: 'Invoice not found' };

    const updated = this.update('invoices', invoiceId, {
      status: 'paid',
      paymentMethod,
      transactionId: transactionId || `TXN-OFFLINE-${Date.now()}`,
      paidAt: new Date().toISOString()
    });

    // Add notification
    this.insert('notifications', {
      userId: invoice.studentId,
      type: 'payment_received',
      title: 'পেমেন্ট সফল হয়েছে (Payment Success)',
      message: `${invoice.title} এর জন্য ৳${invoice.amount} পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।`,
      isRead: false
    });

    return { success: true, invoice: updated };
  }

  // Backup & Restore
  exportDatabaseJson() {
    return JSON.stringify(this.data, null, 2);
  }

  importDatabaseJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || !parsed.users) {
        throw new Error('Invalid EduTrack database format');
      }
      this.data = parsed;
      this.save();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const offlineDb = new OfflineDatabase();
