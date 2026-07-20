 # Admin Panel API Reference

Base URL prefix: `/api/v1/`
Auth header: `Authorization: Token <token>`
Login as admin/moderator uses the same endpoint as students: `POST auth/login/` → `{ "email", "password" }` → `{ "token", "user" }`.

Each module below shows: **who can access it** (Admin/Super Admin always can; the moderator permission flag needed is listed), the endpoints, and example input/output JSON.

---

## 1. Admin Dashboard

### GET admin/dashboard/
Access: Admin/Super Admin, or moderator with `can_view_dashboard`
```json
{
  "students": { "total": 500, "active": 480, "new_last_30_days": 30 },
  "courses": { "total": 20, "published": 15 },
  "exams": { "total": 40, "total_attempts": 3000, "pending_results": 2, "average_percentile": 62.35 },
  "ecommerce": { "total_books": 12, "total_orders": 200, "paid_orders": 180, "pending_orders": 5, "revenue": "150000.00" },
  "content": { "teachers": 8, "reviews": 40, "success_stories": 15 }
}
```

### GET moderator/dashboard/
Access: any moderator (shows only granted modules)
```json
{
  "welcome": { "name": "Mod One", "role": "moderator" },
  "permissions": ["can_view_dashboard", "can_view_courses"],
  "modules": { "courses": { "total": 20, "published": 15 } }
}
```

---

## 2. Student Management

### GET admin/students/
Access: Admin/Super Admin (`can_view_students` for moderators is **not wired to this route** — student CRUD is admin-only; moderators use `can_view_students` only for the dashboard stat)
Query params: `?is_active=true&is_verified=false&search=rahim&ordering=-created_at`
```json
{
  "count": 500, "next": "...?page=2", "previous": null,
  "results": [
    {
      "id": 3, "email": "student@domain.com", "full_name": "Rahim Uddin", "phone": "01700000000",
      "role": "student", "profile_image": null, "is_active": true, "is_verified": false,
      "created_at": "2026-07-01T10:00:00Z",
      "student_profile": { "batch": "2026", "session": "2025-26", "institution": "XYZ College", "admission_unit": "A Unit", "group": "Science", "address": "Chittagong", "guardian_phone": "01800000000", "extra": {} }
    }
  ]
}
```

### POST admin/students/
Input:
```json
{
  "email": "newstudent@domain.com",
  "full_name": "Karim Ahmed",
  "phone": "01711111111",
  "password": "SecurePass123",
  "is_verified": true
}
```
Output (201): student object (role forced to `student`).

### GET admin/students/{id}/
Output: single student object (same shape as list item).

### PATCH / PUT admin/students/{id}/
Input: any subset of `full_name, phone, profile_image, is_verified` (role/id/created_at read-only).
Output: updated student object.

### DELETE admin/students/{id}/
Output: `204 No Content`.

