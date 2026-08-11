import { z } from '@/lib/openapi/zod';
import {
  auditFields,
  booleanQueryParam,
  embeddedCourseSchema,
  embeddedProfileSchema,
  paginatedResponse,
  paginationQuerySchema,
  uuidSchema,
} from './common.schema';

export const readableIdSchema = z
  .string()
  .regex(/^CERT-\d{4}-\d{4,}$/)
  .openapi({ example: 'CERT-2026-0001' });

export const certificateSchema = z
  .object({
    id: uuidSchema,
    course_id: uuidSchema,
    student_id: uuidSchema,
    readable_id: readableIdSchema,
    requested_delivery: z.boolean(),
    ...auditFields,
  })
  .openapi('Certificate');

/** A certificate as the admin endpoints return it, with course + student embedded. */
export const adminCertificateSchema = certificateSchema
  .extend({
    courses: embeddedCourseSchema,
    profiles: embeddedProfileSchema,
  })
  .openapi('AdminCertificate');

export const adminCertificateListResponseSchema = paginatedResponse(adminCertificateSchema).openapi(
  'AdminCertificateListResponse',
);

export const adminCertificateResponseSchema = z
  .object({ data: adminCertificateSchema })
  .openapi('AdminCertificateResponse');

export const listCertificatesQuerySchema = paginationQuerySchema
  .extend({
    requestedDelivery: booleanQueryParam()
      .optional()
      .openapi({ description: 'Filter to certificates with a pending delivery request' }),
    courseId: uuidSchema.optional(),
    studentId: uuidSchema.optional().openapi({ description: 'Admin-only filter' }),
  })
  .openapi('ListCertificatesQuery');

export const certificateListResponseSchema =
  paginatedResponse(certificateSchema).openapi('CertificateListResponse');

export const certificateResponseSchema = z
  .object({ data: certificateSchema })
  .openapi('CertificateResponse');

/**
 * Public verification payload. Deliberately minimal: enough to confirm a
 * certificate is genuine, without exposing the certificates table or any
 * identifier that could be enumerated back into student data.
 */
export const certificateVerificationSchema = z
  .object({
    readable_id: readableIdSchema,
    student_name: z.string(),
    course_name: z.string(),
    issued_at: z.string().openapi({ format: 'date-time' }),
    valid: z.literal(true),
  })
  .openapi('CertificateVerification');

export const certificateVerificationResponseSchema = z
  .object({ data: certificateVerificationSchema })
  .openapi('CertificateVerificationResponse');

export const requestDeliverySchema = z
  .object({
    requested_delivery: z.boolean().default(true),
  })
  .openapi('RequestDeliveryRequest');

export type Certificate = z.infer<typeof certificateSchema>;
export type AdminCertificate = z.infer<typeof adminCertificateSchema>;
export type ListCertificatesQuery = z.infer<typeof listCertificatesQuerySchema>;
export type CertificateVerification = z.infer<typeof certificateVerificationSchema>;
