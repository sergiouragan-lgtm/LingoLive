# LingoLive Cloud Functions Documentation

## Overview

This directory contains Firebase Cloud Functions for LingoLive's B2B school management platform. The functions handle CRUD operations, automated workflows, and event-driven triggers for classrooms and student enrollment.

---

## Core Cloud Functions

### 1. `onClassroomCreated` (Firestore Trigger)

**Trigger Path:** `schools/{schoolId}/classrooms/{classroomId}`

**Event:** Document creation in Firestore

**Description:**
When a new classroom is created, this function automatically initializes all related data structures to ensure the classroom is ready for student enrollment.

**What It Does:**
- ✅ Creates classroom **metadata** (total students, lessons completed, words learned)
- ✅ Creates classroom **analytics** document (weekly activity, engagement score, top performers)
- ✅ Creates classroom **settings** (language, difficulty level, feature toggles)
- ✅ Creates empty **students** subcollection marker with metadata

**Data Structure Created:**
```
schools/{schoolId}/classrooms/{classroomId}/
├── metadata/
│   └── stats
│       ├── totalStudents: number
│       ├── totalLessonsCompleted: number
│       ├── totalWordsLearned: number
│       ├── averageScore: number
│       └── timestamps
├── analytics/
│   └── overview
│       ├── weeklyActiveStudents: number
│       ├── monthlyLessonsCompleted: number
│       ├── engagementScore: number
│       ├── averageStreakDays: number
│       └── topPerformers: string[]
├── settings/
│   └── config
│       ├── language: string
│       ├── difficulty: string
│       ├── allowStudentGroups: boolean
│       ├── enableGamification: boolean
│       └── enablePeerFeedback: boolean
└── students/
    └── _metadata (tracks student count)
```

**Example Usage (Client-Side):**
```typescript
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const createClassroom = async (schoolId: string, name: string, teacherUid: string) => {
  const classroomRef = collection(db, 'schools', schoolId, 'classrooms');
  return await addDoc(classroomRef, {
    id: '', // Will be generated
    name,
    teacherUid,
    schoolId,
    studentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
```

---

### 2. `onStudentEnrolled` (Firestore Trigger)

**Trigger Path:** `schools/{schoolId}/classrooms/{classroomId}/students/{studentId}`

**Event:** Document creation in the students subcollection

**Description:**
When a student is added to a classroom, this function initializes all tracking and achievement structures for that student.

**What It Does:**
- ✅ Creates student **progress** record (words learned, lessons completed, average score)
- ✅ Creates student **streak** tracking (current streak, longest streak, total days active)
- ✅ Creates student **achievements** document with initial achievement state
- ✅ Creates student **assessment** history tracker
- ✅ Increments classroom **student count** metadata
- ✅ Updates classroom **total students** analytics

**Data Structure Created:**
```
schools/{schoolId}/classrooms/{classroomId}/
├── studentProgress/{studentId}
│   ├── studentUid: string
│   ├── classId: string
│   ├── wordsLearned: number
│   ├── lessonsCompleted: number
│   ├── averageScore: number
│   ├── streakDays: number
│   └── lastActivityDate: Timestamp
├── studentStreaks/{studentId}
│   ├── currentStreak: number
│   ├── longestStreak: number
│   ├── lastActivityDate: Timestamp
│   ├── totalDaysActive: number
│   └── timestamps
├── studentAchievements/{studentId}
│   ├── studentUid: string
│   ├── unlockedAchievements: string[]
│   └── achievements (8 built-in achievements)
│       ├── firstLesson
│       ├── tenLessons
│       ├── fiftyLessons
│       ├── oneHundredLessons
│       ├── sevenDayStreak
│       ├── thirtyDayStreak
│       ├── vocabularyMaster
│       └── speakingExpert
└── studentAssessments/{studentId}
    ├── studentUid: string
    ├── assessmentHistory: Assessment[]
    ├── latestScore: number
    ├── averageScore: number
    ├── totalAssessments: number
    └── cefrLevel: string
```

