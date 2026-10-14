import { 
  LayoutDashboard, CreditCard, MessageSquare, BookOpen, 
  CalendarCheck, FileText, Award, Bell, Users, FileSpreadsheet, 
  FolderDown, Clock, Trophy, Navigation, Shield, Compass, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, onSelectTab, unreadMessagesCount = 0, onOpenAuthPage, onOpenLocationModal }) {
  const { isAdmin, isTeacher, isStudent, isParent, currentUser, lang } = useAuth();

  let navItems = [];

  if (isAdmin) {
    navItems = [
      { id: 'overview', label: lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel', icon: Shield },
      { id: 'tuition-jobs', label: lang === 'bn' ? 'টিউশন জব ও রিকোয়েস্ট' : 'Tuition Requests', icon: Briefcase },
      { id: 'classes', label: lang === 'bn' ? 'সকল ব্যাচ' : 'Batches', icon: BookOpen },
      { id: 'attendance', label: lang === 'bn' ? 'হাজিরা ট্র্যাকার' : 'Attendance', icon: CalendarCheck },
      { id: 'invoices', label: lang === 'bn' ? 'পেমেন্ট ও ইনভয়েস' : 'Invoices', icon: CreditCard },
      { id: 'reports', label: lang === 'bn' ? 'মাসিক রিপোর্ট' : 'Reports', icon: FileSpreadsheet },
      { id: 'messages', label: lang === 'bn' ? 'ইনবক্স ও মেসেজ' : 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
      { id: 'announcements', label: lang === 'bn' ? 'নোটিশবোর্ড' : 'Notices', icon: Bell },
    ];
  } else if (isTeacher) {
    navItems = [
      { id: 'overview', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
      { id: 'tuition-jobs', label: lang === 'bn' ? 'নতুন টিউশন জব' : 'Tuition Jobs', icon: Briefcase },
      { id: 'classes', label: lang === 'bn' ? 'টিউশন ব্যাচ' : 'Batches', icon: BookOpen },
      { id: 'attendance', label: lang === 'bn' ? 'হাজিরা' : 'Attendance', icon: CalendarCheck },
      { id: 'assignments', label: lang === 'bn' ? 'হোমওয়ার্ক' : 'Homework', icon: FileText },
      { id: 'students', label: lang === 'bn' ? 'শিক্ষার্থী তালিকা' : 'Students', icon: Users },
      { id: 'notes', label: lang === 'bn' ? 'স্টাডি নোটস' : 'Study Notes', icon: FolderDown },
      { id: 'routine', label: lang === 'bn' ? 'রুটিন ও পরীক্ষা' : 'Routine & Exams', icon: Clock },
      { id: 'reports', label: lang === 'bn' ? 'মাসিক রিপোর্ট' : 'Reports', icon: FileSpreadsheet },
      { id: 'invoices', label: lang === 'bn' ? 'ইনভয়েস' : 'Invoices', icon: CreditCard },
      { id: 'messages', label: lang === 'bn' ? 'মেসেজ' : 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
      { id: 'gradebook', label: lang === 'bn' ? 'ফলাফল' : 'Gradebook', icon: Award },
      { id: 'announcements', label: lang === 'bn' ? 'নোটিশ' : 'Notices', icon: Bell },
    ];
  } else if (isParent) {
    navItems = [
      { id: 'overview', label: lang === 'bn' ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent Dashboard', icon: Shield },
      { id: 'find-tutor', label: lang === 'bn' ? 'গৃহশিক্ষক খুঁজুন' : 'Find Home Tutor', icon: Compass },
      { id: 'routine', label: lang === 'bn' ? 'রুটিন ও পরীক্ষা' : 'Routine', icon: Clock },
      { id: 'reports', label: lang === 'bn' ? 'হাজিরা রিপোর্ট' : 'Reports', icon: FileSpreadsheet },
      { id: 'invoices', label: lang === 'bn' ? 'টিউশন ফি' : 'Tuition Fees', icon: CreditCard },
      { id: 'messages', label: lang === 'bn' ? 'শিক্ষকের সাথে যোগাযোগ' : 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
      { id: 'notes', label: lang === 'bn' ? 'স্টাডি নোটস' : 'Study Notes', icon: FolderDown },
      { id: 'announcements', label: lang === 'bn' ? 'নোটিশ' : 'Notices', icon: Bell },
    ];
  } else {
    navItems = [
      { id: 'overview', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
      { id: 'find-tutor', label: lang === 'bn' ? 'হোম টিউটর খুঁজুন' : 'Find Tutor', icon: Compass },
      { id: 'classes', label: lang === 'bn' ? 'আমার ব্যাচ' : 'My Classes', icon: BookOpen },
      { id: 'routine', label: lang === 'bn' ? 'ক্লাস রুটিন' : 'Routine', icon: Clock },
      { id: 'attendance', label: lang === 'bn' ? 'আমার হাজিরা' : 'Attendance', icon: CalendarCheck },
      { id: 'assignments', label: lang === 'bn' ? 'হোমওয়ার্ক' : 'Homework', icon: FileText },
      { id: 'invoices', label: lang === 'bn' ? 'ফি ও ইনভয়েস' : 'Invoices', icon: CreditCard },
      { id: 'notes', label: lang === 'bn' ? 'স্টাডি নোটস' : 'Study Notes', icon: FolderDown },
      { id: 'messages', label: lang === 'bn' ? 'ইনবক্স ও চ্যাট' : 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
      { id: 'reports', label: lang === 'bn' ? 'আমার রিপোর্ট' : 'Reports', icon: FileSpreadsheet },
      { id: 'rewards', label: lang === 'bn' ? 'রিওয়ার্ডস' : 'Rewards', icon: Trophy },
      { id: 'announcements', label: lang === 'bn' ? 'নোটিশ' : 'Notices', icon: Bell },
    ];
  }

  const roleText = isAdmin
    ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin')
    : isTeacher
    ? (lang === 'bn' ? 'শিক্ষক' : 'Teacher')
    : isParent
    ? (lang === 'bn' ? 'অভিভাবক' : 'Guardian')
    : (lang === 'bn' ? 'শিক্ষার্থী' : 'Student');

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-3.75rem)] p-3 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 mb-1 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{lang === 'bn' ? 'মেনু' : 'Menu'}</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
            {roleText}
          </span>
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white text-slate-900' : 'bg-red-600 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom tools */}
      <div className="space-y-1.5 pt-3 border-t border-slate-100">
        {onOpenLocationModal && !isTeacher && !isAdmin && (
          <button
            onClick={onOpenLocationModal}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition border border-slate-200"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'bn' ? 'হোম টিউটর ট্র্যাকার' : 'Home Tutor Tracker'}</span>
          </button>
        )}

        <button
          onClick={onOpenAuthPage}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition border border-slate-200"
        >
          <span>{lang === 'bn' ? 'লগইন / সাইন আপ পেজ' : 'Login / Signup Page'}</span>
        </button>
      </div>
    </aside>
  );
}
