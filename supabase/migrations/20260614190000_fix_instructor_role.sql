-- Step 1: Drop the old CHECK constraint on profiles role if it exists
alter table public.profiles drop constraint if exists profiles_role_check;

-- Step 2: Add the updated CHECK constraint including 'instructor'
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'student', 'instructor', 'client'));

-- Step 3: Update handle_new_user trigger function to preserve signup role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;
