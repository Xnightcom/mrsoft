-- Step 1: Add approval system to profiles
alter table public.profiles
add column if not exists is_approved boolean default false,
add column if not exists approved_at timestamp with time zone,
add column if not exists approved_by uuid references public.profiles(id),
add column if not exists approval_requested_at timestamp with time zone default now();

-- Auto-approve admins
update public.profiles 
set is_approved = true 
where role = 'admin';

-- Notifications table (in case it doesn't exist or is missing the `type` and `action_url` columns)
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text default 'info',
  is_read boolean default false,
  action_url text,
  created_at timestamp with time zone default now()
);

-- Add missing columns if table already existed without them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='type') THEN
    ALTER TABLE public.notifications ADD COLUMN type text default 'info';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='action_url') THEN
    ALTER TABLE public.notifications ADD COLUMN action_url text;
  END IF;
END $$;

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Anyone inserts notifications" on public.notifications;
create policy "Anyone inserts notifications"
  on public.notifications for insert
  with check (true);

drop policy if exists "Users mark read" on public.notifications;
create policy "Users mark read"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "User updates own notifications" on public.notifications;

-- Refresh schema
notify pgrst, 'reload schema';

-- Approve all existing users so they are not locked out
update public.profiles
set is_approved = true
where is_approved is null or is_approved = false;


-- Step 2 Part A: Update handle_new_user trigger to handle roles correctly and set approval
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    full_name, 
    avatar_url, 
    role,
    is_approved,
    approval_requested_at
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.email,
      'User'
    ),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(
      new.raw_user_meta_data->>'role',
      'client'
    ),
    case 
      when coalesce(
        new.raw_user_meta_data->>'role', 
        'client'
      ) = 'admin' 
      then true 
      else false 
    end,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;


-- Step 8: Add unique constraint for attendance
alter table public.attendance
drop constraint if exists attendance_student_course_date_unique;

alter table public.attendance
add constraint attendance_student_course_date_unique
unique (student_id, course_id, session_date);

-- Make sure publication is set for realtime
alter publication supabase_realtime add table public.notifications;
