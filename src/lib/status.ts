import type { PurchaseStatus } from '@/lib/schemas/purchases.schema';
import type { TaskSubmissionStatus } from '@/lib/schemas/task-submissions.schema';
import type { UserRole } from '@/lib/schemas/users.schema';

/**
 * Status → label + colour, in one place.
 *
 * The database stores English enum values; the UI shows Serbian. Mapping them
 * here means no page invents its own wording, and a status renaming is a
 * one-line change rather than a search across the codebase.
 *
 * Used as `<StatusChip {...PURCHASE_STATUS[purchase.status]} />`.
 */
export type StatusDisplay = {
  label: string;
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
};

export const PURCHASE_STATUS: Record<PurchaseStatus, StatusDisplay> = {
  requested: { label: 'Na čekanju', color: 'warning' },
  approved: { label: 'Odobreno', color: 'success' },
  denied: { label: 'Odbijeno', color: 'error' },
};

export const SUBMISSION_STATUS: Record<TaskSubmissionStatus, StatusDisplay> = {
  pending: { label: 'Čeka pregled', color: 'warning' },
  needs_revision: { label: 'Potrebna izmena', color: 'info' },
  approved: { label: 'Prihvaćeno', color: 'success' },
};

export const USER_ROLE: Record<UserRole, StatusDisplay> = {
  admin: { label: 'Administrator', color: 'secondary' },
  teacher: { label: 'Predavač', color: 'primary' },
  student: { label: 'Student', color: 'default' },
};

/*
 * Booleans get helpers rather than lookup tables — there's no enum to key on.
 */

export const publishStatus = (published: boolean): StatusDisplay =>
  published ? { label: 'Objavljen', color: 'success' } : { label: 'Nacrt', color: 'default' };

/**
 * Whether a student has asked for a printed certificate.
 *
 * Note what this does *not* say: nothing about whether it was actually sent.
 * The schema has no fulfilment column, so "Zatražena dostava" means a request
 * exists and nothing more — don't let the UI imply otherwise.
 */
export const deliveryStatus = (requested: boolean): StatusDisplay =>
  requested
    ? { label: 'Zatražena dostava', color: 'warning' }
    : { label: 'Bez zahteva', color: 'default' };
