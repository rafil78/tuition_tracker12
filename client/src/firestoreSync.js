import { api } from './api';
import { 
  db, 
  rtdb, 
  syncDocToFirestore, 
  syncDocToRealtimeDb, 
  deleteDocFromFirestore, 
  deleteDocFromRealtimeDb 
} from './firebase';

const SYNC_STORAGE_KEY = 'edutrack_firestore_sync_stats';

export function getLastSyncStats() {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading sync stats:', e);
  }
  return null;
}

export function saveSyncStats(stats) {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent('edutrack_firestore_sync_updated', { detail: stats }));
  } catch (e) {
    console.warn('Error saving sync stats:', e);
  }
}

/**
 * Helper to sync a batch of items to Realtime Database and Firestore
 */
async function syncBatch(colName, items, getId = null) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const promises = [];
  for (const item of items) {
    const docId = getId ? getId(item) : (item.id || `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
    if (rtdb) {
      promises.push(syncDocToRealtimeDb(colName, docId, item, 4000));
    }
    if (db) {
      promises.push(syncDocToFirestore(colName, docId, item, 4000));
    }
  }
  await Promise.allSettled(promises);
  return items.length;
}

/**
 * Sync all EduTrack datasets to Firebase (Realtime Database & Cloud Firestore)
 */
export async function syncAllToCloudFirestore(onProgress = null) {
  if (!db && !rtdb) {
    throw new Error('ফায়ারবেস ডেটাবেজ এখনো প্রস্তুত নয়। অনুগ্রহ করে API কী কনফিগারেশন চেক করুন।');
  }

  const results = {
    usersCount: 0,
    classesCount: 0,
    attendanceCount: 0,
    invoicesCount: 0,
    studyNotesCount: 0,
    assignmentsCount: 0,
    routinesCount: 0,
    syncedAt: new Date().toISOString(),
    status: 'success'
  };

  const updateProgress = (text) => {
    if (onProgress) onProgress(text);
  };

  try {
    // 1. Fetch & Sync Users (শিক্ষক, শিক্ষার্থী, অভিভাবক ও অ্যাডমিন)
    updateProgress('ইউজার ডেটা সিঙ্ক হচ্ছে...');
    try {
      const users = await api.getUsers();
      results.usersCount = await syncBatch('edutrack_users', users);
    } catch (err) {
      console.warn('Sync users notice:', err.message);
    }

    // 2. Fetch & Sync Classes (টিউশন শিডিউল ও ব্যাচ)
    updateProgress('টিউশন ব্যাচ সিঙ্ক হচ্ছে...');
    try {
      const classes = await api.getClasses();
      results.classesCount = await syncBatch('edutrack_classes', classes);
    } catch (err) {
      console.warn('Sync classes notice:', err.message);
    }

    // 3. Fetch & Sync Attendance (হাজিরা ও ফি কর্তন রেকর্ড)
    updateProgress('হাজিরা রেকর্ড সিঙ্ক হচ্ছে...');
    try {
      const attendance = await api.getAttendance();
      results.attendanceCount = await syncBatch('edutrack_attendance', attendance, (att) => {
        return att.id || `${att.classId}_${att.studentId}_${att.date}`.replace(/[.#$/[\]]/g, '_');
      });
    } catch (err) {
      console.warn('Sync attendance notice:', err.message);
    }

    // 4. Fetch & Sync Invoices (পেমেন্ট ইনভয়েস)
    updateProgress('ইনভয়েস রেকর্ড সিঙ্ক হচ্ছে...');
    try {
      const invoices = await api.getInvoices();
      results.invoicesCount = await syncBatch('edutrack_invoices', invoices);
    } catch (err) {
      console.warn('Sync invoices notice:', err.message);
    }

    // 5. Fetch & Sync Study Notes (স্টাডি নোটস ও লেকচার রিসোর্স)
    updateProgress('স্টাডি নোটস সিঙ্ক হচ্ছে...');
    try {
      const notes = await api.getStudyNotes();
      results.studyNotesCount = await syncBatch('edutrack_study_notes', notes);
    } catch (err) {
      console.warn('Sync study notes notice:', err.message);
    }

    // 6. Fetch & Sync Assignments (হোমওয়ার্ক ও অ্যাসাইনমেন্ট)
    updateProgress('অ্যাসাইনমেন্ট ও হোমওয়ার্ক সিঙ্ক হচ্ছে...');
    try {
      const asgs = await api.getAssignments();
      results.assignmentsCount = await syncBatch('edutrack_assignments', asgs);
    } catch (err) {
      console.warn('Sync assignments notice:', err.message);
    }

    // 7. Fetch & Sync Routines & Exam Schedules (রুটিন ও পরীক্ষার সূচি)
    updateProgress('রুটিন ও পরীক্ষার সূচি সিঙ্ক হচ্ছে...');
    try {
      const routines = await api.getRoutines();
      results.routinesCount = await syncBatch('edutrack_routines', routines);
    } catch (err) {
      console.warn('Sync routines notice:', err.message);
    }

    // 8. Fetch & Sync Tuition Requests (হোম টিউশন রিকোয়েস্ট ও জব)
    updateProgress('হোম টিউশন জব রিকোয়েস্ট সিঙ্ক হচ্ছে...');
    try {
      const tuitionReqs = await api.getTuitionRequests();
      results.tuitionRequestsCount = await syncBatch('edutrack_tuition_requests', tuitionReqs);
    } catch (err) {
      console.warn('Sync tuition requests notice:', err.message);
    }

    updateProgress('সিঙ্ক সফলভাবে সম্পন্ন হয়েছে!');
    saveSyncStats(results);
    return results;
  } catch (err) {
    results.status = 'error';
    results.error = err.message;
    saveSyncStats(results);
    throw err;
  }
}

/**
 * Auto-backup a single record to Firebase Realtime Database & Cloud Firestore
 * Non-blocking fire-and-forget so UI form submissions never hang
 */
export function autoBackupRecord(collectionType, record) {
  if ((!db && !rtdb) || !record) return Promise.resolve(false);
  try {
    const colMap = {
      users: 'edutrack_users',
      teachers: 'edutrack_users',
      students: 'edutrack_users',
      parents: 'edutrack_users',
      classes: 'edutrack_classes',
      attendance: 'edutrack_attendance',
      invoices: 'edutrack_invoices',
      studyNotes: 'edutrack_study_notes',
      assignments: 'edutrack_assignments',
      routines: 'edutrack_routines',
      reports: 'edutrack_reports'
    };
    const colName = colMap[collectionType] || `edutrack_${collectionType}`;
    const docId = record.id || `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Sync concurrently to Realtime Database & Firestore with 3-second safe timeout
    if (rtdb) {
      syncDocToRealtimeDb(colName, docId, record, 3000).catch(err => {
        console.warn(`[AutoBackup RealtimeDB] notice:`, err.message);
      });
    }
    if (db) {
      syncDocToFirestore(colName, docId, record, 3000).catch(err => {
        console.warn(`[AutoBackup Firestore] notice:`, err.message);
      });
    }
    return Promise.resolve(true);
  } catch (err) {
    console.warn(`Auto-backup to Firebase (${collectionType}) failed:`, err.message);
    return Promise.resolve(false);
  }
}

