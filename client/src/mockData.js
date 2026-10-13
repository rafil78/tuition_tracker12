export const MOCK_STATS = {
  totalStudents: 12,
  activeBatches: 5,
  monthlyRevenue: 45000,
  attendanceRate: 94,
  totalDue: 18500,
  pendingRequests: 2
};

export const MOCK_CLASSES = [
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
    room: "অনলাইন লাইভ রুম (Studio 1)",
    description: "ডিফারেন্সিয়াল ও ইন্টিগ্রাল ক্যালকুলাস, লিমিট এবং বোর্ড ও ভর্তি পরীক্ষার প্রস্তুতি।",
    color: "indigo",
    status: "active",
    mode: "online",
    modeBn: "অনলাইন লাইভ ক্লাস (Zoom)"
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
    room: "ধানমন্ডি শাখা (Room 204)",
    description: "গতিবিদ্যা, কাজ-শক্তি-ক্ষমতা এবং মহাকর্ষ তত্ত্ব।",
    color: "emerald",
    status: "active",
    mode: "offline",
    modeBn: "অফলাইন হোম টিউটরিং"
  }
];

export const MOCK_INVOICES = [
  {
    id: "inv-demo-1",
    studentId: "student-1",
    classId: "cls-1",
    amount: 3500,
    dueDate: "2026-10-25",
    status: "pending",
    billingMonth: "অক্টোবর ২০২৬",
    createdAt: "2026-10-01"
  },
  {
    id: "inv-demo-2",
    studentId: "student-due",
    classId: "cls-1",
    amount: 3800,
    dueDate: "2026-09-20",
    status: "pending",
    billingMonth: "সেপ্টেম্বর ২০২৬",
    createdAt: "2026-09-01"
  },
  {
    id: "inv-demo-3",
    studentId: "student-due",
    classId: "cls-1",
    amount: 3800,
    dueDate: "2026-08-20",
    status: "pending",
    billingMonth: "আগস্ট ২০২৬",
    createdAt: "2026-08-01"
  }
];

export const MOCK_ENROLLMENTS = [
  { id: "enr-1", studentId: "student-1", classId: "cls-1", status: "active" },
  { id: "enr-2", studentId: "student-due", classId: "cls-1", status: "active" }
];

export const MOCK_TUITION_REQUESTS = [
  {
    id: "req-demo-1",
    studentId: "student-1",
    teacherId: "teacher-1",
    subject: "পদার্থবিজ্ঞান (Physics)",
    classGrade: "দ্বাদশ শ্রেণী (Grade 12)",
    area: "ধানমন্ডি, ঢাকা",
    proposedFee: 4500,
    schedule: "সপ্তাহে ৩ দিন (বিকাল ৫টা)",
    status: "pending",
    notes: "এইচএসসি প্রস্তুতির জন্য বাসায় এসে পড়াতে হবে।",
    createdAt: "2026-10-14T03:30:00Z"
  }
];

export const MOCK_TUTORS = [
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
];
