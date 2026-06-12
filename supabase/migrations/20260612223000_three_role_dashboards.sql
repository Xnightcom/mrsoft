-- Drop old trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Drop trigger function if exists
drop function if exists public.handle_new_user() cascade;

-- Drop dependent tables if they exist to match the new schema exactly
drop table if exists public.notifications cascade;
drop table if exists public.messages cascade;
drop table if exists public.invoices cascade;
drop table if exists public.milestones cascade;
drop table if exists public.projects cascade;
drop table if exists public.certificates cascade;
drop table if exists public.attendance cascade;
drop table if exists public.assignments cascade;
drop table if exists public.lessons cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.courses cascade;
drop table if exists public.submissions cascade;

-- Re-create profiles with new schema
drop table if exists public.profiles cascade;

-- PROFILES (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'client' check (role in ('admin','student','client')),
  company text,
  phone text,
  bio text,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;

-- Grant permissions
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Admin reads all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'client'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- COURSES
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  thumbnail_url text,
  duration_hours int,
  level text default 'beginner',
  is_published boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.courses enable row level security;
grant select, insert, update, delete on public.courses to authenticated;
grant select on public.courses to anon;
grant all on public.courses to service_role;

create policy "Anyone reads published courses"
  on public.courses for select using (is_published = true);
create policy "Admin manages courses"
  on public.courses for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- ENROLLMENTS
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id),
  course_id uuid references public.courses(id),
  progress int default 0 check (progress between 0 and 100),
  enrolled_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  unique(student_id, course_id)
);

alter table public.enrollments enable row level security;
grant select, insert, update, delete on public.enrollments to authenticated;
grant all on public.enrollments to service_role;

create policy "Student reads own enrollments"
  on public.enrollments for select using (auth.uid() = student_id);
create policy "Admin manages enrollments"
  on public.enrollments for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- LESSONS
create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id),
  title text not null,
  content_url text,
  duration_minutes int,
  order_index int,
  is_published boolean default false
);

alter table public.lessons enable row level security;
grant select, insert, update, delete on public.lessons to authenticated;
grant select on public.lessons to anon;
grant all on public.lessons to service_role;

create policy "Enrolled students read lessons"
  on public.lessons for select
  using (exists (
    select 1 from public.enrollments e
    where e.course_id = lessons.course_id
    and e.student_id = auth.uid()
  ));

-- ASSIGNMENTS
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id),
  student_id uuid references public.profiles(id),
  title text not null,
  description text,
  due_date timestamp with time zone,
  submission_url text,
  grade int,
  feedback text,
  status text default 'pending'
    check (status in ('pending','submitted','graded')),
  created_at timestamp with time zone default now()
);

alter table public.assignments enable row level security;
grant select, insert, update, delete on public.assignments to authenticated;
grant all on public.assignments to service_role;

create policy "Student reads own assignments"
  on public.assignments for select using (auth.uid() = student_id);
create policy "Student submits own assignments"
  on public.assignments for update using (auth.uid() = student_id);
create policy "Admin manages assignments"
  on public.assignments for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- ATTENDANCE
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id),
  course_id uuid references public.courses(id),
  session_date date not null,
  attended boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.attendance enable row level security;
grant select, insert, update, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;

create policy "Student reads own attendance"
  on public.attendance for select using (auth.uid() = student_id);
create policy "Admin manages attendance"
  on public.attendance for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- CERTIFICATES
create table public.certificates (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id),
  course_id uuid references public.courses(id),
  issued_at timestamp with time zone default now(),
  pdf_url text,
  share_token text unique default gen_random_uuid()::text
);

alter table public.certificates enable row level security;
grant select, insert, update, delete on public.certificates to authenticated;
grant all on public.certificates to service_role;

create policy "Student reads own certificates"
  on public.certificates for select using (auth.uid() = student_id);
create policy "Admin manages certificates"
  on public.certificates for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- PROJECTS (client)
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id),
  title text not null,
  description text,
  status text default 'planning'
    check (status in ('planning','development','review','delivered')),
  assigned_to uuid references public.profiles(id),
  deadline date,
  created_at timestamp with time zone default now()
);

alter table public.projects enable row level security;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;

create policy "Client reads own projects"
  on public.projects for select using (auth.uid() = client_id);
create policy "Admin manages projects"
  on public.projects for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- MILESTONES
create table public.milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id),
  title text not null,
  due_date date,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.milestones enable row level security;
grant select, insert, update, delete on public.milestones to authenticated;
grant all on public.milestones to service_role;

create policy "Client reads own milestones"
  on public.milestones for select
  using (exists (
    select 1 from public.projects p
    where p.id = milestones.project_id and p.client_id = auth.uid()
  ));
create policy "Admin manages milestones"
  on public.milestones for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- INVOICES
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id),
  project_id uuid references public.projects(id),
  amount numeric not null,
  currency text default 'NGN',
  status text default 'pending'
    check (status in ('pending','paid','overdue')),
  due_date date,
  pdf_url text,
  created_at timestamp with time zone default now()
);

alter table public.invoices enable row level security;
grant select, insert, update, delete on public.invoices to authenticated;
grant all on public.invoices to service_role;

create policy "Client reads own invoices"
  on public.invoices for select using (auth.uid() = client_id);
create policy "Admin manages invoices"
  on public.invoices for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- MESSAGES
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id),
  sender_id uuid references public.profiles(id),
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.messages enable row level security;
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;

create policy "Project members read messages"
  on public.messages for select
  using (exists (
    select 1 from public.projects p
    where p.id = messages.project_id
    and (p.client_id = auth.uid() or p.assigned_to = auth.uid())
  ));
create policy "Project members create messages"
  on public.messages for insert
  with check (exists (
    select 1 from public.projects p
    where p.id = messages.project_id
    and (p.client_id = auth.uid() or p.assigned_to = auth.uid())
  ));

-- NOTIFICATIONS
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  title text not null,
  body text,
  is_read boolean default false,
  type text default 'info',
  created_at timestamp with time zone default now()
);

alter table public.notifications enable row level security;
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

create policy "User reads own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "User updates own notifications"
  on public.notifications for update using (auth.uid() = user_id);
