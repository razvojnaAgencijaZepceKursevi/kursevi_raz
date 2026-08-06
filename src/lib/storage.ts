import { publicEnv } from '@/lib/env';

/**
 * Storage bucket names and the path conventions the RLS policies depend on.
 *
 * Migration `0013_storage_buckets_and_policies.sql` reads the first folder
 * segment of every object path to decide access — e.g. a `module-files` object
 * is readable only if the caller has an approved purchase for the course whose
 * id is that first segment. Uploading to the wrong shape doesn't error, it just
 * produces a file nobody can read, so always build paths with `storagePath()`.
 */
export const BUCKETS = {
  courseThumbnails: 'course-thumbnails',
  moduleFiles: 'module-files',
  taskFiles: 'task-files',
  taskMessageAttachments: 'task-message-attachments',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Buckets served straight from the CDN, with no signed URL needed. */
const PUBLIC_BUCKETS: readonly BucketName[] = [BUCKETS.courseThumbnails];

export const isPublicBucket = (bucket: BucketName) => PUBLIC_BUCKETS.includes(bucket);

/**
 * How many leading id folders each bucket's paths must carry, as enforced by
 * the RLS policies:
 *
 *   course-thumbnails         {course_id}/
 *   module-files              {course_id}/{module_id}/
 *   task-files                {course_id}/{module_id}/
 *   task-message-attachments  {submission_id}/
 */
export const BUCKET_PATH_SEGMENTS: Record<BucketName, number> = {
  [BUCKETS.courseThumbnails]: 1,
  [BUCKETS.moduleFiles]: 2,
  [BUCKETS.taskFiles]: 2,
  [BUCKETS.taskMessageAttachments]: 1,
};

/**
 * Combining diacritical marks, which `normalize('NFD')` splits letters into —
 * removing them turns "Čačak" into "Cacak" rather than dropping the letter.
 */
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Strips anything that would make an object path awkward to reference, while
 * keeping the extension intact. Supabase accepts more than this, but a
 * predictable ASCII path avoids encoding surprises in URLs.
 */
export function safeFileName(fileName: string): string {
  const normalised = fileName
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  // Prefix with a timestamp so re-uploading the same filename never silently
  // overwrites the previous object.
  return `${Date.now()}-${normalised}`;
}

/** Joins the owning ids and a filename into a bucket-correct object path. */
export function storagePath(folders: string[], fileName: string): string {
  return [...folders, safeFileName(fileName)].join('/');
}

/**
 * CDN URL for an object in a public bucket. Returns null for a missing path so
 * callers can fall back to a placeholder with a plain nullish check.
 */
export function publicUrl(bucket: BucketName, path: string | null | undefined): string | null {
  if (!path) return null;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** Convenience wrapper for the one public bucket we render images from. */
export const courseThumbnailUrl = (path: string | null | undefined) =>
  publicUrl(BUCKETS.courseThumbnails, path);

/** Upload limits, mirrored by the `/api/admin/uploads` route. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
