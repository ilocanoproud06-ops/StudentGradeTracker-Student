# Plan: GitHub Pages Deployment with Firebase Alternative

## Information Gathered:
- Current project has Firebase integration with localStorage fallback
- Application uses Firestore for cloud sync
- Problem: Firebase may not work on restricted networks (schools, etc.)
- Goal: Make app fully functional on GitHub Pages without Firebase dependency

## Plan:

### Phase 1: Core Fallback Engine
1. Update firebase-config.js to include:
   - Network detection with try-catch for Firebase init
   - Graceful degradation to localStorage-only mode
   - Visual status indicators for Firebase/localStorage mode
   - Manual sync buttons for data export/import

### Phase 2: Update admin_portal.html
1. Add network status indicator in header
2. Add "Firebase Mode" / "Local Mode" badge
3. Add manual sync button (export/import JSON)
4. Make app work without Firebase initialization

### Phase 3: Update student.html  
1. Add connection status indicator
2. Make student portal work offline/localStorage
3. Add data refresh mechanism

### Phase 4: GitHub Pages Compatibility
1. Ensure all relative paths work
2. Remove any server-specific dependencies
3. Test offline functionality

## Files to Edit:
- firebase-config.js (update with fallback logic)
- admin_portal.html (add status indicators, remove Firebase dependency)
- student.html (add status indicators, remove Firebase dependency)

## Followup Steps:
- Deploy to GitHub Pages
- Test without network
- Test data persistence
