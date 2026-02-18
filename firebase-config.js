// ============================================
// Student Grade Tracker - Enhanced Dual Storage Sync Manager
// Works with both Firebase and localStorage seamlessly
// GitHub Pages compatible with graceful fallback
// ============================================

// Firebase SDK (loaded from CDN in HTML)
let firebaseInitialized = false;
let db = null;
let auth = null;

// Configuration
const DB_KEY = "academic_grade_system_v1";
const SYNC_STATUS_KEY = "academic_sync_status";
const LAST_SYNC_KEY = "academic_last_sync";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3T9M61Ryll8scTGVWH5QdZKuAguWTzgw",
  authDomain: "studentgradetracker-e04c0.firebaseapp.com",
  projectId: "studentgradetracker-e04c0",
  storageBucket: "studentgradetracker-e04c0.firebasestorage.app",
  messagingSenderId: "886408200590",
  appId: "1:886408200590:web:c9fbdb028e5dcd442c64df"
};

// ============================================
// Firebase Initialization with Error Handling
// ============================================

function initializeFirebase() {
  return new Promise((resolve) => {
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
      console.log("Firebase SDK not loaded - using localStorage only");
      resolve({ available: false, reason: 'sdk_not_loaded' });
      return;
    }

    try {
      // Try to initialize Firebase
      const app = firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      auth = firebase.auth();
      firebaseInitialized = true;
      console.log("Firebase initialized successfully");
      resolve({ available: true, reason: 'success' });
    } catch (error) {
      console.log("Firebase initialization failed:", error.message);
      console.log("Using localStorage only - app will work offline");
      resolve({ available: false, reason: error.message });
    }
  });
}

// ============================================
// Sync Status Management
// ============================================

