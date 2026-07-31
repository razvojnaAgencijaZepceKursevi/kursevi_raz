-- 0003_profiles.sql
-- Application-level user record, 1:1 with auth.users.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.profiles is
  'Extends auth.users. Rows are created automatically by handle_new_user().';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Signup hook: creates the profile row from the auth user + signup metadata.
-- SECURITY DEFINER because the inserting session is unauthenticated at this
-- point and RLS would otherwise reject the write.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    -- The register page sends full_name in the signup metadata; fall back to
    -- the local part of the email so the not-null constraint always holds.
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps profiles.email aligned when the user changes it through Supabase Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Privilege-escalation guard.
--
-- RLS grants a student UPDATE on their own profile row, but Postgres policies
-- cannot restrict *which columns* an UPDATE touches. This trigger is what
-- actually enforces "students cannot change their own role".
--
-- SECURITY INVOKER is required: current_user must reflect the caller so the
-- service_role escape hatch below works.
create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and current_user <> 'service_role'
  then
    raise exception 'Only an admin may change a user role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_unauthorized_role_change();

create index profiles_role_idx on public.profiles (role);
