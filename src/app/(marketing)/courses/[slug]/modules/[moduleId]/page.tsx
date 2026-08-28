import { redirect } from 'next/navigation';
import Button from '@mui/material/Button';
import ContentCard from '@/components/layout/ContentCard';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/feedback/EmptyState';
import ModuleViewer from '@/components/student/ModuleViewer';
import { getAuthContext } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Modul' };

/**
 * One module, as a student works through it.
 *
 * ## Why this page guards itself
 *
 * It sits in the `(marketing)` route group, because its parent — the course page
 * at `/courses/[slug]` — is genuinely public. But `src/proxy.ts` gates on whole
 * URL prefixes and cannot express "everything under `/courses/:slug/modules`
 * but not `/courses/:slug` itself". So the check lives here, and any sibling
 * page added under `modules/` must repeat it.
 *
 * That is a deliberate trade for keeping one course URL that works for everyone.
 * If this subtree grows past a page or two, give it a layout and move the check
 * there once.
 *
 * ## What this checks, and what it doesn't
 *
 * Here: signed in, and either an admin or an approved purchase. **Not** the
 * sequential unlock — that needs the whole course's progress, which
 * `<ModuleViewer>` already fetches, so it is applied there rather than paying
 * for the query twice.
 *
 * The backend enforces both independently: `modules` RLS and
 * `/api/courses/:id/modules` require the purchase regardless, so these checks
 * decide what is *shown*, not what is *reachable*.
 */
export default async function ModuleViewPage(
  props: PageProps<'/courses/[slug]/modules/[moduleId]'>,
) {
  const { slug, moduleId } = await props.params;

  const auth = await getAuthContext();
  if (!auth) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/courses/${slug}/modules/${moduleId}`)}`);
  }

  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!course) {
    return (
      <PageContainer>
        <ContentCard>
          <EmptyState
            title="Kurs nije pronađen"
            description="Kurs ne postoji ili trenutno nije objavljen."
          />
        </ContentCard>
      </PageContainer>
    );
  }

  // Admins may preview any module; students need an approved purchase. A
  // teacher who owns the course reaches it through the admin screens, so this
  // stays the simple two-case check the student flow needs.
  if (auth.profile.role !== 'admin') {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', auth.userId)
      .eq('status', 'approved')
      .maybeSingle();

    if (!purchase) {
      return (
        <PageContainer>
          <ContentCard>
            <EmptyState
              title="Nemate pristup ovom modulu"
              description="Sadržaj je dostupan tek nakon što administrator odobri vaš zahtjev za pristup kursu."
              action={
                <Button href={`/courses/${course.slug}`} variant="contained">
                  Nazad na kurs
                </Button>
              }
            />
          </ContentCard>
        </PageContainer>
      );
    }
  }

  return (
    <ModuleViewer
      courseId={course.id}
      courseName={course.name}
      courseSlug={course.slug}
      moduleId={moduleId}
    />
  );
}
