import ModuleAccessDenied from '@/components/student/ModuleAccessDenied';
import QuizTaker from '@/components/student/QuizTaker';
import { checkModulePageAccess } from '@/lib/auth/modulePageAccess';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Kviz' };

/**
 * Taking a module's quiz.
 *
 * Access is the shared `/courses/[slug]/modules/...` guard — see
 * `checkModulePageAccess` for why these pages check for themselves rather than
 * relying on `proxy.ts`.
 *
 * The module title is read here so the breadcrumbs are right on first paint;
 * everything else the screen needs comes from `/api/modules/:id/quiz`.
 */
export default async function ModuleQuizPage(
  props: PageProps<'/courses/[slug]/modules/[moduleId]/quiz'>,
) {
  const { slug, moduleId } = await props.params;

  const access = await checkModulePageAccess(slug, `/courses/${slug}/modules/${moduleId}/quiz`);
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
    <QuizTaker
      courseId={access.course.id}
      courseSlug={access.course.slug}
      courseName={access.course.name}
      moduleId={moduleId}
      moduleTitle={currentModule.title}
    />
  );
}
