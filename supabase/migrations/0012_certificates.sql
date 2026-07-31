-- 0012_certificates.sql
--
-- The existence of a row here IS the "course completed" signal — there is no
-- separate course_progress table. Issued only by service-role API routes.

create sequence public.certificate_readable_id_seq;

-- Human-quotable identifier printed on the certificate, e.g. CERT-2026-0001.
-- Generated in the database so concurrent issues can never collide.
create or replace function public.next_certificate_readable_id()
returns text
language sql
volatile
set search_path = public, pg_temp
as $$
  select 'CERT-'
      || to_char(now(), 'YYYY')
      || '-'
      || lpad(nextval('public.certificate_readable_id_seq')::text, 4, '0');
$$;

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  readable_id text not null unique default public.next_certificate_readable_id(),
  requested_delivery boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger certificates_set_updated_at
  before update on public.certificates
  for each row execute function public.set_updated_at();

create unique index certificates_course_id_student_id_key
  on public.certificates (course_id, student_id);

create index certificates_student_id_idx on public.certificates (student_id);
create index certificates_requested_delivery_idx
  on public.certificates (requested_delivery)
  where requested_delivery = true;