const SyncManager = {
  isOnline: navigator.onLine,
  firebaseAvailable: false,
  firebaseInitResult: null,
  syncInProgress: false,
  lastSyncTime: null,
  storageMode: 'local', // 'local', 'firebase', or 'hybrid'
  
  // Initialize sync manager
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
      console.log("Connection restored");
      this.updateStorageMode();
      // Try to sync if Firebase was previously available
      if (this.firebaseAvailable) {
        console.log("Syncing with Firebase...");
        this.syncAll();
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.storageMode = 'local';
      console.log("Offline mode - using localStorage");
      this.updateStatusIndicator();
    });
    
    console.log("SyncManager initialized. Mode:", this.storageMode, "Firebase:", this.firebaseAvailable, "Online:", this.isOnline);
    
    // Update any status indicators in the UI
    this.updateStatusIndicator();
    
    return this;
  },
  
  // Update storage mode based on connectivity
  updateStorageMode() {
    if (this.firebaseAvailable && this.isOnline) {
      this.storageMode = 'firebase';
    } else {
      this.storageMode = 'local';
    }
    this.updateStatusIndicator();
  },
  
  // Update UI status indicators
  updateStatusIndicator() {
    // Find and update status indicators
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
    
    // Update storage mode display
    const modeDisplays = document.querySelectorAll('[data-storage-mode]');
    modeDisplays.forEach(el => {
      el.textContent = this.storageMode === 'firebase' ? 'Cloud Mode' : 'Local Mode';
    });
  },
  
  // Get current sync status
  getStatus() {
    return {
      online: this.isOnline,
      firebase: this.firebaseAvailable,
      storageMode: this.storageMode,
      lastSync: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      initResult: this.firebaseInitResult
    };
  },
  
  // ============================================
  // Core Data Operations
  // ============================================
  
  // Load all data (from Firebase first if available, else localStorage)
  async loadData() {
    let store = this.getLocalData();
    
    if (this.firebaseAvailable && this.isOnline) {
      try {
        console.log("Loading data from Firebase...");
        const firebaseData = await this.loadFromFirebase();
        if (firebaseData && Object.keys(firebaseData).length > 0) {
          // Check if Firebase has newer data
          const localTime = store._lastModified ? new Date(store._lastModified) : new Date(0);
          const firebaseTime = firebaseData._lastModified ? new Date(firebaseData._lastModified) : new Date(0);
          
          if (firebaseTime > localTime) {
            console.log("Firebase data is newer, using Firebase data");
            store = firebaseData;
            // Save to localStorage as backup
            this.saveLocalData(store);
          } else {
            console.log("Local data is newer or equal, using local data");
            // Push local data to Firebase
            await this.saveToFirebase(store);
          }
        }
      } catch (error) {
        console.error("Error loading from Firebase:", error);
      }
    }
    
    // Ensure default structure
    return this.ensureDefaultStructure(store);
  },
  
  // Save all data (to both localStorage and Firebase)
  async saveData(store) {
    // Add timestamp for conflict resolution
    store._lastModified = new Date().toISOString();
    
    // Always save to localStorage
    this.saveLocalData(store);
    
    // Save to Firebase if available and online
    if (this.firebaseAvailable && this.isOnline) {
      try {
        await this.saveToFirebase(store);
        this.lastSyncTime = new Date();
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime.toISOString());
      } catch (error) {
        console.error("Error saving to Firebase:", error);
      }
    }
  },
  
  // Quick save (for frequent operations like grade entry)
  async quickSave(store) {
    store._lastModified = new Date().toISOString();
    this.saveLocalData(store);
    
    if (this.firebaseAvailable && this.isOnline && !this.syncInProgress) {
      this.syncToFirebaseDebounced(store);
    }
  },
  
  // ============================================
  // localStorage Operations
  // ============================================
  
  getLocalData() {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Error parsing localStorage data:", e);
      }
    }
    return null;
  },
  
  saveLocalData(store) {
    localStorage.setItem(DB_KEY, JSON.stringify(store));
  },
  
  // ============================================
  // Firebase Operations
  // ============================================
  
  async loadFromFirebase() {
    if (!this.firebaseAvailable || !db) return null;
    
    try {
      const store = {};
      
      // Load collections
      const collections = ['courses', 'students', 'enrollments', 'assessments', 'groups'];
      for (const col of collections) {
        const snapshot = await db.collection(col).get();
        store[col] = [];
        snapshot.forEach(doc => {
          store[col].push(doc.data());
        });
      }
      
      // Load grades (object, not array)
      const gradesSnapshot = await db.collection('grades').get();
      store.grades = {};
      gradesSnapshot.forEach(doc => {
        const data = doc.data();
        const id = data.id;
        delete data.id;
        store.grades[id] = data;
      });
      
      // Load settings
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
      // Save collections
      const collections = ['courses', 'students', 'enrollments', 'assessments', 'groups'];
      
      for (const col of collections) {
        if (store[col] && Array.isArray(store[col])) {
          // Clear and repopulate collection
          const snapshot = await db.collection(col).get();
          const deletes = snapshot.docs.map(d => d.ref.delete());
          await Promise.all(deletes);
          
          if (store[col].length > 0) {
            const adds = store[col].map(item => db.collection(col).add(item));
            await Promise.all(adds);
          }
        }
      }
      
      // Save grades
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
      
      // Save settings
      if (store.hps) await db.collection('settings').doc('hps').set(store.hps);
      if (store.weights) await db.collection('settings').doc('weights').set(store.weights);
      if (store.gradingScale) await db.collection('settings').doc('gradingScale').set({ scale: store.gradingScale });
      
      console.log("Data synced to Firebase successfully");
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    } finally {
      this.syncInProgress = false;
    }
  },
  
  // Debounced sync to prevent too many Firebase writes
  syncToFirebaseDebounced: (function() {
    let timeout = null;
    return function(store) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        SyncManager.saveToFirebase(store);
      }, 2000); // Wait 2 seconds after last change
    };
  })(),
  
  // ============================================
  // Full Sync (both directions)
  // ============================================
  
  async syncAll() {
    if (!this.isOnline || !this.firebaseAvailable) {
      console.log("Cannot sync: offline or Firebase unavailable");
      return;
    }
    
    const localData = this.getLocalData();
    const firebaseData = await this.loadFromFirebase();
    
    if (!localData && firebaseData) {
      // Only Firebase has data - use Firebase
      this.saveLocalData(firebaseData);
    } else if (localData && !firebaseData) {
      // Only local has data - push to Firebase
      await this.saveToFirebase(localData);
    } else if (localData && firebaseData) {
      // Both have data - merge with last-write-wins
      const merged = this.mergeData(localData, firebaseData);
      this.saveLocalData(merged);
      await this.saveToFirebase(merged);
    }
    
    this.lastSyncTime = new Date();
    localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime.toISOString());
  },
  
  // Merge data from both sources (last-write-wins)
  mergeData(local, remote) {
    const merged = { ...local };
    const localTime = local._lastModified ? new Date(local._lastModified) : new Date(0);
    const remoteTime = remote._lastModified ? new Date(remote._lastModified) : new Date(0);
    
    if (remoteTime > localTime) {
      // Remote is newer - prefer remote data but keep unique local items
      Object.keys(remote).forEach(key => {
        if (key !== '_lastModified') {
          merged[key] = remote[key];
        }
      });
    }
    
    merged._lastModified = new Date().toISOString();
    return merged;
  },
  
  // ============================================
  // Export/Import for Manual Backup
  // ============================================
  
  // Export data as JSON file
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
    
    console.log("Data exported successfully");
    return true;
  },
  
  // Import data from JSON file
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Validate basic structure
          if (!importedData.courses || !importedData.students) {
            reject(new Error("Invalid backup file format"));
            return;
          }
          
          // Save to localStorage
          this.saveLocalData(importedData);
          
          // If Firebase is available, also sync to Firebase
          if (this.firebaseAvailable && this.isOnline) {
            this.saveToFirebase(importedData);
          }
          
          console.log("Data imported successfully");
          resolve(importedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  },
  
  // ============================================
  // Default Data Structure
  // ============================================
  
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

// ============================================
// Export for use in HTML files
// ============================================

window.SyncManager = SyncManager;
window.DB_KEY = DB_KEY;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await SyncManager.init();
});