### POST admin/students/{id}/deactivate/
Output:
```json
{ "detail": "Student deactivated." }
```
(Also deletes the student's auth token — forces logout.)

### POST admin/students/{id}/reactivate/
Output:
```json
{ "detail": "Student reactivated." }
```

### POST admin/students/{id}/promote-to-moderator/
Changes an existing student's `role` to `moderator` in place — same id, same login (email/password/token untouched). Creates a `ModeratorPermission` row with every flag defaulting to `false`. The user then shows up in `admin/moderators/` and drops out of `admin/students/`; their student-specific data (enrollments, exam attempts, etc.) is left untouched.
Output (200): moderator object, same shape as `GET admin/moderators/{id}/` (see section 3) — `permissions` all `false`.
`400 { "detail": "This user is already a moderator or admin." }` if not currently a student. `404` if the id doesn't exist.

---

## 3. Moderator Management (Admin / Super Admin only)

### GET admin/moderators/
Query params: `?search=mod&ordering=created_at`
```json
{
  "count": 5, "next": null, "previous": null,
  "results": [
    {
      "id": 5, "email": "mod@domain.com", "full_name": "Mod One", "phone": "",
      "is_active": true, "is_verified": false, "created_at": "...",
      "permissions": {
        "user": 5, "granted": ["can_view_dashboard", "can_view_courses"],
        "can_view_dashboard": true, "can_view_students": false,
        "can_create_student": false, "can_edit_student": false, "can_delete_student": false,
        "can_view_course_enrollments": false, "can_view_courses": true, "can_create_course": false,
        "can_edit_course": false, "can_delete_course": false, "can_publish_course": false,
        "can_view_live_classes": false, "can_create_live_class": false, "can_edit_live_class": false,
        "can_delete_live_class": false, "can_view_recorded_classes": false, "can_manage_course_resources": false,
        "can_view_exams": false, "can_create_exam": false, "can_edit_exam": false, "can_delete_exam": false,
        "can_add_exam_questions": false, "can_publish_exam": false, "can_publish_result": false,
        "can_view_results": false, "can_view_leaderboard": false,
        "can_manage_assignments": false, "can_evaluate_assignments": false,
        "can_view_books": false, "can_create_book": false, "can_edit_book": false, "can_delete_book": false,
        "can_view_orders": false, "can_update_order_status": false,
        "can_manage_notices": false, "can_manage_teachers": false, "can_manage_reviews": false,
        "can_manage_faq": false, "can_manage_home_content": false, "can_manage_static_pages": false
      }
    }
  ]
}
```

### POST admin/moderators/
Input:
```json
{
  "email": "newmod@domain.com",
  "full_name": "New Moderator",
  "phone": "01722222222",
  "password": "SecurePass123"
}
```
Output (201): moderator object as above — **every permission flag starts `false`**.

### GET admin/moderators/{id}/
Output: single moderator object.

### PATCH / PUT admin/moderators/{id}/
Input: `full_name, phone, is_verified` etc.
Output: updated moderator object.

### DELETE admin/moderators/{id}/
Output: `204 No Content`.

### GET admin/moderators/{id}/permissions/
Output: the `permissions` object shown above.

### PUT / PATCH admin/moderators/{id}/permissions/
Input (grant/revoke specific flags — PATCH = partial):
```json
{
  "can_view_dashboard": true,
  "can_view_courses": true,
  "can_create_course": true,
  "can_view_exams": true
}
```
Output: full updated `permissions` object, `granted` array recomputed.

### POST admin/moderators/{id}/deactivate/  |  reactivate/
Output: `{ "detail": "Moderator deactivated." }` / `{ "detail": "Moderator reactivated." }`

### GET admin/moderators/permission_catalog/
Output:
```json
{ "permissions": ["can_view_dashboard", "can_view_students", "..."] }
```

### GET admin/moderator-permission-catalog/  (grouped, for building the permission-assignment UI)
Output:
```json
{
  "all_permissions": ["can_view_dashboard", "..."],
  "groups": [
    { "group": "Dashboard", "permissions": ["can_view_dashboard"] },
    { "group": "Students", "permissions": ["can_view_students", "can_create_student", "can_edit_student", "can_delete_student", "can_view_course_enrollments"] },
    { "group": "Courses", "permissions": ["can_view_courses", "can_create_course", "can_edit_course", "can_delete_course", "can_publish_course"] },
    { "group": "Classes", "permissions": ["can_view_live_classes", "can_create_live_class", "can_edit_live_class", "can_delete_live_class", "can_view_recorded_classes", "can_manage_course_resources"] },
    { "group": "Exams", "permissions": ["can_view_exams", "can_create_exam", "can_edit_exam", "can_delete_exam", "can_add_exam_questions", "can_publish_exam", "can_publish_result", "can_view_results", "can_view_leaderboard"] },
    { "group": "Assignments", "permissions": ["can_manage_assignments", "can_evaluate_assignments"] },
    { "group": "Books & Orders", "permissions": ["can_view_books", "can_create_book", "can_edit_book", "can_delete_book", "can_view_orders", "can_update_order_status"] },
    { "group": "Content", "permissions": ["can_manage_notices", "can_manage_teachers", "can_manage_reviews", "can_manage_faq", "can_manage_home_content", "can_manage_static_pages"] }
  ]
}
```

### POST admin/users/create/  (create another Admin — Super Admin only)
Input:
```json
{
  "email": "admin2@domain.com",
  "full_name": "Second Admin",
  "phone": "01733333333",
  "role": "admin",
  "password": "SecurePass123",
  "is_verified": true
}
```
Output (201): user object. (`400` if a non-Super-Admin tries to set `role: admin` or `super_admin`.)

### GET my-permissions/
Access: any logged-in admin/moderator (self-check)
```json
{ "role": "moderator", "all_access": false, "permissions": ["can_view_courses", "can_view_exams"] }
```

---

## 4. Course Management
Flags: `can_view_courses`, `can_create_course`, `can_edit_course`, `can_delete_course`, `can_publish_course`

### GET admin/courses/
Query params: `?category=1&is_published=true&is_free=false&search=physics`
```json
{
  "count": 20, "next": null, "previous": null,
  "results": [
    {
      "id": 5, "title": "HSC Physics Batch", "slug": "hsc-physics-batch", "category": 1,
      "short_description": "...", "full_description": "...", "why_needed": "...",
      "thumbnail": "url", "cover_image": "url", "promo_video_url": "...",
      "syllabus_pdf": "url", "syllabus_drive_link": "...",
      "price": "1000.00", "old_price": "1500.00", "discount": "33.00",
      "is_free": false, "is_published": true, "enrollment_count": 120,
      "batch_start_date": "2026-08-01", "class_start_date": "2026-08-05",
      "level": "beginner", "duration": "6 months", "total_classes": 40,
      "total_quizzes": 10, "total_assignments": 5,
      "subjects": [
        { "id": 10, "course": 5, "name": "Physics", "ordering": 0 },
        { "id": 11, "course": 5, "name": "Chemistry", "ordering": 1 }
      ]
    }
  ]
}
```
`subjects` is read-only here — the fixed subject list for a course is managed via `admin/course-subjects/` (below), not by writing to the course object directly.

### POST admin/courses/
Input:
```json
{
  "title": "HSC Physics Batch", "category": 1, "short_description": "Master HSC Physics",
  "full_description": "...", "why_needed": "...", "price": "1000.00", "old_price": "1500.00",
  "discount": "33.00", "is_free": false, "is_published": false, "level": "beginner",
  "duration": "6 months", "total_classes": 40, "total_quizzes": 10, "total_assignments": 5,
  "batch_start_date": "2026-08-01", "class_start_date": "2026-08-05"
}
```
Output (201): full course object (`slug` auto-generated, `enrollment_count` starts 0).

### GET / PATCH / PUT / DELETE admin/courses/{id}/
Same shape as above for GET/PATCH/PUT. DELETE → `204`.

### POST admin/courses/{id}/publish/
Output:
```json
{ "is_published": true }
```

### GET admin/courses/{id}/enrollments/
Output:
```json
{
  "count": 120, "next": "...", "previous": null,
  "results": [
    { "id": 1, "student": 3, "course": 5, "course_detail": { "id": 5, "title": "HSC Physics Batch", "...": "..." }, "source": "paid", "enrolled_at": "...", "is_active": true }
  ]
}
```

### Course Subjects — admin/course-subjects/ (full CRUD)
Flags: `can_view_courses` (list/retrieve), `can_create_course` (create), `can_edit_course` (update), `can_delete_course` (delete).

Each course has its own fixed list of subjects (e.g. "CU Admission Crash Course" → Bangla, English, Math, Physics). This list is what populates the `subject` dropdown when creating classes, resources, exams, and assignments under that course — `subject` is no longer free text on those objects, and the backend rejects any subject that doesn't belong to the record's course.

#### GET admin/course-subjects/
Query: `?course=5`
```json
{
  "count": 4, "next": null, "previous": null,
  "results": [
    { "id": 10, "course": 5, "name": "Physics", "ordering": 0 },
    { "id": 11, "course": 5, "name": "Bangla", "ordering": 1 }
  ]
}
```

#### POST admin/course-subjects/
Input:
```json
{ "course": 5, "name": "Chemistry", "ordering": 2 }
```
Output (201): subject object. `(course, name)` must be unique — creating a duplicate returns `400`.

#### GET / PATCH / PUT / DELETE admin/course-subjects/{id}/
Standard CRUD. Deleting a subject sets `subject` to `null` on any class/resource/exam/assignment that referenced it (it does not delete those records).

### Course Categories — `public/categories/` (read) is public; categories are created via Django admin or a dedicated endpoint if added later. Category fields for reference:
```json
{ "id": 1, "name": "HSC", "slug": "hsc", "kind": "hsc", "description": "...", "ordering": 0, "is_active": true }
```
`kind` choices: `hsc | admission | mcq_batch | science | humanities | business | free | exam_batch`

---

## 5. Live/Recorded Class Management
Flags: `can_view_live_classes`, `can_create_live_class`, `can_edit_live_class`, `can_delete_live_class`

### GET admin/classes/
Query params: `?course=5&is_live=true&status=scheduled`
```json
{
  "count": 40, "next": null, "previous": null,
  "results": [
    {
      "id": 1, "course": 5, "subject": 10, "title": "Chapter 1: Motion",
      "description": "...", "teacher": 2, "class_date": "2026-07-10",
      "start_time": "18:00:00", "end_time": "19:30:00", "status": "scheduled",
      "is_live": false, "live_url": "", "thumbnail": "url",
      "videos": [ { "id": 1, "title": "Part 1", "video_url": "https://youtube.com/...", "duration": "45:00", "source_type": "youtube", "order": 0 } ],
      "class_materials": [ { "id": 1, "title": "Slide", "file": "url", "file_url": "", "drive_link": "", "kind": "pdf", "downloadable": true } ]
    }
  ]
}
```

### POST admin/classes/
Input:
```json
{
  "course": 5, "subject": 10, "title": "Chapter 1: Motion",
  "description": "...", "teacher": 2, "class_date": "2026-07-10",
  "start_time": "18:00:00", "end_time": "19:30:00", "status": "scheduled",
  "is_live": false, "live_url": ""
}
```
`subject` must be the id of a `CourseSubject` belonging to `course` (see "Course Subjects" above) — `400` otherwise. It's optional (`null` allowed).
Output (201): class object (as above; `status` choices: `scheduled | live | completed | cancelled`).

### GET / PATCH / PUT / DELETE admin/classes/{id}/
Standard CRUD, same shape.

*(Nested `videos` / `class_materials` are managed as related objects — add via Django admin or extend with dedicated nested-create endpoints if the frontend needs direct creation.)*

---

## 6. Course Resource Management (notes, PDFs, question banks)
Flag: `can_manage_course_resources`

### GET admin/resources/
Query: `?course=5&resource_type=question_bank&is_active=true`
```json
{
  "count": 10, "next": null, "previous": null,
  "results": [
    { "id": 1, "course": 5, "title": "Question Bank 2026", "subject": 10, "resource_type": "question_bank", "file": "url", "external_link": "", "file_size": "2MB", "download_count": 15, "is_active": true, "created_at": "..." }
  ]
}
```

### POST admin/resources/
Input:
```json
{ "course": 5, "title": "Question Bank 2026", "subject": 10, "resource_type": "question_bank", "file": "<upload>", "external_link": "", "is_active": true }
```
`subject` must be the id of a `CourseSubject` belonging to `course` — `400` otherwise. It's optional (`null` allowed).
`resource_type` choices: `book | note | pdf | question_bank | magazine | short_note | link`
Output (201): resource object (`download_count` read-only, starts 0).

### GET / PATCH / PUT / DELETE admin/resources/{id}/
Standard CRUD.

---

## 7. Exam Management
Flags: `can_view_exams`, `can_create_exam`, `can_edit_exam`, `can_delete_exam`, `can_add_exam_questions`, `can_publish_exam`, `can_publish_result`, `can_view_results`, `can_view_leaderboard`

### GET admin/exams/
Query: `?course=5&status=published&result_status=hidden&search=weekly`
```json
{
  "count": 40, "next": null, "previous": null,
  "results": [
    {
      "id": 1, "course": 5, "title": "Weekly MCQ Test 1", "slug": "weekly-mcq-test-1",
      "subject": 10, "instructions": "Read carefully.",
      "total_questions": 25, "duration_minutes": 30, "total_marks": "25.00",
      "marks_per_question": "1.00", "negative_mark_per_wrong": "0.25",
      "pass_mark_percentage": "33.00", "exam_date": "2026-07-10",
      "start_time": "2026-07-10T18:00:00Z", "end_time": "2026-07-10T19:00:00Z",
      "status": "published", "result_status": "hidden",
      "result_publish_at": null, "leaderboard_publish_at": null,
      "auto_submit_on_time_end": true, "auto_submit_on_violation": true,
      "allow_late_enrolled_students": true, "created_by": 2, "published_by": 2
    }
  ]
}
```

### POST admin/exams/
Input:
```json
{
  "course": 5, "title": "Weekly MCQ Test 1", "subject": 10,
  "instructions": "Read carefully.", "duration_minutes": 30,
  "marks_per_question": "1.00", "negative_mark_per_wrong": "0.25",
  "pass_mark_percentage": "33.00", "exam_date": "2026-07-10",
  "start_time": "2026-07-10T18:00:00Z", "end_time": "2026-07-10T19:00:00Z",
  "auto_submit_on_time_end": true, "auto_submit_on_violation": true,
  "allow_late_enrolled_students": true
}
```
`subject` must be the id of a `CourseSubject` belonging to `course` — `400` otherwise. It's optional (`null` allowed).
Output (201): exam object (`slug`, `created_by`, `published_by` auto-set; `status` starts `draft`).

### GET / PATCH / PUT / DELETE admin/exams/{id}/
Standard CRUD, same shape.

### GET admin/exams/{id}/questions/
Output:
```json
[
  { "id": 1, "exam": 1, "question_text": "What is g?", "option_a": "9.8", "option_b": "10", "option_c": "9.6", "option_d": "9.9", "correct_option": "A", "explanation": "g = 9.8 m/s^2", "order": 1 }
]
```

### POST admin/exams/{id}/questions/
Input:
```json
{ "question_text": "What is g?", "option_a": "9.8", "option_b": "10", "option_c": "9.6", "option_d": "9.9", "correct_option": "A", "explanation": "g = 9.8 m/s^2 on Earth.", "order": 1 }
```
Output (201): created question object. (Automatically bumps `exam.total_questions` / `total_marks`.)

### admin/questions/  (direct CRUD alternative, filter `?exam=1`)
Same question object shape as above for GET/POST/PATCH/PUT/DELETE.

### POST admin/exams/{id}/publish/
Output: `{ "status": "published" }` — `400` if the exam has zero questions.

### POST admin/exams/{id}/publish-result/
Input (publish immediately):
```json
{}
```
Input (schedule for later + schedule leaderboard separately):
```json
{ "result_publish_at": "2026-07-11T00:00:00Z", "leaderboard_publish_at": "2026-07-12T00:00:00Z" }
```
Output:
```json
{ "result_status": "pending", "result_publish_at": "2026-07-11T00:00:00Z", "leaderboard_publish_at": "2026-07-12T00:00:00Z" }
```

### POST admin/exams/{id}/recalculate-leaderboard/
Output: `{ "detail": "Leaderboard recalculated." }`

### GET admin/exams/{id}/leaderboard/
Output:
```json
{ "rows": [ { "rank": 1, "student_id": 4, "student_name": "Karim", "final_marks": "24.00", "correct_count": 24, "wrong_count": 1, "time_taken_seconds": 900, "submitted_at": "...", "percentile": "100.00" } ] }
```

### GET admin/exams/{id}/analytics/
Output:
```json
{
  "statistics": { "total_participants": 100, "average_score": 15.4, "highest_score": 25.0, "pass_count": 80, "fail_count": 20 },
  "questions": [ { "question_id": 1, "order": 1, "total_answered_count": 95, "correct_answer_count": 70, "correct_percentage": 73.68, "correct_answer": "A", "explanation": "..." } ]
}
```

### GET admin/exam-attempts/  (read-only)
Query: `?exam=1&course=5&status=submitted&search=karim&ordering=-final_marks`
- `course` filters via the attempt's exam → course relation (so you can view all results for a course without picking one exam at a time).
- `search` matches student name/ID or exam title.
```json
{
  "count": 100, "next": "...", "previous": null,
  "results": [ { "id": 1, "exam": 1, "student": 4, "student_name": "Karim", "status": "submitted", "score": "20.00", "correct_count": 20, "wrong_count": 3, "unanswered_count": 2, "negative_marks": "0.75", "final_marks": "19.25", "time_taken_seconds": 1200, "rank": 3, "percentile": "88.00", "is_passed": true, "submitted_at": "...", "leaderboard_visible": false } ]
}
```

---

## 8. Assignment Management
Flags: `can_manage_assignments` (CRUD + submission viewing), `can_evaluate_assignments` (grading)

### GET admin/assignments/
Query: `?course=5&status=active`
```json
{
  "count": 10, "next": null, "previous": null,
  "results": [
    { "id": 1, "course": 5, "subject": 10, "title": "Assignment 1", "description": "...", "due_date": "2026-07-15T23:59:00Z", "max_marks": "100.00", "status": "active", "created_by": 2, "attachments": [ { "id": 1, "file": "url", "filename": "assignment1.pdf", "size": "1MB", "external_link": "" } ], "created_at": "..." }
  ]
}
```

### POST admin/assignments/
Input:
```json
{ "course": 5, "subject": 10, "title": "Assignment 1", "description": "Solve chapter 1 problems.", "due_date": "2026-07-15T23:59:00Z", "max_marks": "100.00", "status": "active" }
```
`subject` must be the id of a `CourseSubject` belonging to `course` — `400` otherwise. It's optional (`null` allowed).
`status` choices: `active | closed | evaluated`
Output (201): assignment object (`created_by` auto-set).

### GET / PATCH / PUT / DELETE admin/assignments/{id}/
Standard CRUD.

### GET admin/submissions/  (needs `can_manage_assignments`)
Query: `?assignment=1&status=submitted&student=3`
```json
{
  "count": 30, "next": null, "previous": null,
  "results": [
    { "id": 1, "assignment": 1, "student": 3, "submission_type": "file", "file": "url", "drive_link": "", "text_answer": "", "submitted_at": "...", "status": "submitted", "marks_obtained": null, "teacher_comment": "", "evaluated_by": null, "evaluated_at": null }
  ]
}
```

### POST admin/submissions/{id}/evaluate/  (needs `can_evaluate_assignments`)
Input:
```json
{ "marks_obtained": "85.00", "teacher_comment": "Well done, minor mistake in Q3.", "status": "evaluated" }
```
`status` choices: `submitted | evaluated | late | rejected`
Output: updated submission object with `evaluated_by`, `evaluated_at` filled.

---

## 9. Book & Order Management
Flags: `can_view_books`, `can_create_book`, `can_edit_book`, `can_delete_book`, `can_view_orders`, `can_update_order_status`

### GET admin/books/
Query: `?category=1&is_available=true&is_featured=true&search=physics`
```json
{
  "count": 12, "next": null, "previous": null,
  "results": [
    {
      "id": 1, "title": "Physics Guide", "slug": "physics-guide", "category": 1, "category_name": "Science",
      "description": "...", "cover_image": "url", "price": "500.00", "old_price": "700.00", "discount": "28.00",
      "author": "Dr. X", "publisher": "ABC Publications", "page_count": 300, "stock": 50,
      "is_available": true, "in_stock": true, "sample_preview_file": "url", "sample_preview_drive_link": "",
      "promo_video_url": "", "is_featured": true, "created_at": "...", "updated_at": "..."
    }
  ]
}
```

### POST admin/books/
Input:
```json
{
  "title": "Physics Guide", "category": 1, "description": "Complete HSC physics guide book.",
  "cover_image": "<upload>", "price": "500.00", "old_price": "700.00", "discount": "28.00",
  "author": "Dr. X", "publisher": "ABC Publications", "page_count": 300, "stock": 50,
  "is_available": true, "sample_preview_drive_link": "https://drive.google.com/...",
  "promo_video_url": "", "is_featured": true
}
```
Output (201): book object (`slug` auto-generated).

### GET / PATCH / PUT / DELETE admin/books/{id}/
Standard CRUD, same shape.

### admin/book-categories/  (full CRUD)
Input:
```json
{ "name": "Science", "description": "Science category books", "is_active": true, "order": 0 }
```
Output: `{ "id": 1, "name": "Science", "slug": "science", "description": "...", "is_active": true, "order": 0 }`

### GET admin/orders/  (read-only, `can_view_orders`)
Query: `?payment_status=pending&order_status=processing&search=VP2026070700001`
```json
{
  "count": 200, "next": "...", "previous": null,
  "results": [
    {
      "id": 1, "order_number": "VP2026070700001", "user": 3, "user_email": "student@domain.com",
      "items": [ { "id": 1, "item_type": "book", "book": 1, "course": null, "title_snapshot": "Physics Guide", "price": "500.00", "quantity": 2, "line_total": "1000.00" } ],
      "subtotal": "1000.00", "discount": "0.00", "total": "1000.00",
      "payment_method": "bkash", "payment_status": "pending", "order_status": "pending",
      "status_timeline": [ { "status": "pending", "at": "2026-07-08T10:00:00Z" }, { "status": "confirmed", "at": null }, { "status": "processing", "at": null }, { "status": "shipped", "at": null }, { "status": "completed", "at": null } ],
      "transaction_id": "", "customer_phone": "01700000000", "shipping_address": "...",
      "admin_note": "", "promo_code": "", "created_at": "...", "updated_at": "..."
    }
  ]
}
```

### PATCH admin/orders/{id}/update-status/  (needs `can_update_order_status`)
Input:
```json
{ "payment_status": "paid", "order_status": "processing", "transaction_id": "TXN123456", "admin_note": "Verified via bKash statement" }
```
Output: updated order object. Transitioning `payment_status` to `paid` auto-enrolls course items and decrements book stock (idempotent — re-applying has no effect).

### GET admin/payments/  (read-only, `can_view_orders`)
Query: `?status=success&order=1`
```json
{
  "count": 180, "next": null, "previous": null,
  "results": [ { "id": 1, "order": 1, "method": "bkash", "transaction_id": "TXN123456", "amount": "1000.00", "status": "success", "created_at": "..." } ]
}
```

---

## 10. Notice Management
Flag: `can_manage_notices`

### GET admin/notices/
Query: `?priority=urgent&target_type=course_specific&course=5&search=class`
```json
{
  "count": 15, "next": null, "previous": null,
  "results": [
    { "id": 1, "title": "Class rescheduled", "description": "...", "category": "class", "priority": "important", "target_type": "course_specific", "course": 5, "course_title": "HSC Physics Batch", "is_visible": true, "created_by": 2, "created_at": "...", "updated_at": "..." }
  ]
}
```

### POST admin/notices/
Input:
```json
{ "title": "Class rescheduled", "description": "Tomorrow's class moved to 8 PM.", "category": "class", "priority": "important", "target_type": "course_specific", "course": 5, "is_visible": true }
```
`priority` choices: `normal | important | urgent`
`target_type` choices: `all | students | course_specific` (course required if `course_specific`)
Output (201): notice object (`created_by` auto-set).

### GET / PATCH / PUT / DELETE admin/notices/{id}/
Standard CRUD.

### POST admin/notices/{id}/toggle-visibility/
Output: notice object with `is_visible` flipped.

---

## 11. Content / CMS Management

### Teachers — `can_manage_teachers`
`admin/teachers/` (full CRUD)
```json
{ "id": 1, "name": "Karim Sir", "designation": "Senior Lecturer", "subject": "Physics", "image": "url", "bio": "10+ years teaching experience.", "social_links": { "facebook": "https://facebook.com/...", "youtube": "..." }, "ordering": 0, "is_active": true }
```

### Reviews — `can_manage_reviews`
`admin/reviews/` (full CRUD)
```json
{ "id": 1, "student_name": "Rahim Uddin", "image": "url", "institution": "XYZ College", "unit": "A Unit", "merit_position": "10th", "rating": 5, "comment": "Great platform, helped me a lot!", "is_featured": true, "is_visible": true }
```
`rating`: 1–5.

### Success Stories — `can_manage_reviews`
`admin/success-stories/` (full CRUD)
```json
{ "id": 1, "student_name": "Karim Ahmed", "image": "url", "university": "University of Dhaka", "unit": "A Unit", "merit_position": "5th", "comment": "...", "video_url": "https://youtube.com/...", "year": "2025", "is_featured": true }
```

### FAQs — `can_manage_faq`
`admin/faqs/` (full CRUD)
```json
{ "id": 1, "question": "How do I enroll in a course?", "answer": "Go to the course page and click Enroll.", "category": "general", "related_course": 5, "related_book": null, "ordering": 0, "is_active": true }
```

### Static Pages — `can_manage_static_pages`
`admin/static-pages/{page_key}/` (full CRUD, lookup by `page_key`)
```json
{ "id": 1, "page_key": "privacy_policy", "title": "Privacy Policy", "content": "<p>...</p>", "meta_title": "Privacy Policy | VP", "meta_description": "...", "is_published": true }
```
`page_key` choices: `privacy_policy | refund_policy | terms_of_use | about | contact`

### Home Content — `can_manage_home_content`
`admin/home-content/hero/` (full CRUD)
```json
{ "id": 1, "title": "Join HSC Physics Batch 2026", "subtitle": "Learn from the best teachers", "image": "url", "button_text": "Enroll Now", "target_url": "/courses/hsc-physics-batch", "linked_course": 5, "ordering": 0, "is_active": true }
```
`admin/home-content/why-platform/` (full CRUD; `cards` are read-only nested — manage cards via Django admin)
```json
{ "id": 1, "promo_video_url": "https://youtube.com/...", "title": "Why Choose Us", "description": "...", "is_active": true }
```
`admin/home-content/about/` (full CRUD; `team_members` read-only nested)
```json
{ "id": 1, "title": "About Vaiyader Paathshala", "description": "...", "image": "url", "is_active": true }
```
`admin/home-content/footer/` (full CRUD)
```json
{ "id": 1, "name": "Vaiyader Paathshala", "logo": "url", "short_description": "...", "social_links": { "facebook": "...", "youtube": "..." }, "important_links": [ { "label": "Terms", "url": "/pages/terms_of_use" } ], "whatsapp_number": "01700000000", "is_active": true }
```

---

## 12. Community Links (student dashboard groups)
Flag: `can_manage_home_content`

### admin/community-links/  (full CRUD)
Query: `?kind=telegram_routine&is_active=true&course=5`
Input:
```json
{ "kind": "telegram_routine", "title": "HSC Physics Routine Group", "url": "https://t.me/joinchat/...", "icon": "telegram", "course": 5, "order": 0, "is_active": true }
```
`kind` choices: `facebook_group | telegram_routine | telegram_doubt | notice_channel | other`. Leave `course: null` for a platform-wide link.
Output (201): community-link object.

---

## Notes for building the admin panel UI
- Always call `GET my-permissions/` right after login to know which sidebar modules to render for a moderator (admins get `all_access: true` and see everything).
- Use `GET admin/moderator-permission-catalog/` when building the "assign permissions to moderator" screen — it gives grouped, human-labeled sections.
- All list endpoints are paginated (`?page=`, `?page_size=` up to 100) and support `?search=` / `?ordering=` where noted.
- `403 { "detail": "..." }` means the logged-in moderator lacks the specific flag for that action — check `GET admin/moderators/{id}/permissions/` to confirm what's granted.
- Full auto-generated schema: `/api/docs/` (Swagger) or `/api/redoc/`.
