import { redirect } from 'next/navigation';
import Button from '@mui/material/Button';
import ContentCard from '@/components/layout/ContentCard';
import PageContainer from '@/components/layout/PageContainer';
import PlaceholderPage from '@/components/layout/PlaceholderPage';
import EmptyState from '@/components/feedback/EmptyState';
import { getAuthContext } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Modul' };

/**
 * Module content — not yet built, but already gated.
 *
 * ## Why this page guards itself
 *
 * It sits in the `(public)` route group, because its parent — the course page
 * at `/courses/[id]` — is genuinely public. But `src/proxy.ts` gates on whole
 * URL prefixes (`/dashboard`, `/admin`) and cannot express "everything under
 * `/courses/:id/modules` but not `/courses/:id` itself". So the check lives
 * here, in the page, and any sibling page added under `modules/` must repeat it.
 *
 * That is a deliberate trade for keeping one course URL that works for
 * everyone. If this subtree grows past a page or two, give it a layout and move
 * the check there once.
 *
 * The backend enforces the same rule regardless: `modules` RLS and
 * `/api/courses/:id/modules` both require an approved purchase, so this check
 * decides what is *shown*, not what is *reachable*.
 */
export default async function ModuleViewPage(props: PageProps<'/courses/[id]/modules/[moduleId]'>) {
  const { id: courseId, moduleId } = await props.params;

  const auth = await getAuthContext();
  if (!auth) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/courses/${courseId}/modules/${moduleId}`)}`);
  }

  // Admins may preview any module; students need an approved purchase.
  if (auth.profile.role !== 'admin') {
    const supabase = await createClient();
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', auth.userId)
      .eq('status', 'approved')
      .maybeSingle();

    if (!purchase) {
      return (
        <PageContainer>
          <ContentCard>
            <EmptyState
              title="Nemate pristup ovom modulu"
              description="Sadržaj je dostupan tek nakon što administrator odobri vaš zahtev za pristup kursu."
              action={
                <Button href={`/courses/${courseId}`} variant="contained">
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
    <PlaceholderPage
      title="Modul"
      description={`Modul: ${moduleId}`}
      plannedWork={[
        'Video plejer ako modul ima video_url.',
        'Lista materijala za preuzimanje (module_files) — potrebni su potpisani URL-ovi, bucket nije javan.',
        'Linkovi ka kvizu i zadatku, ako postoje (provera postojanja, ne polje u bazi).',
        'Modul bez kviza i zadatka se automatski završava po otvaranju — UI to treba da odrazi.',
        'Ovde dodati i proveru redosleda: trenutno se proverava samo kupovina, ne i da li je prethodni modul završen.',
      ]}
    />
  );
}
