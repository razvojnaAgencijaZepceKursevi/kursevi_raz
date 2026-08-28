import { z } from '@/lib/openapi/zod';

/**
 * Newsletter recipients and sending.
 *
 * The message shape mirrors `EmailContent` in `src/lib/email/template.ts` — a
 * heading and a list of paragraphs — rather than accepting raw HTML. That is a
 * deliberate limit: the template escapes every interpolated value, so an admin
 * cannot paste markup that breaks the layout in Outlook (which renders with
 * Word) or, worse, that a filter reads as a phishing attempt. It also means the
 * newsletter looks like every other mail the app sends.
 */
export const newsletterRecipientSchema = z
  .object({
    id: z.uuid(),
    full_name: z.string(),
    email: z.string(),
  })
  .openapi('NewsletterRecipient');

export const newsletterRecipientsResponseSchema = z
  .object({
    data: z.array(newsletterRecipientSchema),
    meta: z.object({
      total: z.number(),
      /** Whether mail can actually leave the building. */
      email_configured: z.boolean(),
    }),
  })
  .openapi('NewsletterRecipientsResponse');

export const sendNewsletterSchema = z
  .object({
    subject: z.string().trim().min(1, 'Naslov emaila je obavezan.').max(200),
    heading: z.string().trim().min(1, 'Naslov poruke je obavezan.').max(200),
    /**
     * The body, as Markdown. The 100k ceiling is generous on purpose — an
     * inlined base64 image would blow past it, which is the point: images are
     * uploaded and referenced by URL, never embedded in the body.
     */
    body: z.string().trim().min(1, 'Poruka ne može biti prazna.').max(100_000),
    preheader: z.string().trim().max(200).optional(),
    action_label: z.string().trim().max(60).optional(),
    action_href: z.string().trim().max(500).optional(),
  })
  /*
   * A button needs both halves. A label with no destination renders a dead
   * button, and a destination with no label renders nothing at all — both are
   * silent failures in an email nobody can take back.
   */
  .refine((value) => Boolean(value.action_label) === Boolean(value.action_href), {
    error: 'Dugme treba i tekst i link, ili nijedno.',
    path: ['action_label'],
  })
  .openapi('SendNewsletterRequest');

export const sendNewsletterResponseSchema = z
  .object({
    data: z.object({
      recipients: z.number(),
      sent: z.number(),
      skipped: z.number(),
      failed: z.number(),
    }),
    meta: z.object({ email_configured: z.boolean() }),
  })
  .openapi('SendNewsletterResponse');

export type NewsletterRecipient = z.infer<typeof newsletterRecipientSchema>;
export type NewsletterRecipientsResponse = z.infer<typeof newsletterRecipientsResponseSchema>;
export type SendNewsletterRequest = z.infer<typeof sendNewsletterSchema>;
export type SendNewsletterResponse = z.infer<typeof sendNewsletterResponseSchema>;
