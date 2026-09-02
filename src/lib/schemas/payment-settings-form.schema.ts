import { z } from 'zod';
import type { UpdatePaymentSettingsRequest } from '@/lib/schemas/payment.schema';

/**
 * Form schema for the payment details.
 *
 * Separate from `payment.schema.ts` for the standing reason: form schemas use
 * plain `zod` (importing `@/lib/openapi/zod` drags zod-to-openapi into the
 * browser bundle), carry Bosnian messages, and may differ in shape from the
 * API. Here they differ in exactly one way, and it matters —
 *
 * **the API stores `null` for "not set", but a text input can only ever produce
 * `''`.** Every field is a required string here and `toPaymentSettingsPayload`
 * converts blanks back to `null` at the boundary. Sending `''` instead would
 * fill the database with empty strings that are not null, and every
 * `field ? … : null` check in the UI would start rendering blank rows.
 */
export const paymentSettingsFormSchema = z.object({
  seller_name: z.string().trim().min(1, 'Naziv primaoca je obavezan.').max(200),
  address: z.string().trim().max(200),
  postal_code: z.string().trim().max(200),
  city: z.string().trim().max(200),
  country: z.string().trim().max(200),
  bank_name: z.string().trim().max(200),
  account_number: z.string().trim().min(1, 'Broj računa je obavezan.').max(200),
  swift: z.string().trim().max(200),
  tax_id: z.string().trim().max(200),
  payment_purpose_template: z.string().trim().max(200),
  note: z.string().trim().max(2000),
});

export type PaymentSettingsFormValues = z.infer<typeof paymentSettingsFormSchema>;

/** `''` → `null`, so "not set" stays genuinely unset in the database. */
const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

/**
 * The return annotation is load-bearing: it makes the compiler check this
 * mapper against the API type, so a field added to one side cannot silently go
 * missing on the other.
 */
export function toPaymentSettingsPayload(
  values: PaymentSettingsFormValues,
): UpdatePaymentSettingsRequest {
  return {
    seller_name: orNull(values.seller_name),
    address: orNull(values.address),
    postal_code: orNull(values.postal_code),
    city: orNull(values.city),
    country: orNull(values.country),
    bank_name: orNull(values.bank_name),
    account_number: orNull(values.account_number),
    swift: orNull(values.swift),
    tax_id: orNull(values.tax_id),
    payment_purpose_template: orNull(values.payment_purpose_template),
    note: orNull(values.note),
  };
}
