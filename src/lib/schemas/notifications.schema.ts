import { z } from '@/lib/openapi/zod';
import {
  booleanQueryParam,
  paginatedResponse,
  paginationQuerySchema,
  timestampSchema,
  uuidSchema,
} from './common.schema';
import { NOTIFICATION_TYPES } from '@/lib/notifications/catalog';

/**
 * The enum, restated for zod.
 *
 * Built from `NOTIFICATION_CATALOG`'s keys rather than typed out again, so the
 * catalogue stays the single place a notification type is declared. The cast is
 * what `z.enum` needs — it wants a non-empty tuple, and `Object.keys` only
 * promises an array.
 */
export const notificationTypeSchema = z
  .enum(NOTIFICATION_TYPES as [string, ...string[]])
  .openapi('NotificationType');

export const notificationSchema = z
  .object({
    id: uuidSchema,
    user_id: uuidSchema,
    type: notificationTypeSchema,
    title: z.string(),
    body: z.string(),
    link: z.string().nullable().openapi({
      description: 'In-app path to open. May point at something since deleted.',
    }),
    read_at: timestampSchema.nullable(),
    created_at: timestampSchema,
  })
  .openapi('Notification');

export const listNotificationsQuerySchema = paginationQuerySchema
  .extend({
    unread: booleanQueryParam().optional().openapi({ description: 'Only unread notifications' }),
  })
  .openapi('ListNotificationsQuery');

export const notificationListResponseSchema = paginatedResponse(notificationSchema).openapi(
  'NotificationListResponse',
);

export const notificationResponseSchema = z
  .object({ data: notificationSchema })
  .openapi('NotificationResponse');

export const markAllReadResponseSchema = z
  .object({ data: z.object({ marked: z.number().int() }) })
  .openapi('MarkAllReadResponse');

/* -------------------------------------------------------------------------- */
/* Preferences                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One row of the settings matrix.
 *
 * This is the *merged* shape, not the table's. `notification_preferences` is
 * sparse — a row exists only once a user changes something — so the endpoint
 * fills the gaps with the defaults and hands back a complete matrix. No client
 * should have to know that a missing row means "yes".
 */
export const notificationPreferenceSchema = z
  .object({
    type: notificationTypeSchema,
    email_enabled: z.boolean(),
    in_app_enabled: z.boolean(),
  })
  .openapi('NotificationPreference');

export const notificationPreferencesResponseSchema = z
  .object({
    data: z.array(notificationPreferenceSchema),
    meta: z.object({
      /**
       * Whether mail can actually leave the building. The settings screen says
       * so plainly rather than letting someone switch on an email that no
       * amount of waiting will produce.
       */
      email_configured: z.boolean(),
    }),
  })
  .openapi('NotificationPreferencesResponse');

/**
 * A partial update: send only the rows that changed.
 *
 * Both flags are optional per row so a single toggle is a single small request,
 * and an unmentioned channel keeps whatever it had.
 */
export const updateNotificationPreferencesSchema = z
  .object({
    preferences: z
      .array(
        z.object({
          type: notificationTypeSchema,
          email_enabled: z.boolean().optional(),
          in_app_enabled: z.boolean().optional(),
        }),
      )
      .min(1),
  })
  .openapi('UpdateNotificationPreferencesRequest');

export type Notification = z.infer<typeof notificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
export type NotificationPreferencesResponse = z.infer<typeof notificationPreferencesResponseSchema>;
export type UpdateNotificationPreferencesRequest = z.infer<
  typeof updateNotificationPreferencesSchema
>;
