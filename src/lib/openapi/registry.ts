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
  createPurchaseSchema,
  listPurchasesQuerySchema,
  purchaseListResponseSchema,
  purchaseResponseSchema,
  updatePurchaseSchema,
} from '@/lib/schemas/purchases.schema';
import {
  createMessageResponseSchema,
  createMessageSchema,
  createSubmissionResponseSchema,
  createSubmissionSchema,
  listSubmissionsQuerySchema,
  messageListResponseSchema,
  submissionListResponseSchema,
} from '@/lib/schemas/task-submissions.schema';
import { courseProgressResponseSchema } from '@/lib/schemas/module-progress.schema';
import {
  certificateListResponseSchema,
  certificateResponseSchema,
  certificateVerificationResponseSchema,
  listCertificatesQuerySchema,
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
  method: 'patch',
  path: '/api/admin/users/{id}',
  tags: ['Users'],
  summary: "Update a user's role (admin)",
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
  summary: 'Add a message to the thread (student or admin)',
  description:
    'An admin may also set `status`; a student supplying it is ignored. Reaching `approved` marks the task done.',
  security,
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: createMessageSchema } } },
  },
  responses: { 201: json(createMessageResponseSchema, 'Created'), ...errors },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/submissions',
  tags: ['Submissions'],
  summary: 'List/filter all submissions (admin)',
  security,
  request: { query: listSubmissionsQuerySchema },
  responses: { 200: json(submissionListResponseSchema, 'Paginated submissions'), ...errors },
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
  responses: { 200: json(purchaseListResponseSchema, 'Paginated purchases'), ...errors },
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
    'Read-only. module_progress is written exclusively by the quiz-attempt and submission-approval routes.',
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
  path: '/api/admin/certificates',
  tags: ['Certificates'],
  summary: 'List all certificates and delivery requests (admin)',
  security,
  request: { query: listCertificatesQuerySchema },
  responses: { 200: json(certificateListResponseSchema, 'Paginated certificates'), ...errors },
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
