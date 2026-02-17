# Implementation Plan: Fixing admin_portal.html

## Issues to Fix:

### 1. JavaScript Syntax Error in saveGrades function
- **Problem**: The function definition is malformed - `function saveGrades() {` is missing the `function` keyword
- **Location**: Around line 1847 in admin_portal.html
- **Fix**: Properly structure the saveGrades function

### 2. Add Group Management Section
- **Problem**: Nav item exists but section doesn't exist in HTML
- **Location**: Need to add new section after assessmentSection
- **Fix**: Add Group Management UI section with:
  - Add/Edit/Delete groups
  - Assign students to groups
  - Store groups in localStorage

### 3. Add Project Name/Date Fields for Lab Courses
- **Problem**: Need to add project name and date fields in PT/Lab section
- **Location**: PT Grades section in gradesSection
- **Fix**: Add input fields for project title and date

## Implementation Steps:
1. Fix saveGrades function syntax
2. Add Group Management section HTML and JavaScript
3. Add project name/date fields to PT section
4. Update student.html to display groups

