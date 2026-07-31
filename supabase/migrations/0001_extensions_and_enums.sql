-- 0001_extensions_and_enums.sql
-- Extensions and the two-role / status enums used across the schema.

create extension if not exists pgcrypto with schema extensions;

-- Exactly two application roles. Anything beyond admin/student is out of scope.
create type public.user_role as enum ('admin', 'student');

-- A purchase is a manual request/approval flow — no payment provider involved.
create type public.purchase_status as enum ('requested', 'denied', 'approved');

-- A task submission is an admin-reviewed thread that can bounce back for revision.
create type public.task_submission_status as enum ('pending', 'needs_revision', 'approved');
