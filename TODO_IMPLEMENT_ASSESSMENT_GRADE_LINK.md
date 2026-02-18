# Implementation: Auto-populate Grade Entry from Assessment & HPS

## Task: When admin creates assessments in Assessment & HPS, those should auto-populate in Grade Entry

## Steps to Complete:

- [x] 1. Create helper function `getAssessmentDataForCourse(courseId, type)` to fetch assessments and HPS
- [x] 2. Modify `selectStudentForGrade(studentId)` to use assessment titles from Assessment & HPS
- [x] 3. Update quiz input fields rendering to use assessment titles as labels
- [x] 4. Update PT input fields rendering to use assessment titles as labels
- [x] 5. Update Project input fields rendering to use assessment titles as labels
- [x] 6. Update Written Exam input fields to use assessment titles as labels
- [x] 7. Update `renderGradeEntryTable()` to show dynamic titles in the scores column
- [x] 8. Update `saveStudentGrade()` to handle dynamic number of assessments

## Key Changes:
- Use `store.assessments` for assessment titles
- Use `store.hps.perAssessment[courseKey]` for HPS values
- Update all grade input rendering functions to fetch data from Assessment & HPS
- Show HPS values as max score in placeholders
- Dynamic number of PT and Project fields based on Assessment & HPS configuration


