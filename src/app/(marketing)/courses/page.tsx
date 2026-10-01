import CourseCatalogue from '@/components/courses/CourseCatalogue';
import { pageMetadata } from '@/lib/seo';
import { SITE } from '@/lib/siteConfig';

/*
 * The canonical is `/courses` for every search, filter and page of the list,
 * so `?categoryId=…&page=3` is never indexed as a page of its own.
 */
export const metadata = pageMetadata({
  title: 'Online kursevi',
  description: `Pregled svih kurseva na platformi ${SITE.name}: video lekcije, materijali, zadaci s povratnom informacijom predavača i certifikat po završetku.`,
  path: '/courses',
});

/**
 * `/courses` — a Server Component shell, so the route can export metadata. The
 * interactive catalogue is `<CourseCatalogue>`.
 */
export default function CourseCataloguePage() {
  return <CourseCatalogue />;
}
