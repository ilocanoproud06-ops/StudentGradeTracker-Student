# Plan: Dual Storage Sync (localStorage + Firebase)

## Information Gathered:
- Current project has Firebase integration but basic fallback to localStorage only
- Files to update: admin_portal.html, student.html
- Key features needed: bidirectional sync, offline support, conflict resolution

## Plan:

### Phase 1: Core Sync Engine
1. Create unified syncManager in firebase-config.js with:
   - localStorage operations (read/write)
   - Firebase Firestore operations  
   - Smart sync logic with timestamps
   - Conflict resolution (last-write-wins with timestamp tracking)

### Phase 2: Update admin_portal.html
1. Import syncManager
2. Replace direct localStorage calls with syncManager
3. Add sync status indicator in UI
4. Add manual sync button for admin

### Phase 3: Update student.html  
1. Import syncManager
2. Replace localStorage with syncManager
3. Add connection status indicator
4. Enable real-time Firebase listeners for live updates

### Phase 4: Testing & Edge Cases
1. Offline mode handling
2. Sync conflict resolution
3. Initial data load strategy

## Files to Edit:
- firebase-config.js (new - create shared sync manager)
- admin_portal.html (update sync calls)
- student.html (update sync calls)

## Followup Steps:
- Test locally with Firebase emulator or test project
- Deploy to GitHub Pages
- Test offline/online transitions

