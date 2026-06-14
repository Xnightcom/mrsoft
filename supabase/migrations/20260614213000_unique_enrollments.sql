alter table public.enrollments
drop constraint if exists enrollments_student_course_unique;

alter table public.enrollments
add constraint enrollments_student_course_unique
unique (student_id, course_id);
