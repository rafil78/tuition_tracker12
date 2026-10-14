import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import InvoicesView from './components/InvoicesView';
import ChatView from './components/ChatView';
import ClassesView from './components/ClassesView';
import AttendanceTracker from './components/AttendanceTracker';
import AssignmentsView from './components/AssignmentsView';
import GradebookView from './components/GradebookView';
import AnnouncementsView from './components/AnnouncementsView';
import StudentsView from './components/StudentsView';
import MonthlyReportView from './components/MonthlyReportView';
import StudyNotesView from './components/StudyNotesView';
import ClassReminderBanner from './components/ClassReminderBanner';
import RoutineExamView from './components/RoutineExamView';
import RewardsView from './components/RewardsView';
import ParentDashboardView from './components/ParentDashboardView';
import HomeTuitionLocationModal from './components/HomeTuitionLocationModal';
import AdminDashboardView from './components/AdminDashboardView';
import AuthPage from './components/AuthPage';
import FindTutorView from './components/FindTutorView';
import TuitionJobsView from './components/TuitionJobsView';
import OfflineBanner from './components/OfflineBanner';
import ServerConfigModal from './components/ServerConfigModal';
import SSLCommerzModal from './components/SSLCommerzModal';
import NewBatchPopupModal from './components/NewBatchPopupModal';
import confetti from 'canvas-confetti';

