import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from './zod';
import {
  errorResponseSchema,
  paginationQuerySchema,
  uuidSchema,
} from '@/lib/schemas/common.schema';
import {
  listUsersQuerySchema,
  meResponseSchema,
  updateUserSchema,
  userListResponseSchema,
  profileSchema,
} from '@/lib/schemas/users.schema';
import {
  categoryListResponseSchema,
  categoryResponseSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from '@/lib/schemas/categories.schema';
import {
  courseListResponseSchema,
  courseResponseSchema,
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
  courseStatsResponseSchema,
} from '@/lib/schemas/courses.schema';
import {
  courseOutlineResponseSchema,
  createModuleFileSchema,
  createModuleSchema,
  listModulesQuerySchema,
  moduleFileResponseSchema,
  moduleListResponseSchema,
  moduleResponseSchema,
  updateModuleSchema,
} from '@/lib/schemas/modules.schema';
import {
  adminQuizResponseSchema,
  createQuizSchema,
  quizAttemptResponseSchema,
  quizAttemptSchema,
  quizForTakingResponseSchema,
  updateQuizSchema,
} from '@/lib/schemas/quizzes.schema';
import {
  createTaskFileSchema,
  createTaskSchema,
  taskFileResponseSchema,
  taskResponseSchema,
  updateTaskSchema,
} from '@/lib/schemas/tasks.schema';
import {
  adminPurchaseListResponseSchema,
  adminPurchaseResponseSchema,
  createPurchaseSchema,
  listPurchasesQuerySchema,
  purchaseListResponseSchema,
  purchaseResponseSchema,
  updatePurchaseSchema,
} from '@/lib/schemas/purchases.schema';
import {
  adminSubmissionListResponseSchema,
  adminSubmissionResponseSchema,
  createMessageResponseSchema,
  createMessageSchema,
  createSubmissionResponseSchema,
  createSubmissionSchema,
  listSubmissionsQuerySchema,
  messageListResponseSchema,
  submissionListResponseSchema,
  taskMessageSchema,
  updateMessageSchema,
} from '@/lib/schemas/task-submissions.schema';
import {
  completeModuleResponseSchema,
  courseProgressResponseSchema,
} from '@/lib/schemas/module-progress.schema';
import {
  createIssueMessageResponseSchema,
  createIssueMessageSchema,
  createIssueResponseSchema,
  createIssueSchema,
  issueListResponseSchema,
  issueMessageListResponseSchema,
  issueResponseSchema,
  listIssuesQuerySchema,
} from '@/lib/schemas/issues.schema';
import {
  listNotificationsQuerySchema,
  markAllReadResponseSchema,
  notificationListResponseSchema,
  notificationPreferencesResponseSchema,
  notificationResponseSchema,
  updateNotificationPreferencesSchema,
} from '@/lib/schemas/notifications.schema';
import {
  adminCertificateListResponseSchema,
  adminCertificateResponseSchema,
  certificateListResponseSchema,
  certificateResponseSchema,
  certificateVerificationResponseSchema,
  listCertificatesQuerySchema,
  markDeliveredSchema,
  requestDeliverySchema,
} from '@/lib/schemas/certificates.schema';
import {
  bucketNameSchema,
  uploadFolderSchema,
  uploadResponseSchema,
} from '@/lib/schemas/uploads.schema';

export const registry = new OpenAPIRegistry();

/**
 * Sessions are carried by the Supabase auth cookie, so "Try it out" works
 * straight from a signed-in browser with no token to paste.
 */
const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'sb-access-token',
  description: 'Supabase session cookie, set automatically after signing in.',
});

const security = [{ [cookieAuth.name]: [] }];

/* -------------------------------------------------------------------------- */
/* Response helpers                                                            */
/* -------------------------------------------------------------------------- */

const json = (schema: z.ZodType, description: string) => ({
  description,
  content: { 'application/json': { schema } },
});

const errors = {
  400: json(errorResponseSchema, 'Validation failed'),
  401: json(errorResponseSchema, 'Not authenticated'),
  403: json(errorResponseSchema, 'Not authorized'),
  404: json(errorResponseSchema, 'Not found'),
};

const idParam = z.object({ id: uuidSchema });

