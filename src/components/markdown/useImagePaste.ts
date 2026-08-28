'use client';

import * as React from 'react';
import { useUploadFile } from '@/hooks/useUploads';
import { ACCEPTED_IMAGE_TYPES, BUCKETS, MAX_UPLOAD_BYTES, publicUrl } from '@/lib/storage';
import { errorMessage } from '@/lib/api/errorMessage';
import { toast } from '@/store/useToastStore';

/**
 * Paste-or-drop an image into the Markdown editor and get a hosted URL back.
 *
 * ## Why the image is uploaded rather than embedded
 *
 * A pasted screenshot arrives as binary. The tempting shortcut is a base64
 * `data:` URI straight into the Markdown — no upload, no bucket, no policy.
 * That fails in exactly the place it matters: **Gmail, Outlook and Apple Mail
 * all refuse to render `data:` images in an email.** The message would look
 * right in the composer's preview and arrive with broken boxes.
 *
 * So the file goes to the public `newsletter-images` bucket (migration 0033)
 * and the editor gets `![alt](https://…)`. Public because a mail client fetches
 * the image anonymously, with no session to authorise — see the migration for
 * why that disclosure is acceptable for this bucket alone.
 *
 * ## The month folder
 *
 * `newsletter-images/{yyyy-mm}/…`. The bucket's policy takes one folder
 * segment, and a newsletter image belongs to no row, so there is no id to key
 * on — the month just keeps the bucket browsable instead of one flat directory.
 */
export function useImagePaste() {
  const upload = useUploadFile();

  const uploadImage = React.useCallback(
    async (file: File): Promise<string | null> => {
      // `ACCEPTED_IMAGE_TYPES` is a const tuple, so `includes` narrows its
      // argument to the literal union; the widening is what lets an arbitrary
      // `file.type` be tested against it.
      if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        toast.error('Podržane su samo slike: JPEG, PNG, WebP ili AVIF.');
        return null;
      }

      // Checked here as well as on the server, so a 5MB screenshot fails
      // instantly instead of after the upload.
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error('Slika je prevelika — najviše 5 MB.');
        return null;
      }

      const now = new Date();
      const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      try {
        const { path } = await upload.mutateAsync({
          bucket: BUCKETS.newsletterImages,
          folders: [folder],
          file,
        });
        return publicUrl(BUCKETS.newsletterImages, path);
      } catch (error) {
        toast.error(errorMessage(error));
        return null;
      }
    },
    [upload],
  );

  return { uploadImage, uploading: upload.isPending };
}

/**
 * Pulls image files out of a paste or drop.
 *
 * A screenshot paste has no filename — `getAsFile()` returns something called
 * `image.png` — which is fine, since `safeFileName()` timestamps every upload
 * anyway. A paste that also carries text (copying from a web page) is left
 * alone: the text is what the user meant.
 */
export function imageFilesFrom(event: ClipboardEvent | DragEvent): File[] {
  const items =
    'clipboardData' in event
      ? event.clipboardData?.items
      : (event as DragEvent).dataTransfer?.items;
  if (!items) return [];

  const files: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file && file.type.startsWith('image/')) files.push(file);
  }
  return files;
}