/**
 * Auto-delete a record from Firebase Realtime Database & Cloud Firestore
 * Non-blocking fire-and-forget so UI deletion never hangs
 */
export function autoDeleteRecord(collectionType, docId) {
  if ((!db && !rtdb) || !docId) return Promise.resolve(false);
  try {
    const colMap = {
      users: 'edutrack_users',
      teachers: 'edutrack_users',
      students: 'edutrack_users',
      parents: 'edutrack_users',
      classes: 'edutrack_classes',
      attendance: 'edutrack_attendance',
      invoices: 'edutrack_invoices',
      studyNotes: 'edutrack_study_notes',
      assignments: 'edutrack_assignments',
      routines: 'edutrack_routines',
      reports: 'edutrack_reports'
    };
    const colName = colMap[collectionType] || `edutrack_${collectionType}`;

    if (rtdb) {
      deleteDocFromRealtimeDb(colName, docId, 3000).catch(err => {
        console.warn(`[AutoDelete RealtimeDB] notice:`, err.message);
      });
    }
    if (db) {
      deleteDocFromFirestore(colName, docId, 3000).catch(err => {
        console.warn(`[AutoDelete Firestore] notice:`, err.message);
      });
    }
    return Promise.resolve(true);
  } catch (err) {
    console.warn(`Auto-delete from Firebase (${collectionType}) failed:`, err.message);
    return Promise.resolve(false);
  }
}
