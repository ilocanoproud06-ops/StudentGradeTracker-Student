// ============================================
// Student Grade Tracker - Data Sharing Configuration
// Works with localStorage, Firebase (optional), and shared data files
// ============================================

// Configuration
const DB_KEY = "academic_grade_system_v1";
const SYNC_STATUS_KEY = "academic_sync_status";
const LAST_SYNC_KEY = "academic_last_sync";

// Default shared data URL - admin can host this file on GitHub Pages
// For example: https://yourusername.github.io/RepoName/shared-data.json
const SHARED_DATA_URL = "data.json";

// Check if Firebase SDK is loaded
const isFirebaseSDKLoaded = typeof firebase !== 'undefined';

// Firebase configuration (optional)
const firebaseConfig = {
  apiKey: "AIzaSyC3T9M61Ryll8scTGVWH5QdZKuAguWTzgw",
  authDomain: "studentgradetracker-e04c0.firebaseapp.com",
  projectId: "studentgradetracker-e04c0",
  storageBucket: "studentgradetracker-e04c0.firebasestorage.app",
  messagingSenderId: "886408200590",
  appId: "1:886408200590:web:c9fbdb028e5dcd442c64df"
};

let firebaseInitialized = false;
let db = null;
let auth = null;

// Try to initialize Firebase
function initializeFirebase() {
  return new Promise((resolve) => {
    if (!isFirebaseSDKLoaded) {
      resolve({ available: false, reason: 'sdk_not_loaded' });
      return;
    }

    try {
      const app = firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      auth = firebase.auth();
      firebaseInitialized = true;
      resolve({ available: true, reason: 'success' });
    } catch (error) {
      resolve({ available: false, reason: error.message });
    }
  });
}

// ============================================
// Sync Manager with Multiple Storage Options
// ============================================

