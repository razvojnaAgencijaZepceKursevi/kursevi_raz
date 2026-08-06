'use client';

import { useMutation } from '@tanstack/react-query';
import { ApiRequestError, type Envelope } from '@/lib/api/client';
import type { BucketName } from '@/lib/storage';
import type { UploadResult } from '@/lib/schemas/uploads.schema';

/**
 * File uploads. One hook covers every bucket — thumbnails, module files, task
 * files, message attachments — because the endpoint is generic over them.
 *
 * There is no query counterpart and no cache to invalidate: an upload produces
 * a path, and it's the *owning record's* mutation (e.g. `useUpdateCourse`) that
 * saves it and refreshes the relevant caches.
 */

export type UploadFileVariables = {
  bucket: BucketName;
  /** The owning ids, in the order the bucket's path convention expects. */
  folders: string[];
  file: File;
};

/**
 * `apiPost` isn't reused here: it JSON-encodes the body and sets a JSON
 * content-type, and a multipart upload needs neither — the browser must set
 * `Content-Type` itself so it can add the multipart boundary.
 */
async function uploadFile({ bucket, folders, file }: UploadFileVariables): Promise<UploadResult> {
  const body = new FormData();
  body.set('bucket', bucket);
  body.set('folder', folders.join('/'));
  body.set('file', file);

  const response = await fetch('/api/admin/uploads', { method: 'POST', body });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload as { error?: string; details?: unknown } | null;
    throw new ApiRequestError(
      response.status,
      error?.error ?? `Upload failed with status ${response.status}`,
      error?.details,
    );
  }

  return (payload as Envelope<UploadResult>).data;
}

/**
 * POST /api/admin/uploads
 *
 *   const upload = useUploadFile();
 *   const { path } = await upload.mutateAsync({
 *     bucket: BUCKETS.courseThumbnails,
 *     folders: [course.id],
 *     file,
 *   });
 */
export function useUploadFile() {
  return useMutation({ mutationFn: uploadFile });
}
