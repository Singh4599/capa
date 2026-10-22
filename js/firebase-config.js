// firebase-config.js — LV Spices CAPA Register
// Project: co-def35 | Collection: capa_records

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBrdZWsiXLJhcpvnOK2XvcclcsozgmuQMM",
  authDomain: "co-def35.firebaseapp.com",
  projectId: "co-def35",
  storageBucket: "co-def35.firebasestorage.app",
  messagingSenderId: "57085695623",
  appId: "1:57085695623:web:32565c08df6f9ff24f4a22"
};

export const COLLECTION_NAME = "capa_records";

let db = null;

export function updateCloudBadge(connected) {
  const badge = document.getElementById('cloud-status-badge');
  const text  = document.getElementById('cloud-status-text');
  if (!badge || !text) return;
  if (connected) {
    badge.className = 'cloud-badge connected';
    text.textContent = 'Cloud Synced';
  } else {
    badge.className = 'cloud-badge offline';
    text.textContent = 'Offline Mode';
  }
}

export function initFirebase() {
  if (db) return db;
  try {
    const app = getApps().find(a => a.name === 'capa') || initializeApp(firebaseConfig, 'capa');
    db = getFirestore(app);
    updateCloudBadge(true);
    return db;
  } catch (err) {
    console.warn('[Firebase CAPA] Init error:', err);
    updateCloudBadge(false);
    return null;
  }
}

export async function saveRecord(record) {
  const database = initFirebase();
  if (!database) return false;
  try {
    const ref = doc(database, COLLECTION_NAME, record.id);
    await setDoc(ref, { ...record, updatedAt: Date.now() }, { merge: true });
    updateCloudBadge(true);
    return true;
  } catch (err) {
    console.error('[Firebase CAPA] Save error:', err);
    updateCloudBadge(false);
    return false;
  }
}

export async function loadAllRecords() {
  const database = initFirebase();
  if (!database) return [];
  try {
    const q = query(collection(database, COLLECTION_NAME), orderBy("date", "asc"), limit(200));
    const snap = await getDocs(q);
    const records = [];
    snap.forEach(d => records.push(d.data()));
    updateCloudBadge(true);
    return records;
  } catch (err) {
    console.warn('[Firebase CAPA] Load error:', err);
    updateCloudBadge(false);
    return [];
  }
}

try { initFirebase(); } catch (e) {}
