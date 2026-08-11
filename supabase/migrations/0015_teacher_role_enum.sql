-- 0015_teacher_role_enum.sql
--
-- Adds the third application role.
--
-- This migration contains exactly one statement, and that is deliberate:
-- Postgres will not let a newly added enum value be *used* in the same
-- transaction that added it. Since the CLI runs each migration file in its own
-- transaction, splitting the ADD VALUE into its own file is what allows 0016
-- and 0017 to reference 'teacher' in functions and policies. Merging them back
-- together will fail with "unsafe use of new value of enum type".

alter type public.user_role add value if not exists 'teacher';
