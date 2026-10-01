import ModuleAccessDenied from '@/components/student/ModuleAccessDenied';
import ModuleViewer from '@/components/student/ModuleViewer';
import { checkModulePageAccess } from '@/lib/auth/modulePageAccess';
import { NO_INDEX } from '@/lib/seo';

// Gated course content: never indexed, even though the URL sits under the public /courses.
export const metadata = { title: 'Modul', robots: NO_INDEX };

/**
 * One module, as a student works through it.
 *
 * Access is the shared `/courses/[slug]/modules/...` guard — see
 * `checkModulePageAccess` for why these pages check for themselves rather than
 * relying on `proxy.ts`, and for who is let in.
 *
 * This page used to carry its own copy of that check. The copy only knew about
 * admins and students, so the teacher who owns a course was told to buy it —
 * exactly the drift the shared guard exists to prevent. The quiz and task pages
 * beside this one already used it.
 *
 * The sequential unlock is **not** checked here: it needs the whole course's
 * progress, which `<ModuleViewer>` already fetches, so it is applied there.
 */
export default async function ModuleViewPage(
  props: PageProps<'/courses/[slug]/modules/[moduleId]'>,
) {
  const { slug, moduleId } = await props.params;

  const access = await checkModulePageAccess(slug, `/courses/${slug}/modules/${moduleId}`);
  if (!access.ok) return <ModuleAccessDenied reason={access.reason} slug={slug} />;

  return (
    <ModuleViewer
      courseId={access.course.id}
      courseName={access.course.name}
      courseSlug={access.course.slug}
      courseOwnerId={access.course.owner_id}
      moduleId={moduleId}
    />
  );
}
