# Plan: Remove HPS Section from Grade Entry

## Status: ✅ COMPLETED

## Completed Tasks
- ✅ Removed "3. HPS per Assessment Type" section from Grade Entry in admin_portal.html
- ✅ The HPS configuration now only comes from "Assessment & HPS" section
- ✅ Committed and pushed changes to GitHub (branch: main)

## Information Gathered
- **admin_portal.html** contains the "Grade Entry" section with an HPS configuration section
- There are **3 sections** related to assessments/grades:
  1. **Grade Entry** - Contains "3. HPS per Assessment Type" section (to be removed)
  2. **Assessment Entry** - For adding new assessments
  3. **Assessment & HPS** - For configuring HPS per assessment

- The HPS section in Grade Entry (id="hpsSection") is redundant because:
  - Assessment & HPS section already handles HPS configuration
  - The data flows from Assessment & HPS → Grade Entry

- **Git Status**: Working tree is clean, on main branch
- **Firebase**: Configured with Firestore (projectId: studentgradetracker-e04c0)

## Plan

### Step 1: Remove HPS Section from Grade Entry
- Remove the entire card with `id="hpsSection"` from the Grade Entry section in admin_portal.html
- This includes:
  - Quiz HPS configuration
  - Laboratory HPS (PT) configuration  
  - Project HPS configuration
- Keep the "Grade Entry" title and structure, just remove the HPS card

### Step 2: Verify Related Functions
- Check if there are any JavaScript functions that reference the removed HPS section
- Ensure Grade Entry still works with HPS data from Assessment & HPS section

### Step 3: Commit and Push to GitHub
- Add changes to git
- Commit with appropriate message
- Push to origin/main

### Step 4: Firebase Sync (if applicable)
- Check if there's Firebase sync code needed
- Ensure the application works properly after changes

## Dependent Files to be Edited
- `admin_portal.html` - Main file to edit

## Followup Steps
1. Test the Grade Entry functionality works without the HPS section
2. Verify Assessment & HPS section properly feeds HPS data to Grade Entry

