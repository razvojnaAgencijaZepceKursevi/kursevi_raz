import type { UserRole } from '@/lib/auth/routes';
import type { Database } from '@/types/database.types';

export type NotificationType = Database['public']['Enums']['notification_type'];

/**
 * Every kind of notification the app can send, in one place.
 *
 * This file is the single source of truth for three separate things that must
 * never drift apart:
 *
 *   1. **the enum** — the keys here are exactly `notification_type` in the
 *      database (migration 0025). TypeScript enforces that: `NotificationType`
 *      is generated from the schema, so a missing or invented key fails to
 *      compile;
 *   2. **the settings screen** — its labels, its grouping, and which rows a
 *      given role is even shown;
 *   3. **who can receive what** — `audience` is a UI filter, not a guard. It
 *      keeps a student from being offered a switch for "somebody requested a
 *      course", which no student is ever sent. What actually decides the
 *      recipients is the call site, and the database is what enforces that a
 *      notification only ever reaches the row's own `user_id`.
 *
 * Adding a type means: a migration for the enum value (`ALTER TYPE … ADD VALUE`
 * must be alone in its file), an entry here, and a call to `notifyUsers`.
 */
export type NotificationGroup =
  'purchases' | 'submissions' | 'certificates' | 'account' | 'support';

export type NotificationDefinition = {
  /** Shown as the row label on the settings screen. */
  label: string;
  /** One line under it, saying when this actually fires. */
  description: string;
  /** Roles that can ever receive this. Filters the settings screen only. */
  audience: UserRole[];
  group: NotificationGroup;
};

export const NOTIFICATION_GROUPS: Record<
  NotificationGroup,
  { title: string; description: string }
> = {
  purchases: {
    title: 'Kupovine',
    description: 'Zahtevi za pristup kursevima i odluke o njima.',
  },
  submissions: {
    title: 'Zadaci',
    description: 'Predaje zadataka, poruke u prepisci i odluke predavača.',
  },
  certificates: {
    title: 'Sertifikati',
    description: 'Izdavanje sertifikata i slanje štampanih primeraka.',
  },
  account: {
    title: 'Nalog i kursevi',
    description: 'Promene na vašem nalogu i na kursevima koje vodite.',
  },
  support: {
    title: 'Prijave i podrška',
    description: 'Prijave problema i pitanja upućena administratorima.',
  },
};

export const NOTIFICATION_CATALOG: Record<NotificationType, NotificationDefinition> = {
  /* ---- purchases ---- */
  purchase_requested: {
    label: 'Novi zahtev za kupovinu',
    description: 'Kada student zatraži pristup kursu i čeka odobrenje.',
    // Only admins decide on purchases, so only admins are told. A teacher may
    // read the requests on their own courses but cannot act on them, and a
    // notification you can do nothing about is noise.
    audience: ['admin'],
    group: 'purchases',
  },
  purchase_approved: {
    label: 'Pristup odobren',
    description: 'Kada vam administrator odobri pristup kursu.',
    audience: ['student'],
    group: 'purchases',
  },
  purchase_denied: {
    label: 'Zahtev odbijen',
    description: 'Kada vam administrator odbije zahtev za pristup kursu.',
    audience: ['student'],
    group: 'purchases',
  },

  /* ---- submissions ---- */
  submission_received: {
    label: 'Novo predato rešenje',
    description: 'Kada student preda rešenje zadatka na kursu koji pregledate.',
    audience: ['admin', 'teacher'],
    group: 'submissions',
  },
  submission_message: {
    label: 'Nova poruka u prepisci',
    description: 'Kada druga strana pošalje poruku u prepisci o zadatku.',
    audience: ['admin', 'teacher', 'student'],
    group: 'submissions',
  },
  submission_needs_revision: {
    label: 'Zatražena izmena rešenja',
    description: 'Kada predavač traži da ispravite predato rešenje.',
    audience: ['student'],
    group: 'submissions',
  },
  submission_approved: {
    label: 'Rešenje prihvaćeno',
    description: 'Kada predavač prihvati vaše rešenje i zadatak bude završen.',
    audience: ['student'],
    group: 'submissions',
  },

  /* ---- certificates ---- */
  certificate_issued: {
    label: 'Sertifikat izdat',
    description: 'Kada završite sve module kursa i dobijete sertifikat.',
    audience: ['student'],
    group: 'certificates',
  },
  certificate_delivery_requested: {
    label: 'Zahtev za slanje sertifikata',
    description: 'Kada student zatraži da mu se štampani sertifikat pošalje poštom.',
    audience: ['admin'],
    group: 'certificates',
  },
  certificate_delivered: {
    label: 'Sertifikat poslat poštom',
    description: 'Kada administrator označi da je vaš štampani sertifikat poslat.',
    audience: ['student'],
    group: 'certificates',
  },

  /* ---- account ---- */
  course_published: {
    label: 'Kurs objavljen',
    description: 'Kada administrator objavi kurs čiji ste autor.',
    // A teacher cannot publish their own course, so this is the only way they
    // learn it went live.
    audience: ['teacher'],
    group: 'account',
  },
  account_role_changed: {
    label: 'Promena uloge naloga',
    description: 'Kada vam administrator promeni ulogu na nalogu.',
    audience: ['admin', 'teacher', 'student'],
    group: 'account',
  },

  /* ---- support ---- */
  issue_opened: {
    label: 'Nova prijava',
    description: 'Kada korisnik pošalje novu prijavu problema ili pitanje.',
    // Only admins handle issues — deliberately not teachers, since a prijava
    // may well be about one.
    audience: ['admin'],
    group: 'support',
  },
  issue_reply: {
    label: 'Odgovor na prijavu',
    description: 'Kada druga strana odgovori u prepisci o prijavi.',
    audience: ['admin', 'teacher', 'student'],
    group: 'support',
  },
  issue_closed: {
    label: 'Prijava zatvorena',
    description: 'Kada administrator zatvori vašu prijavu.',
    audience: ['admin', 'teacher', 'student'],
    group: 'support',
  },
};

/** Every type, in the order the settings screen should show them. */
export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_CATALOG) as NotificationType[];

/**
 * The types worth offering to one role.
 *
 * Note this is generous by design: a student who is later promoted to teacher
 * keeps whatever they had set, and the extra rows simply appear. Nothing is
 * deleted when a role changes, because a demotion is often temporary and
 * silently discarding someone's preferences is worse than showing them fewer
 * switches for a while.
 */
export function notificationTypesForRole(role: UserRole): NotificationType[] {
  return NOTIFICATION_TYPES.filter((type) => NOTIFICATION_CATALOG[type].audience.includes(role));
}
