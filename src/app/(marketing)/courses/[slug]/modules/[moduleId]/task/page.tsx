import ModuleAccessDenied from '@/components/student/ModuleAccessDenied';
import TaskWorkspace from '@/components/student/TaskWorkspace';
import { checkModulePageAccess } from '@/lib/auth/modulePageAccess';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Zadatak' };

/**
 * A student's task screen: the brief, and the thread about their solution.
 *
 * Access is the shared `/courses/[slug]/modules/...` guard — see
 * `checkModulePageAccess`. The module title is resolved here so breadcrumbs are
 * correct on first paint; the task itself comes from `/api/modules/:id/task`.
 */
export default async function ModuleTaskPage(
  props: PageProps<'/courses/[slug]/modules/[moduleId]/task'>,
) {
  const { slug, moduleId } = await props.params;

  const access = await checkModulePageAccess(slug, `/courses/${slug}/modules/${moduleId}/task`);
  if (!access.ok) return <ModuleAccessDenied reason={access.reason} slug={slug} />;

  const supabase = await createClient();
  const { data: currentModule } = await supabase
    .from('modules')
    .select('title')
    .eq('id', moduleId)
    .eq('course_id', access.course.id)
    .maybeSingle();

  if (!currentModule) return <ModuleAccessDenied reason="no-access" slug={slug} />;

  return (
    <TaskWorkspace
      courseSlug={access.course.slug}
      courseName={access.course.name}
      moduleId={moduleId}
      moduleTitle={currentModule.title}
    />
  );
}
