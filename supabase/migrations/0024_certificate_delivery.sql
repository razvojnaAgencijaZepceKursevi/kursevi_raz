-- 0024_certificate_delivery.sql
--
-- Certificate fulfilment was untracked: `requested_delivery` recorded that a
-- student had *asked* for a printed copy, and nothing recorded whether anyone
-- had ever sent one. The admin screens said so in as many words, because
-- faking it client-side would have been a lie the database could not back up.
--
-- Two columns rather than a boolean. `delivered_at` answers "when", which a
-- boolean cannot, and an admin chasing a complaint always wants the date. Its
-- nullness is the boolean. `delivered_by` answers "who", which matters because
-- posting something physical is an act by a person, not by the system.

alter table public.certificates
  add column delivered_at timestamptz,
  add column delivered_by uuid references public.profiles (id) on delete set null;

comment on column public.certificates.delivered_at is
  'When an admin marked the printed certificate as posted. Null means not sent.';
comment on column public.certificates.delivered_by is
  'The admin who marked it sent. Audit only — never an authorization key.';

-- The actual work queue: asked for, not yet sent. Both halves of the predicate
-- matter — a delivered certificate and one nobody asked about are equally
-- uninteresting to the admin working through this list.
create index certificates_pending_delivery_idx
  on public.certificates (created_at desc)
  where requested_delivery = true and delivered_at is null;
