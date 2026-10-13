import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  getDatabase, 
  ref as rtdbRef, 
  set as rtdbSet, 
  get as rtdbGet, 
  remove as rtdbRemove,
  onValue as rtdbOnValue,
  push as rtdbPush
} from 'firebase/database';

// Helper to retrieve saved Firebase configuration
export function getFirebaseConfig() {
  try {
    const custom = localStorage.getItem('edutrack_firebase_config');
    if (custom) {
      return JSON.parse(custom);
    }
  } catch (err) {
    console.warn('Failed to parse custom firebase config:', err);
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
}

export function saveFirebaseConfig(config) {
  localStorage.setItem('edutrack_firebase_config', JSON.stringify(config));
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

// Initialize Firebase App
let app = null;
let auth = null;
let db = null;
let rtdb = null;
let storage = null;
let googleProvider = null;

try {
  const currentConfig = getFirebaseConfig();
  if (currentConfig.apiKey && currentConfig.projectId) {
    if (!currentConfig.databaseURL && currentConfig.projectId) {
      currentConfig.databaseURL = `https://${currentConfig.projectId}-default-rtdb.firebaseio.com`;
    }
    app = getApps().length === 0 ? initializeApp(currentConfig) : getApp();
    auth = getAuth(app);
    try { db = getFirestore(app); } catch (e) { console.warn('Firestore init note:', e.message); }
    try { rtdb = getDatabase(app); } catch (e) { console.warn('Realtime DB init note:', e.message); }
    try { storage = getStorage(app); } catch (e) { console.warn('Storage init note:', e.message); }
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
} catch (err) {
  console.warn('Firebase initialization notice:', err.message);
}

export { app, auth, db, rtdb, storage, googleProvider };

// ================= FIREBASE AUTH HELPERS =================

export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not yet configured. Please enter your Firebase API keys in settings.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithFirebaseEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase Auth is not yet configured. Please enter your Firebase API keys in settings.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function registerWithFirebaseEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase Auth is not yet configured. Please enter your Firebase API keys in settings.');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signOutFirebase() {
  if (auth) {
    await signOut(auth);
  }
}

// ================= FIREBASE STORAGE UPLOAD HELPER =================

export function uploadFileToFirebase(file, path = 'uploads', onProgress = null) {
  return new Promise((resolve, reject) => {
    if (!storage) {
      return reject(new Error('Firebase Storage সংযুক্ত করা হয়নি। সেটিংস থেকে ফায়ারবেস কনফিগার করুন।'));
    }
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fullPath = `${path}/${Date.now()}_${cleanFileName}`;
    const sRef = storageRef(storage, fullPath);
    const uploadTask = uploadBytesResumable(sRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = snapshot.totalBytes > 0 
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) 
          : 0;
        if (onProgress) {
          onProgress({
            progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state
          });
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const sizeMb = file.size > 1048576 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
            : `${Math.round(file.size / 1024)} KB`;
          resolve({
            downloadUrl,
            fileName: file.name,
            fileSize: sizeMb,
            contentType: file.type,
            fullPath
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// ================= CLOUD FIRESTORE HELPERS =================

// Utility: timeout wrapper to prevent Firestore calls from hanging indefinitely
export function withTimeout(promise, ms = 4000, errorMsg = 'ফায়ারবেস রেসপন্স টাইমআউট (Firestore Rules বা Database এনেবল আছে কিনা চেক করুন)') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ]);
}

export async function syncDocToFirestore(colName, docId, data, timeoutMs = 4000) {
  if (!db) {
    console.warn('Firestore not ready for sync');
    return false;
  }
  try {
    const dRef = doc(db, colName, String(docId));
    await withTimeout(
      setDoc(dRef, { 
        ...data, 
        _lastSyncedAt: new Date().toISOString() 
      }, { merge: true }),
      timeoutMs,
      `Firestore (${colName}) সংযোগ টাইমআউট হয়েছে। Firebase Console-এ Firestore Database তৈরি ও Rules চেক করুন।`
    );
    return true;
  } catch (err) {
    console.error(`Failed to sync doc to ${colName}/${docId}:`, err);
    throw err;
  }
}

export async function batchSyncToFirestore(colName, items = [], timeoutMs = 4000) {
  if (!db || !items.length) return { success: false, count: 0 };
  let count = 0;
  for (const item of items) {
    const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    try {
      await syncDocToFirestore(colName, id, item, timeoutMs);
      count++;
    } catch (e) {
      console.warn(`Batch sync single item error (${colName}):`, e.message);
    }
  }
  return { success: true, count };
}

export async function fetchCollectionFromFirestore(colName, timeoutMs = 5000) {
  if (!db) return [];
  try {
    const qSnap = await withTimeout(
      getDocs(collection(db, colName)),
      timeoutMs,
      `Firestore (${colName}) ফেচ টাইমআউট হয়েছে।`
    );
    const list = [];
    qSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.warn(`fetchCollectionFromFirestore error (${colName}):`, err.message);
    return [];
  }
}

export async function deleteDocFromFirestore(colName, docId, timeoutMs = 4000) {
  if (!db) {
    console.warn('Firestore not ready for delete');
    return false;
  }
  try {
    const dRef = doc(db, colName, String(docId));
    await withTimeout(
      deleteDoc(dRef),
      timeoutMs,
      `Firestore (${colName}) ডিলিট টাইমআউট হয়েছে।`
    );
    return true;
  } catch (err) {
    console.error(`Failed to delete doc from ${colName}/${docId}:`, err);
    throw err;
  }
}

// ================= REALTIME DATABASE HELPERS =================

export async function syncDocToRealtimeDb(colName, docId, data, timeoutMs = 4000) {
  if (!rtdb) return false;
  try {
    // In Realtime DB, keys cannot contain '.', '#', '$', '/', '[', or ']'
    const cleanDocId = String(docId).replace(/[.#$/[\]]/g, '_');
    const nodeRef = rtdbRef(rtdb, `${colName}/${cleanDocId}`);
    await withTimeout(
      rtdbSet(nodeRef, { 
        ...data, 
        _lastSyncedAt: new Date().toISOString() 
      }),
      timeoutMs,
      `Realtime DB (${colName}) সংযোগ টাইমআউট`
    );
    return true;
  } catch (err) {
    console.warn(`Realtime DB sync notice (${colName}):`, err.message);
    return false;
  }
}

export async function deleteDocFromRealtimeDb(colName, docId, timeoutMs = 4000) {
  if (!rtdb) return false;
  try {
    const cleanDocId = String(docId).replace(/[.#$/[\]]/g, '_');
    const nodeRef = rtdbRef(rtdb, `${colName}/${cleanDocId}`);
    await withTimeout(
      rtdbRemove(nodeRef),
      timeoutMs,
      `Realtime DB (${colName}) ডিলিট টাইমআউট`
    );
    return true;
  } catch (err) {
    console.warn(`Realtime DB delete notice (${colName}):`, err.message);
    return false;
  }
}

export async function fetchCollectionFromRealtimeDb(colName, timeoutMs = 5000) {
  if (!rtdb) return [];
  try {
    const nodeRef = rtdbRef(rtdb, colName);
    const snap = await withTimeout(
      rtdbGet(nodeRef),
      timeoutMs,
      `Realtime DB (${colName}) ফেচ টাইমআউট`
    );
    if (!snap.exists()) return [];
    const val = snap.val();
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val).map(([k, v]) => ({ id: k, ...v }));
    }
    return [];
  } catch (err) {
    console.warn(`fetchCollectionFromRealtimeDb error (${colName}):`, err.message);
    return [];
  }
}

/**
 * Real-time listener for messages from Firebase Realtime Database
 */
export function subscribeToRealtimeMessages(callback) {
  if (!rtdb) return () => {};
  try {
    const messagesRef = rtdbRef(rtdb, 'edutrack_messages');
    const unsubscribe = rtdbOnValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.entries(val).map(([k, v]) => ({ id: k, ...v }));
        callback(list);
      } else {
        callback([]);
      }
    }, (error) => {
      console.warn('Realtime messages listener note:', error.message);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to realtime messages:', err);
    return () => {};
  }
}

/**
 * Push message directly to Realtime Database
 */
export async function pushMessageToRealtimeDb(msg) {
  if (!rtdb) return null;
  try {
    const cleanId = String(msg.id || Date.now()).replace(/[.#$/[\]]/g, '_');
    const msgRef = rtdbRef(rtdb, `edutrack_messages/${cleanId}`);
    await withTimeout(
      rtdbSet(msgRef, {
        ...msg,
        _timestamp: Date.now()
      }),
      3000
    );
    return true;
  } catch (err) {
    console.warn('Push message to Realtime DB note:', err.message);
    return false;
  }
}