const SyncManager = {
  isOnline: navigator.onLine,
  firebaseAvailable: false,
  firebaseInitResult: null,
  syncInProgress: false,
  lastSyncTime: null,
  storageMode: 'local',
  
  async init() {
    // Try to initialize Firebase
    const initResult = await initializeFirebase();
    this.firebaseInitResult = initResult;
    this.firebaseAvailable = initResult.available;
    
    // Determine storage mode
    if (this.firebaseAvailable && this.isOnline) {
      this.storageMode = 'firebase';
    } else {
      this.storageMode = 'local';
    }
    
    // Load last sync time
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    if (lastSync) {
      this.lastSyncTime = new Date(lastSync);
    }
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStorageMode();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.storageMode = 'local';
      this.updateStatusIndicator();
    });
    
    console.log("SyncManager initialized. Mode:", this.storageMode);
    this.updateStatusIndicator();
    
    return this;
  },
  
  updateStorageMode() {
    if (this.firebaseAvailable && this.isOnline) {
      this.storageMode = 'firebase';
    } else {
      this.storageMode = 'local';
    }
    this.updateStatusIndicator();
  },
  
  updateStatusIndicator() {
    const indicators = document.querySelectorAll('[data-sync-status]');
    indicators.forEach(el => {
      if (this.storageMode === 'firebase') {
        el.innerHTML = '<span class="badge bg-success"><i class="fas fa-cloud"></i> Cloud Synced</span>';
      } else if (!this.isOnline) {
        el.innerHTML = '<span class="badge bg-warning"><i class="fas fa-wifi"></i> Offline</span>';
      } else {
        el.innerHTML = '<span class="badge bg-info"><i class="fas fa-save"></i> Local Only</span>';
      }
    });
    
    const modeDisplays = document.querySelectorAll('[data-storage-mode]');
    modeDisplays.forEach(el => {
      el.textContent = this.storageMode === 'firebase' ? 'Cloud Mode' : 'Local Mode';
    });
  },
  
  getStatus() {
    return {
      online: this.isOnline,
      firebase: this.firebaseAvailable,
      storageMode: this.storageMode,
      lastSync: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    };
  },
  
  // Load data from multiple sources
  async loadData() {
    let store = this.getLocalData();
    
    // Priority 1: Try Firebase if available
    if (this.firebaseAvailable && this.isOnline) {
      try {
        const firebaseData = await this.loadFromFirebase();
        if (firebaseData && Object.keys(firebaseData).length > 0) {
          const localTime = store && store._lastModified ? new Date(store._lastModified) : new Date(0);
          const firebaseTime = firebaseData._lastModified ? new Date(firebaseData._lastModified) : new Date(0);
          
          if (firebaseTime > localTime) {
            store = firebaseData;
            this.saveLocalData(store);
          }
        }
      } catch (error) {
        console.error("Firebase load error:", error);
      }
    }
    
    // Priority 2: If no local data, try to load from shared data file
    if (!store || !store.students || store.students.length === 0) {
      try {
        const sharedData = await this.loadFromSharedFile();
        if (sharedData && sharedData.students && sharedData.students.length > 0) {
          console.log("Loading from shared data file...");
          store = sharedData;
          this.saveLocalData(store);
        }
      } catch (error) {
        console.log("Shared data not available:", error.message);
      }
    }
    
    return this.ensureDefaultStructure(store);
  },
  
  // Load from a shared JSON file (for student access)
  async loadFromSharedFile() {
    return new Promise((resolve, reject) => {
      // Try to load from data.json in the same directory
      fetch('data.json')
        .then(response => {
          if (!response.ok) throw new Error('Data file not found');
          return response.json();
        })
        .then(data => {
          console.log("Loaded shared data successfully");
          resolve(data);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
  
  async saveData(store) {
    store._lastModified = new Date().toISOString();
    this.saveLocalData(store);
    
    if (this.firebaseAvailable && this.isOnline) {
      try {
        await this.saveToFirebase(store);
        this.lastSyncTime = new Date();
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime.toISOString());
      } catch (error) {
        console.error("Firebase save error:", error);
      }
    }
  },
  
  async quickSave(store) {
    store._lastModified = new Date().toISOString();
    this.saveLocalData(store);
    
    if (this.firebaseAvailable && this.isOnline && !this.syncInProgress) {
      this.syncToFirebaseDebounced(store);
    }
  },
  
  getLocalData() {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Error parsing localStorage:", e);
      }
    }
    return null;
  },
  
  saveLocalData(store) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(store));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  },
  
  async loadFromFirebase() {
    if (!this.firebaseAvailable || !db) return null;
    
    try {
      const store = {};
      
      const collections = ['courses', 'students', 'enrollments', 'assessments', 'groups'];
      for (const col of collections) {
        const snapshot = await db.collection(col).get();
        store[col] = [];
        snapshot.forEach(doc => store[col].push(doc.data()));
      }
      
      const gradesSnapshot = await db.collection('grades').get();
      store.grades = {};
      gradesSnapshot.forEach(doc => {
        const data = doc.data();
        const id = data.id;
        delete data.id;
        store.grades[id] = data;
      });
      
      const hpsDoc = await db.collection('settings').doc('hps').get();
      if (hpsDoc.exists) store.hps = hpsDoc.data();
      
      const weightsDoc = await db.collection('settings').doc('weights').get();
      if (weightsDoc.exists) store.weights = weightsDoc.data();
      
      const gradingScaleDoc = await db.collection('settings').doc('gradingScale').get();
      if (gradingScaleDoc.exists) store.gradingScale = gradingScaleDoc.data().scale;
      
      return store;
    } catch (error) {
      console.error("Error loading from Firebase:", error);
      return null;
    }
  },
  
  async saveToFirebase(store) {
    if (!this.firebaseAvailable || !db) return;
    
    this.syncInProgress = true;
    
    try {
      const collections = ['courses', 'students', 'enrollments', 'assessments', 'groups'];
      
      for (const col of collections) {
        if (store[col] && Array.isArray(store[col])) {
          const snapshot = await db.collection(col).get();
          const deletes = snapshot.docs.map(d => d.ref.delete());
          await Promise.all(deletes);
          
          if (store[col].length > 0) {
            const adds = store[col].map(item => db.collection(col).add(item));
            await Promise.all(adds);
          }
        }
      }
      
      if (store.grades) {
        const snapshot = await db.collection('grades').get();
        const deletes = snapshot.docs.map(d => d.ref.delete());
        await Promise.all(deletes);
        
        const entries = Object.entries(store.grades);
        if (entries.length > 0) {
          const adds = entries.map(([key, value]) => 
            db.collection('grades').add({ id: key, ...value })
          );
          await Promise.all(adds);
        }
      }
      
      if (store.hps) await db.collection('settings').doc('hps').set(store.hps);
      if (store.weights) await db.collection('settings').doc('weights').set(store.weights);
      if (store.gradingScale) await db.collection('settings').doc('gradingScale').set({ scale: store.gradingScale });
      
      console.log("Data synced to Firebase");
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    } finally {
      this.syncInProgress = false;
    }
  },
  
  syncToFirebaseDebounced: (function() {
    let timeout = null;
    return function(store) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => SyncManager.saveToFirebase(store), 2000);
    };
  })(),
  
  exportData() {
    const store = this.getLocalData();
    const dataStr = JSON.stringify(store, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_grade_tracker_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("Data exported");
    return true;
  },
  
  // Export data that can be shared (for students to load)
  exportSharedData() {
    const store = this.getLocalData();
    // Create a version with only essential data for students
    const sharedData = {
      students: store.students || [],
      courses: store.courses || [],
      enrollments: store.enrollments || [],
      grades: store.grades || {},
      assessments: store.assessments || [],
      hps: store.hps || {},
      weights: store.weights || {},
      gradingScale: store.gradingScale || [],
      _lastModified: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(sharedData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json'; // Named for shared access
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("Shared data exported as data.json");
    return true;
  },
  
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (!importedData.courses || !importedData.students) {
            reject(new Error("Invalid backup file"));
            return;
          }
          
          this.saveLocalData(importedData);
          
          if (this.firebaseAvailable && this.isOnline) {
            this.saveToFirebase(importedData);
          }
          
          resolve(importedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  },
  
  ensureDefaultStructure(store) {
    return {
      courses: store?.courses || [],
      students: store?.students || [],
      enrollments: store?.enrollments || [],
      grades: store?.grades || {},
      assessments: store?.assessments || [],
      groups: store?.groups || [],
      hps: store?.hps || { quiz: 50, pt: 100, project: 100, exam: 100 },
      weights: store?.weights || { written: 40, quiz: 20, pt: 30, project: 10 },
      gradingScale: store?.gradingScale || [
        { min: 95, max: 100, label: "A" },
        { min: 90, max: 94, label: "A-" },
        { min: 85, max: 89, label: "B+" },
        { min: 80, max: 84, label: "B" },
        { min: 75, max: 79, label: "B-" },
        { min: 70, max: 74, label: "C+" },
        { min: 65, max: 69, label: "C" },
        { min: 60, max: 64, label: "C-" },
        { min: 55, max: 59, label: "D" },
        { min: 0, max: 54, label: "F" },
      ],
      _lastModified: store?._lastModified || new Date().toISOString()
    };
  }
};

window.SyncManager = SyncManager;
window.DB_KEY = DB_KEY;

document.addEventListener('DOMContentLoaded', async () => {
  await SyncManager.init();
});

