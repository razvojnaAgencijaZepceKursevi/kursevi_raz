-- 0030_payment_and_legal_content.sql
--
-- Two pieces of admin-controlled content that until now lived nowhere:
--
--   1. the seller's payment details, which a student needs in order to pay for
--      a course at all, and
--   2. the terms and privacy texts, which were hardcoded placeholder pages.
--
-- ## Payment happens outside the system
--
-- A student requests access, transfers money by some other means, and an admin
-- approves once it arrives. 0028 gave the purchase a `readable_id` for the
-- payment reference — but the *other half* of a bank transfer, who to pay, was
-- never recorded anywhere. It was presumably going to be pasted into an email.

-- ---------------------------------------------------------------------------
-- payment_settings — exactly one row, forever
-- ---------------------------------------------------------------------------
--
-- The singleton trick: a boolean primary key constrained to `true` means the
-- table can hold one row and the database enforces it. The alternative — a
-- key/value settings table — would make every field untyped text and push
-- validation into application code for no gain, since these fields are known.
--
-- Every column is nullable except the id: an admin fills this in gradually, and
-- a half-filled record still beats none. The UI decides what is presentable;
-- see `isPaymentInfoComplete` in `src/lib/payment.ts`.
create table public.payment_settings (
  id boolean primary key default true constraint payment_settings_singleton check (id),

  -- Who the money goes to.
  seller_name text,
  address text,
  postal_code text,
  city text,
  country text,

  -- How to send it. `account_number` is deliberately free text rather than a
  -- validated IBAN: domestic transfers in BiH are quoted in several formats and
  -- rejecting one an admin typed correctly would be worse than accepting it.
  bank_name text,
  account_number text,
  swift text,

  -- Company registration numbers, shown on the payment slip.
  tax_id text,

  /*
   * The "svrha uplate" line. `{reference}` is substituted with the purchase's
   * readable id and `{course}` with the course name — see `renderPaymentPurpose`.
   * A template rather than a fixed string because what a bank wants in that
   * field varies, and the reference has to be able to sit inside it.
   */
  payment_purpose_template text default 'Uplata za kurs {course} — {reference}',

  -- Anything else the student should know: office hours, a contact, a warning
  -- that transfers take a day to clear.
  note text,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger payment_settings_set_updated_at
  before update on public.payment_settings
  for each row execute function public.set_updated_at();

alter table public.payment_settings enable row level security;

/*
 * Readable by anyone, including signed-out visitors.
 *
 * This is the seller's public business identity — the same information that
 * belongs in a shop footer or on an invoice — and the course catalogue is
 * public, so someone deciding whether to buy may reasonably want to see who
 * they would be paying before creating an account. There is nothing here that
 * is not already disclosed on any transfer slip.
 */
create policy "payment_settings_select_all"
  on public.payment_settings for select
  using (true);

-- Writes are admin-only, and not teacher-only-for-their-courses: there is one
-- seller, and it is the platform's, not a course author's.
create policy "payment_settings_admin_write"
  on public.payment_settings for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Seed the single row so the admin screen edits rather than creates, and so a
-- reader never has to distinguish "not configured" from "no row".
insert into public.payment_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- legal_documents — terms and privacy, editable without a deploy
-- ---------------------------------------------------------------------------
--
-- Keyed by a text slug rather than a uuid, because there are exactly two of
-- them and the page needs to look one up by name. The check constraint is what
-- stops a third appearing by typo; adding a real third document is a one-line
-- migration, which is the right amount of friction for a legal text.
--
-- Deliberately *not* the blog treatment. The blog is a typed array in the repo
-- because publishing should be a code review — but terms change in response to
-- a lawyer or a regulator, often urgently, and requiring a deploy to correct a
-- privacy policy is the wrong trade.
create table public.legal_documents (
  slug text primary key
    constraint legal_documents_slug_check check (slug in ('terms', 'privacy')),
  title text not null,
  -- Markdown or plain text; the renderer decides. Empty means "not written
  -- yet", which the page shows as a notice rather than as a blank document.
  content text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger legal_documents_set_updated_at
  before update on public.legal_documents
  for each row execute function public.set_updated_at();

alter table public.legal_documents enable row level security;

-- Public by definition — these are the documents a visitor must be able to
-- read before agreeing to anything.
create policy "legal_documents_select_all"
  on public.legal_documents for select
  using (true);

create policy "legal_documents_admin_write"
  on public.legal_documents for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into public.legal_documents (slug, title) values
  ('terms', 'Uvjeti korištenja'),
  ('privacy', 'Politika privatnosti');
