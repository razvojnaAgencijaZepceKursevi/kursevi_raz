import type { PurchaseStatus } from '@/lib/schemas/purchases.schema';
import type { TaskSubmissionStatus } from '@/lib/schemas/task-submissions.schema';

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

/**
 * `published` is a boolean rather than an enum, so it gets a helper instead of
 * a lookup table.
 */
export const publishStatus = (published: boolean): StatusDisplay =>
  published ? { label: 'Objavljen', color: 'success' } : { label: 'Nacrt', color: 'default' };