**Example Usage (Client-Side):**
```typescript
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const enrollStudent = async (
  schoolId: string,
  classroomId: string,
  studentUid: string,
  name: string,
  email: string
) => {
  const studentsRef = collection(db, 'schools', schoolId, 'classrooms', classroomId, 'students');
  return await addDoc(studentsRef, {
    uid: studentUid,
    name,
    email,
    schoolId,
    classId: classroomId,
    cefrLevel: 'A1',
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
```

---

## HTTP Cloud Functions (CRUD Endpoints)

### Classroom Management

#### **POST /classrooms** - Create Classroom
Creates a new classroom in a school.

**Request Body:**
```json
{
  "schoolId": "school_123",
  "name": "7A - Advanced English",
  "teacherUid": "teacher_456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Classroom created successfully",
  "data": {
    "classroomId": "classroom_789",
    "id": "classroom_789",
    "name": "7A - Advanced English",
    "teacherUid": "teacher_456",
    "schoolId": "school_123",
    "studentCount": 0,
    "createdAt": "2026-09-21T17:55:00Z",
    "updatedAt": "2026-09-21T17:55:00Z"
  }
}
```

#### **PUT /classrooms/{classroomId}** - Update Classroom
Updates classroom details (name, teacher assignment).

**Request Body:**
```json
{
  "classroomId": "classroom_789",
  "schoolId": "school_123",
  "name": "7A - Advanced English (Updated)",
  "teacherUid": "teacher_999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Classroom updated successfully",
  "data": {
    "classroomId": "classroom_789",
    "name": "7A - Advanced English (Updated)",
    "teacherUid": "teacher_999",
    "updatedAt": "2026-09-21T17:56:00Z"
  }
}
```

#### **DELETE /classrooms/{classroomId}** - Delete Classroom
Deletes a classroom and all its subcollections.

**Request Body:**
```json
{
  "classroomId": "classroom_789",
  "schoolId": "school_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Classroom deleted successfully",
  "data": {
    "classroomId": "classroom_789"
  }
}
```

#### **GET /classrooms/{classroomId}** - Get Classroom Details
Retrieves classroom information including actual student count.

**Request Body:**
```json
{
  "schoolId": "school_123",
  "classroomId": "classroom_789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Classroom retrieved successfully",
  "data": {
    "id": "classroom_789",
    "name": "7A - Advanced English",
    "teacherUid": "teacher_456",
    "schoolId": "school_123",
    "studentCount": 25,
    "actualStudentCount": 25,
    "createdAt": "2026-09-21T17:55:00Z",
    "updatedAt": "2026-09-21T17:55:00Z"
  }
}
```

#### **GET /schools/{schoolId}/classrooms** - List All Classrooms
Lists all classrooms in a school.

**Request Body:**
```json
{
  "schoolId": "school_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Classrooms retrieved successfully",
  "data": {
    "total": 5,
    "classrooms": [
      { "id": "classroom_789", "name": "7A - Advanced English", ... },
      { "id": "classroom_790", "name": "8B - Intermediate", ... }
    ]
  }
}
```

### Student Management

#### **POST /classrooms/{classroomId}/students** - Add Student to Classroom
Enrolls a student in a classroom.

**Request Body:**
```json
{
  "schoolId": "school_123",
  "classroomId": "classroom_789",
  "studentUid": "student_001",
  "name": "João Silva",
  "email": "joao@school.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student added to classroom successfully",
  "data": {
    "studentUid": "student_001",
    "classroomId": "classroom_789",
    "uid": "student_001",
    "name": "João Silva",
    "email": "joao@school.com",
    "schoolId": "school_123",
    "classId": "classroom_789",
    "cefrLevel": "A1",
    "createdAt": "2026-09-21T17:57:00Z",
    "updatedAt": "2026-09-21T17:57:00Z"
  }
}
```

**What happens automatically:**
- Triggers `onStudentEnrolled` function
- Creates progress, streak, achievements, and assessment records
- Increments classroom student count

#### **DELETE /classrooms/{classroomId}/students/{studentId}** - Remove Student from Classroom
Unenrolls a student and cleans up all related records.