/* -------------------------------------------------------------------------- */
/* Auth / Users                                                                */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/me',
  tags: ['Users'],
  summary: 'Current profile + role',
  security,
  responses: { 200: json(meResponseSchema, 'The signed-in profile'), 401: errors[401] },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/users',
  tags: ['Users'],
  summary: 'List/search users (admin)',
  security,
  request: { query: listUsersQuerySchema },
  responses: { 200: json(userListResponseSchema, 'Paginated users'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/users/{id}',
  tags: ['Users'],
  summary: 'Get one profile (admin)',
  security,
  request: { params: idParam },
  responses: { 200: json(z.object({ data: profileSchema }), 'The profile'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/users/{id}',
  tags: ['Users'],
  summary: "Update a user's name, role or activation state (admin)",
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateUserSchema } } },
  },
  responses: { 200: json(z.object({ data: profileSchema }), 'Updated profile'), ...errors },
});

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/categories',
  tags: ['Categories'],
  summary: 'List categories (public)',
  request: { query: listCategoriesQuerySchema },
  responses: { 200: json(categoryListResponseSchema, 'Paginated categories') },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/categories',
  tags: ['Categories'],
  summary: 'Create a category (admin)',
  security,
  request: { body: { content: { 'application/json': { schema: createCategorySchema } } } },
  responses: { 201: json(categoryResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/categories/{id}',
  tags: ['Categories'],
  summary: 'Update a category (admin)',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateCategorySchema } } },
  },
  responses: { 200: json(categoryResponseSchema, 'Updated'), ...errors },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/categories/{id}',
  tags: ['Categories'],
  summary: 'Delete a category (admin)',
  security,
  request: { params: idParam },
  responses: { 204: { description: 'Deleted' }, ...errors },
});

/* -------------------------------------------------------------------------- */
/* Courses                                                                     */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/courses',
  tags: ['Courses'],
  summary: 'List published courses (public)',
  request: { query: listCoursesQuerySchema },
  responses: { 200: json(courseListResponseSchema, 'Paginated courses') },
});

registry.registerPath({
  method: 'get',
  path: '/api/courses/{courseId}',
  tags: ['Courses'],
  summary: 'Get a published course (public)',
  request: { params: z.object({ courseId: uuidSchema }) },
  responses: { 200: json(courseResponseSchema, 'The course'), 404: errors[404] },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/courses',
  tags: ['Courses'],
  summary: 'List all courses including unpublished (admin)',
  security,
  request: { query: listCoursesQuerySchema },
  responses: { 200: json(courseListResponseSchema, 'Paginated courses'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/courses',
  tags: ['Courses'],
  summary: 'Create a course (admin)',
  security,
  request: { body: { content: { 'application/json': { schema: createCourseSchema } } } },
  responses: { 201: json(courseResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/courses/{id}',
  tags: ['Courses'],
  summary: 'Get a course in any publish state (admin)',
  security,
  request: { params: idParam },
  responses: { 200: json(courseResponseSchema, 'The course'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/courses/{id}',
  tags: ['Courses'],
  summary: 'Update a course (admin)',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateCourseSchema } } },
  },
  responses: { 200: json(courseResponseSchema, 'Updated'), ...errors },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/courses/{id}',
  tags: ['Courses'],
  summary: 'Delete a course (admin)',
  security,
  request: { params: idParam },
  responses: { 204: { description: 'Deleted' }, ...errors },
});

/* -------------------------------------------------------------------------- */
/* Modules                                                                     */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/courses/{courseId}/modules',
  tags: ['Modules'],
  summary: 'List modules for a purchased course (student)',
  description: 'Requires an approved purchase for the course.',
  security,
  request: { params: z.object({ courseId: uuidSchema }), query: listModulesQuerySchema },
  responses: { 200: json(moduleListResponseSchema, 'Paginated modules'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/courses/{courseId}/outline',
  tags: ['Modules'],
  summary: 'Module titles of a published course (public)',
  description:
    'Unauthenticated. Returns only `id`, `title` and `order` for each module — the syllabus a visitor needs in order to decide whether to buy, and nothing more. Full module content requires an approved purchase via `/api/courses/{courseId}/modules`. Unpublished courses return 404.',
  request: { params: z.object({ courseId: uuidSchema }) },
  responses: {
    200: json(courseOutlineResponseSchema, 'Module titles, ordered'),
    404: errors[404],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/modules',
  tags: ['Modules'],
  summary: 'Create a module (admin)',
  security,
  request: { body: { content: { 'application/json': { schema: createModuleSchema } } } },
  responses: { 201: json(moduleResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/modules/{id}',
  tags: ['Modules'],
  summary: 'Update a module (admin)',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateModuleSchema } } },
  },
  responses: { 200: json(moduleResponseSchema, 'Updated'), ...errors },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/modules/{id}',
  tags: ['Modules'],
  summary: 'Delete a module (admin)',
  security,
  request: { params: idParam },
  responses: { 204: { description: 'Deleted' }, ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/modules/{id}/files',
  tags: ['Modules'],
  summary: 'Register an uploaded module file (admin)',
  description:
    'The binary is uploaded directly to the module-files bucket; this records the object path.',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: createModuleFileSchema } } },
  },
  responses: { 201: json(moduleFileResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/module-files/{id}',
  tags: ['Modules'],
  summary: 'Delete a module file (admin)',
  security,
  request: { params: idParam },
  responses: { 204: { description: 'Deleted' }, ...errors },
});

