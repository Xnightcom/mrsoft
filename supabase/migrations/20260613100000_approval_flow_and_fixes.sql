-- STEP 1 – DATABASE UPDATES

-- ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id),
  target_roles text[] default '{admin,instructor,student,client}',
  is_pinned boolean default false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
alter table public.announcements enable row level security;

create policy "Everyone reads announcements"
  on public.announcements for select
  using (
    auth.uid() is not null
    and (
      expires_at is null or expires_at > now()
    )
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = any(announcements.target_roles)
    )
  );

create policy "Admin manages announcements"
  on public.announcements for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- FIX MESSAGES TABLE POLICIES (Unified)
DROP POLICY IF EXISTS "Admin sends messages" ON public.messages;
DROP POLICY IF EXISTS "Instructor sends messages" ON public.messages;
DROP POLICY IF EXISTS "Student messages instructor" ON public.messages;
DROP POLICY IF EXISTS "Users read own messages" ON public.messages;

create policy "Authenticated users send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and (
      -- Admin can message anyone
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
      or
      -- Instructor messages their students or admins
      (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'instructor'
        )
        and (
          exists (
            select 1 from public.profiles
            where id = receiver_id and role = 'admin'
          )
          or exists (
            select 1 from public.courses c
            join public.enrollments e on e.course_id = c.id
            where c.instructor_id = auth.uid()
              and e.student_id = receiver_id
          )
          or exists (
            select 1 from public.profiles
            where id = receiver_id and role = 'instructor'
          )
        )
      )
      or
      -- Student messages only their instructor
      (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'student'
        )
        and exists (
          select 1 from public.courses c
          join public.enrollments e on e.course_id = c.id
          where e.student_id = auth.uid()
            and c.instructor_id = receiver_id
        )
      )
    )
  );

create policy "Users read own messages"
  on public.messages for select
  using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Users update own messages"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- UNIQUE CONSTRAINT FOR ATTENDANCE
alter table public.attendance drop constraint if exists attendance_student_course_date_unique;
alter table public.attendance add constraint attendance_student_course_date_unique unique (student_id, course_id, session_date);

-- ENABLE REALTIME PUBLICATION
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.announcements;

-- REFRESH SCHEMA
notify pgrst, 'reload schema';