**Request Body:**
```json
{
  "schoolId": "school_123",
  "classroomId": "classroom_789",
  "studentId": "student_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student removed from classroom successfully",
  "data": {
    "studentId": "student_001",
    "classroomId": "classroom_789"
  }
}
```

**What happens automatically:**
- Deletes student document
- Deletes associated progress, streaks, achievements, assessments
- Decrements classroom student count
- Updates analytics metadata

---

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│  Client Creates Classroom               │
│  POST /classrooms                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Classroom Document Created in Firestore│
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  onClassroomCreated Trigger Fires       │
│  ✓ Creates metadata subcollection       │
│  ✓ Creates analytics subcollection      │
│  ✓ Creates settings subcollection       │
│  ✓ Initializes students subcollection   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Client Adds Student to Classroom       │
│  POST /classrooms/{id}/students         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Student Document Created in            │
│  students Subcollection                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  onStudentEnrolled Trigger Fires        │
│  ✓ Creates progress record              │
│  ✓ Creates streak tracker               │
│  ✓ Creates achievements                 │
│  ✓ Creates assessment history           │
│  ✓ Updates classroom metrics            │
└─────────────────────────────────────────┘
```

---

## Error Handling

All functions return consistent error responses:

```json
{
  "success": false,
  "message": "Operation failed",
  "error": "Detailed error message",
  "timestamp": "2026-09-21T17:58:00Z"
}
```

**Common HTTP Status Codes:**
- `201` - Created successfully
- `200` - Retrieved/updated successfully
- `400` - Bad request (missing/invalid fields)
- `404` - Resource not found
- `500` - Server error

---

## Security Rules

Firestore security rules should be configured to:
1. Allow authenticated teachers to create classrooms in their school
2. Allow authenticated students to view their own progress/assessments
3. Allow school admins to manage all classrooms and students
4. Prevent direct writes to metadata/analytics collections (Cloud Functions only)

Example rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schools/{schoolId}/classrooms/{classroomId} {
      allow create: if request.auth.uid != null;
      allow read: if request.auth.uid != null;
      allow update: if request.auth.uid != null;
      allow delete: if request.auth.uid != null;
      
      match /students/{studentId} {
        allow create: if request.auth.uid != null;
        allow read: if request.auth.uid != null;
        allow delete: if request.auth.uid != null;
      }
      
      match /studentProgress/{studentId} {
        allow read: if request.auth.uid == studentId || request.auth.uid != null;
      }
    }
  }
}
```

---

## Testing

### Firebase Emulator Suite

Run Cloud Functions locally:
```bash
firebase emulators:start --only firestore,functions
```

### Manual Testing with curl

```bash
# Create classroom
curl -X POST http://localhost:5000/lingolive-ia-f5778/us-central1/createClassroom \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school_123",
    "name": "7A - English",
    "teacherUid": "teacher_456"
  }'

# Add student
curl -X POST http://localhost:5000/lingolive-ia-f5778/us-central1/addStudentToClassroom \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school_123",
    "classroomId": "classroom_789",
    "studentUid": "student_001",
    "name": "João",
    "email": "joao@school.com"
  }'
```

---

## Deployment

Deploy all Cloud Functions:
```bash
firebase deploy --only functions
```

Deploy specific function:
```bash
firebase deploy --only functions:onClassroomCreated
```

---

## Monitoring

Monitor Cloud Functions in Firebase Console:
- **Logs:** View execution logs and errors
- **Performance:** Monitor latency and error rates
- **Quotas:** Track function invocations and costs

---

## Future Enhancements

- [ ] Bulk enrollment with CSV import
- [ ] Classroom templates for quick setup
- [ ] Automated cleanup of archived classrooms
- [ ] Student progress webhooks
- [ ] Export student data to CSV
- [ ] Classroom analytics dashboard

---

## Support

For issues or questions:
1. Check Firebase Cloud Functions documentation: https://firebase.google.com/docs/functions
2. Review CloudFunctions logs in Firebase Console
3. Test with Firebase Emulator Suite locally first

