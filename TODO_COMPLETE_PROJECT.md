# Plan: Complete StudentGradeTracker + Create LiteLLM Backend

## Status: IN PROGRESS

## Task 1: Fix LiteLLM Backend (NEW)

### Issue:
- Error: `tool result's tool id(call_function_sf30ozr7ho0p_1) not found`
- Root cause: Invalid tool ID reference in function calling
- Fallback also failed

### Solution:
- Create a proper FastAPI backend with LiteLLM
- Fix tool calling implementation
- Add proper fallback handling

### Files to Create:
- `backend/main.py` - FastAPI server with LiteLLM
- `backend/requirements.txt` - Python dependencies
- `backend/.env.example` - Environment variables template

---

## Task 2: Complete Pending StudentGradeTracker Tasks

### TODO_RESTORE_ASSESSMENT.md - Pending:
- [ ] 1. Add deletedAssessments array to store initialization
- [ ] 2. Modify deleteAssessment() to move items to trash instead of permanent delete
- [ ] 3. Add restoreAssessment() function
- [ ] 4. Add emptyTrashAssessment() function
- [ ] 5. Add "Trash" section UI in Assessment & HPS area
- [ ] 6. Add renderDeletedAssessments() function
- [ ] 7. Add "Trash" nav item to sidebar
- [ ] 8. Test functionality

### FIX_PLAN.md - Pending:
- [ ] Fix saveGrades function syntax
- [ ] Add Group Management section
- [ ] Add project name/date fields

### TODO_AUTO_SYNC.md - Pending:
- [ ] Commit and push to GitHub repos
- [ ] Enable GitHub Pages

---

## Task 3: Link Everything Together

- Connect frontend to backend API
- Ensure GitHub Pages works with the system
- Test the integration

---

## Dependent Files:
- `admin_portal.html` - For assessment restore and fixes
- `student.html` - For group management display
- `data.json` - Sample data
- `firebase-config.js` - Configuration

## Followup Steps:
1. Create backend directory and files
2. Test LiteLLM backend
3. Complete pending admin_portal.html fixes
4. Push to GitHub and verify GitHub Pages

