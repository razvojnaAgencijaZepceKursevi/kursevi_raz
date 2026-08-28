-- 0028_purchase_reference.sql
--
-- A human-quotable reference on every purchase request.
--
-- Payment happens outside this system: a student requests access, transfers the
-- money by whatever means, and an admin approves once it has arrived. Until now
-- there was nothing tying the two halves together — an admin looking at a bank
-- statement and a list of pending requests had only a name and an amount to
-- match on, which collides the moment two people buy the same course.
--
-- `readable_id` is what the student quotes as the payment reference and what
-- the admin searches for. Same scheme as `certificates.readable_id`, and for
-- the same reason: it is a string a person reads off a screen and types into a
-- form, so it must survive being written down.

create sequence public.purchase_readable_id_seq;

create or replace function public.next_purchase_readable_id()
returns text
language sql
volatile
set search_path = public, pg_temp
as $$
  select 'UPL-'
      || to_char(now(), 'YYYY')
      || '-'
      || lpad(nextval('public.purchase_readable_id_seq')::text, 4, '0');
$$;

comment on function public.next_purchase_readable_id() is
  'Payment reference for a purchase request, e.g. UPL-2026-0001. Generated in the database so concurrent requests cannot collide.';

-- Added in three steps rather than one.
--
-- A column added with a *volatile* default does get a distinct value per
-- existing row — Postgres rewrites the table rather than taking its usual
-- constant-default shortcut — but relying on that to backfill is a subtlety
-- nobody should have to know when reading this later. Nullable, backfilled,
-- then constrained is the same result stated plainly.
alter table public.purchases add column readable_id text;

update public.purchases
set readable_id = public.next_purchase_readable_id()
where readable_id is null;

alter table public.purchases
  alter column readable_id set default public.next_purchase_readable_id(),
  alter column readable_id set not null;

-- Unique, because the whole point is that it identifies one payment. Note this
-- covers denied requests too: the partial index in 0009 lets a denied purchase
-- be re-requested, and the new row gets its own reference rather than reusing a
-- number that may already appear on a bank statement.
create unique index purchases_readable_id_key on public.purchases (readable_id);

comment on column public.purchases.readable_id is
  'Payment reference the student quotes when transferring money. Unique, generated, never reused.';