/* -------------------------------------------------------------------------- */
/* Quizzes                                                                     */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/modules/{moduleId}/quiz',
  tags: ['Quizzes'],
  summary: 'Get a quiz for taking (student)',
  description:
    'Purchase-gated. The correct-answer flag lives in a separate admin-only table and is never part of this payload.',
  security,
  request: { params: z.object({ moduleId: uuidSchema }) },
  responses: { 200: json(quizForTakingResponseSchema, 'Quiz without the answer key'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/modules/{moduleId}/quiz/attempt',
  tags: ['Quizzes'],
  summary: 'Submit a quiz attempt (student)',
  description:
    'Scored server-side. On pass, marks quiz_done and may complete the module and issue a certificate.',
  security,
  request: {
    params: z.object({ moduleId: uuidSchema }),
    body: { content: { 'application/json': { schema: quizAttemptSchema } } },
  },
  responses: { 200: json(quizAttemptResponseSchema, 'Attempt result'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/quizzes',
  tags: ['Quizzes'],
  summary: 'Create a quiz with questions and answers (admin)',
  security,
  request: { body: { content: { 'application/json': { schema: createQuizSchema } } } },
  responses: { 201: json(adminQuizResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/modules/{id}/quiz',
  tags: ['Quizzes'],
  summary: "Get a module's quiz for authoring, including the answer key (staff)",
  security,
  request: { params: idParam },
  responses: { 200: json(adminQuizResponseSchema, 'The quiz'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/quizzes/{id}',
  tags: ['Quizzes'],
  summary: 'Get a quiz including the answer key (admin)',
  security,
  request: { params: idParam },
  responses: { 200: json(adminQuizResponseSchema, 'The quiz'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/quizzes/{id}',
  tags: ['Quizzes'],
  summary: 'Update a quiz (admin)',
  description: 'Supplying `questions` replaces the existing set wholesale.',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateQuizSchema } } },
  },
  responses: { 200: json(adminQuizResponseSchema, 'Updated'), ...errors },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/quizzes/{id}',
  tags: ['Quizzes'],
  summary: 'Delete a quiz (admin)',
  security,
  request: { params: idParam },
  responses: { 204: { description: 'Deleted' }, ...errors },
});

/* -------------------------------------------------------------------------- */
/* Tasks                                                                       */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/modules/{moduleId}/task',
  tags: ['Tasks'],
  summary: 'Get the task for a module (student)',
  security,
  request: { params: z.object({ moduleId: uuidSchema }) },
  responses: { 200: json(taskResponseSchema, 'The task'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/tasks',
  tags: ['Tasks'],
  summary: 'Create a task (admin)',
  security,
  request: { body: { content: { 'application/json': { schema: createTaskSchema } } } },
  responses: { 201: json(taskResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Update a task (admin)',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateTaskSchema } } },
  },
  responses: { 200: json(taskResponseSchema, 'Updated'), ...errors },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Delete a task (admin)',
  security,
  request: { params: idParam },
  responses: { 204: { description: 'Deleted' }, ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/tasks/{id}/files',
  tags: ['Tasks'],
  summary: 'Register an uploaded task file (admin)',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: createTaskFileSchema } } },
  },
  responses: { 201: json(taskFileResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/task-files/{id}',
  tags: ['Tasks'],
  summary: 'Delete a task file (admin)',
  security,
  request: { params: idParam },
  responses: { 204: { description: 'Deleted' }, ...errors },
});

/* -------------------------------------------------------------------------- */
/* Submissions                                                                 */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'post',
  path: '/api/tasks/{taskId}/submissions',
  tags: ['Submissions'],
  summary: 'Open a submission thread with a first message (student)',
  security,
  request: {
    params: z.object({ taskId: uuidSchema }),
    body: { content: { 'application/json': { schema: createSubmissionSchema } } },
  },
  responses: { 201: json(createSubmissionResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/submissions/{id}/messages',
  tags: ['Submissions'],
  summary: 'List the message thread (participants only)',
  security,
  request: { params: idParam, query: paginationQuerySchema },
  responses: { 200: json(messageListResponseSchema, 'Paginated messages'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/submissions/{id}/messages',
  tags: ['Submissions'],
  summary: 'Add a message to the thread (student or reviewer)',
  description: [
    'A **reviewer** — an admin, or the teacher who owns the course — may also set',
    '`status`; a student supplying it is ignored rather than rejected, so both',
    'sides use the same endpoint. Reaching `approved` marks the task done and may',
    'complete the module and issue a certificate.',
    '',
    '`approved` also **closes the thread**: every later message on that submission',
    'is refused with 409, for the student and the reviewer alike.',
  ].join(' '),
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: createMessageSchema } } },
  },
  responses: {
    201: json(createMessageResponseSchema, 'Created'),
    ...errors,
    409: json(errorResponseSchema, 'The submission is approved and the thread is closed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/tasks/{taskId}/submissions',
  tags: ['Submissions'],
  summary: 'List your own submissions for a task (student)',
  description:
    'Scoped to the caller explicitly, not by RLS alone — the select policy also admits admins and the reviewing teacher. Newest first, so the first row is the current one.',
  security,
  request: { params: z.object({ taskId: uuidSchema }), query: paginationQuerySchema },
  responses: { 200: json(submissionListResponseSchema, 'Paginated submissions'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/messages/{id}',
  tags: ['Submissions'],
  summary: 'Attach a file to a message that already exists',
  description: [
    'Only needed for the **first** message of a submission: its attachment cannot',
    'be uploaded until the submission exists, because the storage path is keyed on',
    'the submission id. Replies upload first and post the path with the message.',
    '',
    'Sender only, once only — an attachment already set cannot be swapped.',
  ].join(' '),
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updateMessageSchema } } },
  },
  responses: {
    200: json(z.object({ data: taskMessageSchema }), 'Updated'),
    ...errors,
    409: json(errorResponseSchema, 'Already has an attachment, or the thread is closed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/messages/{id}/attachment',
  tags: ['Submissions'],
  summary: "Download a message's attachment",
  description:
    'Streams the object through the app rather than handing out a signed URL. `Content-Disposition: attachment` — unlike module materials, submission attachments are meant to be downloaded.',
  security,
  request: { params: idParam },
  responses: {
    200: { description: 'The file' },
    ...errors,
    502: json(errorResponseSchema, 'Storage could not be read'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/submissions/{id}/attachments',
  tags: ['Submissions'],
  summary: 'Upload a file for one submission thread',
  description: [
    'Accepts `multipart/form-data`. Exists because `/api/admin/uploads` is',
    'staff-only, which left students unable to attach anything at all. The',
    'submission id comes from the path, not a client-supplied `folder`, so an',
    'upload cannot be aimed at a thread the caller is not part of.',
    '',
    'Open to both participants, and refused once the submission is approved.',
  ].join(' '),
  security,
  request: {
    params: idParam,
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({ file: z.string().openapi({ type: 'string', format: 'binary' }) }),
        },
      },
    },
  },
  responses: {
    201: json(uploadResponseSchema, 'Uploaded'),
    ...errors,
    409: json(errorResponseSchema, 'The submission is approved and the thread is closed'),
    413: json(errorResponseSchema, 'File too large'),
    502: json(errorResponseSchema, 'Storage rejected the upload'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/submissions',
  tags: ['Submissions'],
  summary: 'List/filter submissions (staff)',
  description:
    'Scoped by RLS: an admin sees every submission, a teacher only those on courses they own. Rows carry the student and the task -> module -> course chain.',
  security,
  request: { query: listSubmissionsQuerySchema },
  responses: { 200: json(adminSubmissionListResponseSchema, 'Paginated submissions'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/submissions/{id}',
  tags: ['Submissions'],
  summary: 'Get one submission (staff)',
  security,
  request: { params: idParam },
  responses: { 200: json(adminSubmissionResponseSchema, 'The submission'), ...errors },
});

/* -------------------------------------------------------------------------- */
/* Purchases                                                                   */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/purchases',
  tags: ['Purchases'],
  summary: 'List your own purchases (student)',
  security,
  request: { query: listPurchasesQuerySchema },
  responses: { 200: json(purchaseListResponseSchema, 'Paginated purchases'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/purchases',
  tags: ['Purchases'],
  summary: 'Request a purchase (student)',
  description: 'Price is snapshotted server-side from the course; status is always `requested`.',
  security,
  request: { body: { content: { 'application/json': { schema: createPurchaseSchema } } } },
  responses: { 201: json(purchaseResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/purchases',
  tags: ['Purchases'],
  summary: 'List/filter all purchases (admin)',
  security,
  request: { query: listPurchasesQuerySchema },
  responses: { 200: json(adminPurchaseListResponseSchema, 'Paginated purchases'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/purchases/{id}',
  tags: ['Purchases'],
  summary: 'Get one purchase with course + student (admin)',
  security,
  request: { params: idParam },
  responses: { 200: json(adminPurchaseResponseSchema, 'The purchase'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/purchases/{id}',
  tags: ['Purchases'],
  summary: 'Approve or deny a purchase (admin)',
  description: 'Approving grants access to the course content.',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updatePurchaseSchema } } },
  },
  responses: { 200: json(purchaseResponseSchema, 'Updated'), ...errors },
});

/* -------------------------------------------------------------------------- */
/* Progress                                                                    */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/courses/{courseId}/progress',
  tags: ['Progress'],
  summary: 'Your progress across a course (student)',
  description:
    'Read-only. `module_progress` is written by the quiz-attempt, submission-approval and module-complete routes.',
  security,
  request: { params: z.object({ courseId: uuidSchema }) },
  responses: { 200: json(courseProgressResponseSchema, 'Course progress'), ...errors },
});

/* -------------------------------------------------------------------------- */
/* Certificates                                                                */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/certificates',
  tags: ['Certificates'],
  summary: 'List your own certificates (student)',
  security,
  request: { query: listCertificatesQuerySchema },
  responses: { 200: json(certificateListResponseSchema, 'Paginated certificates'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/certificates/{certificateId}',
  tags: ['Certificates'],
  summary: 'Public certificate verification',
  description:
    'Unauthenticated. Accepts the readable id (CERT-YYYY-NNNN) or the uuid, and returns a minimal verification payload.',
  request: { params: z.object({ certificateId: z.string() }) },
  responses: {
    200: json(certificateVerificationResponseSchema, 'Verified certificate'),
    404: errors[404],
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/certificates/{certificateId}/request-delivery',
  tags: ['Certificates'],
  summary: 'Request physical delivery (student)',
  security,
  request: {
    params: z.object({ certificateId: uuidSchema }),
    body: { content: { 'application/json': { schema: requestDeliverySchema } } },
  },
  responses: { 200: json(certificateResponseSchema, 'Updated'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/certificates/{certificateId}/pdf',
  tags: ['Certificates'],
  summary: 'The certificate as an A4 PDF',
  description: [
    'Public, matching the verification endpoint beside it, and carrying exactly the',
    'same four facts. Accepts the readable id or the uuid.',
    '',
    'Inline by default so the page can preview it; `?download` switches',
    '`Content-Disposition` to `attachment`. One route serves both so the preview and',
    'the download cannot drift apart.',
  ].join(' '),
  request: { params: z.object({ certificateId: z.string() }) },
  responses: {
    200: { description: 'application/pdf, A4 landscape, one page' },
    404: json(errorResponseSchema, 'No certificate for that identifier'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/certificates',
  tags: ['Certificates'],
  summary: 'List all certificates and delivery requests (admin)',
  security,
  request: { query: listCertificatesQuerySchema },
  responses: { 200: json(adminCertificateListResponseSchema, 'Paginated certificates'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/certificates/{id}',
  tags: ['Certificates'],
  summary: 'Get one certificate with course + student (staff)',
  security,
  request: { params: idParam },
  responses: { 200: json(adminCertificateResponseSchema, 'The certificate'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/certificates/{id}',
  tags: ['Certificates'],
  summary: 'Mark a printed certificate as posted (admin)',
  description: [
    'Sets `delivered_at` and `delivered_by`, added in migration 0024. It never touches',
    "`requested_delivery` — that is the *student's* flag, set through",
    '/api/certificates/{certificateId}/request-delivery, and the two together are the',
    'two halves of one exchange.',
    '',
    'Admin only, unlike the GET beside it: posting something physical has no course',
    'scope, and `certificates_admin_update` is the matching database rule. Reversible',
    'with `delivered: false`. Marking sent notifies the student; un-marking does not.',
  ].join(' '),
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: markDeliveredSchema } } },
  },
  responses: { 200: json(adminCertificateResponseSchema, 'The certificate'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/modules/{moduleId}/complete',
  tags: ['Progress'],
  summary: 'Mark a module with no quiz and no task as completed',
  description: [
    'The third writer of `module_progress`, alongside the quiz-attempt and',
    'submission-approval routes. A module with neither a quiz nor a task had no',
    'writer at all, so no progress row was ever created and it stayed incomplete',
    'forever — which under sequential unlock strands the student on it.',
    '',
    '**409 when the module has a quiz or a task.** Without that this endpoint would',
    'be a way to skip them. Idempotent; issues a certificate if it completes the',
    'final module of a course.',
  ].join(' '),
  security,
  request: { params: z.object({ moduleId: uuidSchema }) },
  responses: {
    200: json(completeModuleResponseSchema, 'The resulting progress'),
    ...errors,
    409: json(errorResponseSchema, 'The module has a quiz or a task'),
  },
});

/* -------------------------------------------------------------------------- */
/* Support issues                                                              */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/issues',
  tags: ['Issues'],
  summary: 'List issues — your own, or all of them for an admin',
  description:
    "One endpoint for both sides. RLS returns the caller's own issues, or every issue when the caller is an admin. Teachers get no special access: an issue may be about a teacher.",
  security,
  request: { query: listIssuesQuerySchema },
  responses: { 200: json(issueListResponseSchema, 'Paginated issues'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/issues',
  tags: ['Issues'],
  summary: 'Open an issue, with its first message',
  security,
  request: { body: { content: { 'application/json': { schema: createIssueSchema } } } },
  responses: { 201: json(createIssueResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/issues/{id}',
  tags: ['Issues'],
  summary: 'Get one issue',
  security,
  request: { params: idParam },
  responses: { 200: json(issueResponseSchema, 'The issue'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/issues/{id}/messages',
  tags: ['Issues'],
  summary: 'The issue thread, oldest first',
  security,
  request: { params: idParam, query: paginationQuerySchema },
  responses: { 200: json(issueMessageListResponseSchema, 'Paginated messages'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/issues/{id}/messages',
  tags: ['Issues'],
  summary: 'Reply to an issue (reporter or admin)',
  description: [
    'An admin may set `status` alongside the reply; a reporter supplying it is',
    'ignored, so one endpoint serves both sides.',
    '',
    '**Closing is not final.** A reporter replying to a closed issue re-opens it',
    'automatically — the person best placed to disagree that something is resolved',
    'is the one who raised it. An admin replying to a closed issue must say what',
    'should happen to it (409 otherwise).',
  ].join(' '),
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: createIssueMessageSchema } } },
  },
  responses: {
    201: json(createIssueMessageResponseSchema, 'Created'),
    ...errors,
    409: json(errorResponseSchema, 'Closed issue needs an explicit status'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/courses/{id}/stats',
  tags: ['Courses'],
  summary: 'Enrolment and progress for one course (staff)',
  description:
    'Admin, or the teacher who owns the course. Runs with the service role because `module_progress` grants staff nothing at all — the ownership check is the access control.',
  security,
  request: { params: idParam },
  responses: { 200: json(courseStatsResponseSchema, 'Course statistics'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/task-files/{id}/content',
  tags: ['Tasks'],
  summary: 'Download a file attached to a task brief',
  description:
    'The twin of `/api/module-files/{id}/content`, with the opposite `Content-Disposition`: a module material is read in the app and never handed over, while a task file is a working document meant to be opened elsewhere.',
  security,
  request: { params: idParam },
  responses: {
    200: { description: 'The file' },
    ...errors,
    502: json(errorResponseSchema, 'Storage could not be read'),
  },
});

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'get',
  path: '/api/notifications',
  tags: ['Notifications'],
  summary: 'Your own notifications, newest first',
  description: [
    'Also serves as the unread counter: ask for `?unread=true&pageSize=1` and read',
    '`meta.total`. There is deliberately no separate count endpoint — the partial',
    'index `notifications_unread_idx` is what makes that cheap.',
  ].join(' '),
  security,
  request: { query: listNotificationsQuerySchema },
  responses: { 200: json(notificationListResponseSchema, 'Paginated notifications'), ...errors },
});

registry.registerPath({
  method: 'patch',
  path: '/api/notifications/{id}/read',
  tags: ['Notifications'],
  summary: 'Mark one notification as read',
  description:
    'Idempotent — marking an already-read notification keeps the original timestamp. `notifications` has no UPDATE policy on purpose (RLS cannot restrict columns, and one would also permit rewriting the text), so ownership is checked in the route and the write uses the service role.',
  security,
  request: { params: idParam },
  responses: { 200: json(notificationResponseSchema, 'The notification'), ...errors },
});

registry.registerPath({
  method: 'post',
  path: '/api/notifications/read-all',
  tags: ['Notifications'],
  summary: 'Mark all of your notifications as read',
  security,
  responses: { 200: json(markAllReadResponseSchema, 'How many were marked'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/notification-preferences',
  tags: ['Notifications'],
  summary: 'Your notification settings, with defaults filled in',
  description: [
    'The stored table is sparse — a row exists only once a switch has been changed —',
    'and a missing row means both channels are on. This returns the complete matrix',
    "for the caller's role so no client has to encode that rule.",
    '',
    '`meta.email_configured` reports whether mail can actually be sent.',
  ].join(' '),
  security,
  responses: {
    200: json(notificationPreferencesResponseSchema, 'The full matrix'),
    ...errors,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/notification-preferences',
  tags: ['Notifications'],
  summary: 'Change notification settings',
  description:
    "Send only what changed; an unmentioned channel keeps its current value. Returns the whole refreshed matrix. Types the caller's role can never receive are ignored rather than rejected.",
  security,
  request: {
    body: { content: { 'application/json': { schema: updateNotificationPreferencesSchema } } },
  },
  responses: { 200: json(notificationPreferencesResponseSchema, 'The full matrix'), ...errors },
});

/* -------------------------------------------------------------------------- */
/* Uploads                                                                     */
/* -------------------------------------------------------------------------- */

registry.registerPath({
  method: 'post',
  path: '/api/admin/uploads',
  tags: ['Uploads'],
  summary: 'Upload a file to a storage bucket (admin)',
  description: [
    'Accepts `multipart/form-data`, not JSON. `folder` is the `/`-joined list of',
    "id segments the bucket's path convention requires — `{course_id}` for",
    '`course-thumbnails`, `{course_id}/{module_id}` for `module-files` and',
    '`task-files`, `{submission_id}` for `task-message-attachments`. The storage',
    'RLS policies parse those segments back out to decide who may read the object,',
    'so the depth is validated rather than assumed.',
    '',
    'Returns the stored object path. Persisting it to the owning record (e.g.',
    '`courses.thumbnail_path`) is a separate call.',
  ].join(' '),
  security,
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            bucket: bucketNameSchema,
            folder: uploadFolderSchema,
            file: z.string().openapi({ type: 'string', format: 'binary' }),
          }),
        },
      },
    },
  },
  responses: {
    201: json(uploadResponseSchema, 'Uploaded'),
    ...errors,
    413: json(errorResponseSchema, 'File too large'),
    502: json(errorResponseSchema, 'Storage rejected the upload'),
  },
});