export default function App() {
  const { currentUser, isAdmin, isTeacher, isParent, isStudent, refreshKey, triggerRefresh } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [showFullAuthPage, setShowFullAuthPage] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [reportStudentId, setReportStudentId] = useState(null);
  const [reportClassId, setReportClassId] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // SSLCommerz Verified Redirect Success Modal
  const [sslSuccessData, setSslSuccessData] = useState(null);
  const [sslSuccessInvoice, setSslSuccessInvoice] = useState(null);

  // Batch Enrollment & Real-Time Pop-up Alert
  const [pendingBatchAlert, setPendingBatchAlert] = useState(null);
  const [batchToEnroll, setBatchToEnroll] = useState(null);
  const [activeBatchChatId, setActiveBatchChatId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      if (paymentStatus === 'sslcommerz_success') {
        const invId = params.get('invoiceId');
        const tranId = params.get('tranId');
        const valId = params.get('valId');
        const amount = params.get('amount');
        const channel = params.get('channel');

        // Clean URL parameters smoothly without page reload
        window.history.replaceState({}, document.title, window.location.pathname);

        // Confetti celebration
        confetti({ particleCount: 130, spread: 80, origin: { y: 0.55 } });

        // Trigger full data refresh
        loadAppData();

        setSslSuccessData({
          invoiceId: invId,
          tranId,
          valId,
          amount,
          channel: channel || 'SSLCommerz Gateway'
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleUnread = (e) => {
      setUnreadMessagesCount(e.detail || 0);
    };
    window.addEventListener('edutrack_unread_messages_count', handleUnread);
    return () => window.removeEventListener('edutrack_unread_messages_count', handleUnread);
  }, []);
  
  // Application Data States
  const [stats, setStats] = useState({});
  const [classes, setClasses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all foundational data
  const loadAppData = async () => {
    try {
      const [statsData, classesData, invoicesData, enrollmentsData, usersData, asgData] = await Promise.all([
        api.getStats(),
        api.getClasses(),
        api.getInvoices(),
        api.getEnrollments(),
        api.getUsers('student'),
        api.getAssignments()
      ]);
      setStats(statsData || {});
      setClasses(classesData || []);
      setInvoices(invoicesData || []);
      setEnrollments(enrollmentsData || []);
      setStudents(usersData || []);
      setAssignments(asgData || []);
    } catch (err) {
      console.warn('Using offline mock application data');
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAppData();
    }
  }, [refreshKey, currentUser]);

  // Real-time listener: Check if a new batch has been created for students
  useEffect(() => {
    if (!currentUser || isTeacher || isAdmin) return;

    const checkBatchAlerts = async () => {
      try {
        const notifRes = await api.getNotifications(currentUser.id);
        const batchNotifs = notifRes?.notifications?.filter(n => n.type === 'new_batch_created') || [];
        
        if (batchNotifs.length > 0) {
          const latestNotif = batchNotifs[0];
          const classId = latestNotif.classId || latestNotif.batchData?.id;
          
          const isEnrolled = enrollments.some(e => e.classId === classId && (e.studentId === currentUser.id || e.student?.id === currentUser.id));
          const dismissed = sessionStorage.getItem(`edutrack_dismissed_batch_${classId}`);

          if (!isEnrolled && !dismissed) {
            const batchObj = latestNotif.batchData || classes.find(c => c.id === classId);
            if (batchObj) {
              setPendingBatchAlert(batchObj);
            }
          }
        }
      } catch (err) {
        console.warn('Batch alert check note:', err);
      }
    };

    checkBatchAlerts();
    const interval = setInterval(checkBatchAlerts, 4000);
    return () => clearInterval(interval);
  }, [currentUser?.id, isTeacher, isAdmin, classes.length, enrollments.length]);

  // If user is not logged in or explicitly clicked to view the Auth Page
  if (!currentUser || showFullAuthPage) {
    return (
      <AuthPage
        onGoToDashboard={() => {
          setShowFullAuthPage(false);
          loadAppData();
        }}
      />
    );
  }

  const handleNavigateToReport = (studentId, classId) => {
    if (studentId) setReportStudentId(studentId);
    if (classId) setReportClassId(classId);
    setCurrentTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar 
        onOpenAuthPage={() => setShowFullAuthPage(true)} 
        onOpenLocationModal={() => setShowLocationModal(true)}
        unreadMessagesCount={unreadMessagesCount}
        onNavigateToChat={() => setCurrentTab('messages')}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          unreadMessagesCount={unreadMessagesCount}
          onOpenAuthPage={() => setShowFullAuthPage(true)}
          onOpenLocationModal={() => setShowLocationModal(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Class Reminder Live Banner */}
          <ClassReminderBanner classes={classes} />

          {/* Mobile Tab Selector */}
          <div className="md:hidden mb-4 overflow-x-auto pb-2 flex gap-1 border-b border-slate-200">
            {(isAdmin ? [
              { id: 'overview', label: '🛡️ অ্যাডমিন' },
              { id: 'tuition-jobs', label: 'টিউশন জব' },
              { id: 'classes', label: 'কোর্স ও ব্যাচ' },
              { id: 'attendance', label: 'হাজিরা লগ' },
              { id: 'invoices', label: 'ইনভয়েস ও ফি' },
              { id: 'reports', label: 'মাসিক রিপোর্ট' },
              { id: 'messages', label: 'চ্যাট' },
              { id: 'announcements', label: 'নোটিশ' },
            ] : isTeacher ? [
              { id: 'overview', label: 'ড্যাশবোর্ড' },
              { id: 'tuition-jobs', label: 'টিউশন জব' },
              { id: 'classes', label: 'আমার ব্যাচ' },
              { id: 'attendance', label: 'হাজিরা' },
              { id: 'assignments', label: 'হোমওয়ার্ক' },
              { id: 'students', label: 'ছাত্র তালিকা' },
              { id: 'notes', label: 'নোটস' },
              { id: 'routine', label: 'রুটিন' },
              { id: 'reports', label: 'রিপোর্ট' },
              { id: 'invoices', label: 'ইনভয়েস' },
              { id: 'messages', label: 'চ্যাট' },
            ] : isParent ? [
              { id: 'overview', label: 'Guardian' },
              { id: 'find-tutor', label: 'গৃহশিক্ষক' },
              { id: 'routine', label: 'রুটিন' },
              { id: 'reports', label: 'রিপোর্ট' },
              { id: 'invoices', label: 'পেমেন্ট' },
              { id: 'messages', label: 'চ্যাট' },
            ] : [
              { id: 'overview', label: 'ড্যাশবোর্ড' },
              { id: 'find-tutor', label: 'হোম টিউটর' },
              { id: 'classes', label: 'আমার ব্যাচ' },
              { id: 'routine', label: 'রুটিন' },
              { id: 'attendance', label: 'হাজিরা' },
              { id: 'assignments', label: 'হোমওয়ার্ক' },
              { id: 'invoices', label: 'পেমেন্ট' },
              { id: 'notes', label: 'নোটস' },
              { id: 'messages', label: 'চ্যাট' },
              { id: 'reports', label: 'রিপোর্ট' },
              { id: 'rewards', label: 'রিওয়ার্ড' },
              { id: 'announcements', label: 'নোটিশ' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  currentTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active View Router */}
          {currentTab === 'overview' && (
            isAdmin ? (
              <AdminDashboardView />
            ) : isParent ? (
              <ParentDashboardView
                classes={classes}
                invoices={invoices}
                onNavigate={setCurrentTab}
                onRefresh={loadAppData}
              />
            ) : (
              <DashboardOverview
                stats={stats}
                classes={classes}
                invoices={invoices}
                enrollments={enrollments}
                assignments={assignments}
                onNavigate={setCurrentTab}
                onRefresh={loadAppData}
              />
            )
          )}

          {currentTab === 'find-tutor' && (
            isTeacher ? (
              /* Teachers don't hire tutors; route to their tuition jobs */
              <TuitionJobsView
                onNavigateToChat={() => setCurrentTab('messages')}
                onRefresh={loadAppData}
              />
            ) : (
              <FindTutorView
                onNavigateToChat={() => setCurrentTab('messages')}
              />
            )
          )}

          {currentTab === 'tuition-jobs' && (
            !isTeacher && !isAdmin ? (
              /* Students & parents don't accept jobs; route to Find Tutor */
              <FindTutorView
                onNavigateToChat={() => setCurrentTab('messages')}
              />
            ) : (
              <TuitionJobsView
                onNavigateToChat={() => setCurrentTab('messages')}
                onRefresh={loadAppData}
              />
            )
          )}

          {currentTab === 'routine' && (
            <RoutineExamView
              classes={classes}
            />
          )}

          {currentTab === 'rewards' && (
            isTeacher ? (
              /* Teachers don't have student rewards; route to overview */
              <DashboardOverview
                stats={stats}
                classes={classes}
                invoices={invoices}
                enrollments={enrollments}
                assignments={assignments}
                onNavigate={setCurrentTab}
                onRefresh={loadAppData}
              />
            ) : (
              <RewardsView
                students={students}
                onRefreshInvoices={loadAppData}
              />
            )
          )}

          {currentTab === 'notes' && (
            <StudyNotesView
              classes={classes}
            />
          )}

          {currentTab === 'reports' && (
            <MonthlyReportView
              classes={classes}
              students={students}
              initialStudentId={reportStudentId}
              initialClassId={reportClassId}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              students={students}
              classes={classes}
              onRefresh={loadAppData}
            />
          )}

          {currentTab === 'messages' && (
            <ChatView initialBatchId={activeBatchChatId} />
          )}

          {currentTab === 'classes' && (
            <ClassesView
              classes={classes}
              enrollments={enrollments}
              onRefresh={loadAppData}
              onEnrollInBatch={(batch) => setBatchToEnroll(batch)}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceTracker
              classes={classes}
              onOpenReport={handleNavigateToReport}
            />
          )}

          {currentTab === 'assignments' && (
            <AssignmentsView
              classes={classes}
              onOpenReport={handleNavigateToReport}
            />
          )}

          {currentTab === 'gradebook' && (
            <GradebookView
              classes={classes}
              students={students}
            />
          )}

          {currentTab === 'announcements' && (
            <AnnouncementsView
              classes={classes}
            />
          )}

          {currentTab === 'students' && (
            isStudent ? (
              /* Students should not manage student rosters; route to their classes */
              <ClassesView
                classes={classes}
                enrollments={enrollments}
                onRefresh={loadAppData}
              />
            ) : (
              <StudentsView
                students={students}
                enrollments={enrollments}
                invoices={invoices}
                classes={classes}
                onOpenReport={handleNavigateToReport}
                onSelectChat={(student) => {
                  setCurrentTab('messages');
                }}
              />
            )
          )}
        </main>
      </div>

      {/* Global Home Tuition Location Tracking Modal */}
      {showLocationModal && (
        <HomeTuitionLocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          selectedClass={classes.find(c => c.mode === 'home') || classes[1] || classes[0]}
          onOpenChat={() => setCurrentTab('messages')}
        />
      )}

      {/* Floating Offline Mode Indicator Banner */}
      <OfflineBanner onOpenServerModal={() => setShowServerModal(true)} />

      {/* Global Server & Offline Mode Settings Modal */}
      <ServerConfigModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
      />

      {/* Real-time New Batch Created Alert Pop-up Modal for Students */}
      {pendingBatchAlert && (
        <NewBatchPopupModal
          isOpen={!!pendingBatchAlert}
          batch={pendingBatchAlert}
          onClose={() => {
            if (pendingBatchAlert?.id) {
              sessionStorage.setItem(`edutrack_dismissed_batch_${pendingBatchAlert.id}`, 'true');
            }
            setPendingBatchAlert(null);
          }}
          onEnrollWithSSLCommerz={(batch) => {
            setBatchToEnroll(batch);
            setPendingBatchAlert(null);
          }}
        />
      )}

      {/* Global SSLCommerz Modal for Batch Enrollment & Instant Group Join */}
      {batchToEnroll && (
        <SSLCommerzModal
          isOpen={!!batchToEnroll}
          batchToEnroll={batchToEnroll}
          onClose={() => setBatchToEnroll(null)}
          onPaymentSuccess={() => {
            loadAppData();
          }}
          onNavigateToBatchChat={(batchId) => {
            setActiveBatchChatId(batchId || batchToEnroll?.id);
            setCurrentTab('messages');
            setBatchToEnroll(null);
          }}
        />
      )}

      {/* Global SSLCommerz Real Success Receipt Modal */}
      {sslSuccessData && (
        <SSLCommerzModal
          isOpen={!!sslSuccessData}
          invoice={sslSuccessInvoice || { id: sslSuccessData.invoiceId, amount: sslSuccessData.amount, title: 'টিউশন ফি ও কোর্স পেমেন্ট', invoiceNumber: 'INV-SSLCOMMERZ' }}
          successPayload={sslSuccessData}
          onClose={() => {
            setSslSuccessData(null);
            setSslSuccessInvoice(null);
            loadAppData();
          }}
          onPaymentSuccess={() => {
            loadAppData();
          }}
        />
      )}
    </div>
  );
}
