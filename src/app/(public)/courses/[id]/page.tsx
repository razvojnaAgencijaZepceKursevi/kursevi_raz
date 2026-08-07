'use client';

import * as React from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/feedback/EmptyState';
import LoadingState from '@/components/feedback/LoadingState';
import QueryState from '@/components/feedback/QueryState';
import ModuleList, { type ModuleListItem } from '@/components/courses/ModuleList';
import CoursePurchasePanel from '@/components/courses/CoursePurchasePanel';
import CourseProgressSummary from '@/components/courses/CourseProgressSummary';
import { useCourse, useCourseOutline } from '@/hooks/useCourses';
import { useCourseAccess } from '@/hooks/useCourseAccess';
import { useCourseProgress } from '@/hooks/useProgress';
import { useCategoryOptions } from '@/hooks/useCategories';
import { unlockedModuleIds } from '@/lib/courseAccess';
import { isStatus } from '@/lib/api/errorMessage';
import { courseThumbnailUrl } from '@/lib/storage';

/**
 * Course page — public, but shows four different things depending on who's
 * looking.
 *
 * | Viewer                        | Modules            | Right column |
 * | ----------------------------- | ------------------ | ------------ |
 * | Signed out                    | titles, all locked | price + CTA  |
 * | Signed in, no purchase        | titles, all locked | price + CTA  |
 * | Signed in, approved purchase  | sequentially open  | progress     |
 * | Admin                         | all open           | progress     |
 *
 * ## Two sources for one list
 *
 * The module list is built from whichever endpoint the viewer is allowed to
 * call, and they return different things:
 *
 *   - No access → `/outline`, which is public but carries titles only.
 *   - Access    → `/progress`, which carries the same titles plus completion.
 *
 * Exactly one of the two is enabled, keyed off `access.isResolved` so neither
 * fires before we know which is correct. Both are then mapped into
 * `ModuleListItem`, which is why `<ModuleList>` needs no idea who's viewing.
 *
 * ## Why the whole page waits on `isResolved`
 *
 * Session state arrives after first paint, so for a moment every visitor looks
 * signed out. Rendering on that would show a paying student the price and a
 * locked syllabus, then swap it — which reads as a bug. The page shows a
 * spinner until the question is actually settled.
 */
export default function CourseViewPage(props: PageProps<'/courses/[id]'>) {
  // `params` is a Promise in this version of Next. Server components await it;
  // a client component unwraps it with React's `use`.
  const { id: courseId } = React.use(props.params);

  const course = useCourse(courseId);
  const access = useCourseAccess(courseId);
  const categories = useCategoryOptions();

  // Exactly one of these two runs — see the note above.
  const outline = useCourseOutline(courseId, {
    enabled: access.isResolved && !access.canOpenModules,
  });
  const progress = useCourseProgress(courseId, {
    enabled: access.isResolved && access.canOpenModules,
  });

  const modules: ModuleListItem[] = React.useMemo(() => {
    if (access.canOpenModules && progress.data) {
      const unlocked = unlockedModuleIds(progress.data.modules, {
        bypassSequence: access.bypassSequence,
      });

      return progress.data.modules.map((module) => ({
        id: module.module_id,
        title: module.title,
        order: module.order,
        completed: module.completed,
        unlocked: unlocked.has(module.module_id),
      }));
    }

    return (outline.data ?? []).map((module) => ({
      id: module.id,
      title: module.title,
      order: module.order,
      completed: false,
      unlocked: false,
    }));
  }, [access.canOpenModules, access.bypassSequence, progress.data, outline.data]);

  /**
   * Loading/error status of whichever list query is actually running, paired
   * with the already-normalised modules. Composing this by hand — rather than
   * handing `<QueryState>` one of the two raw queries — is what lets the list
   * render from a single typed shape regardless of where the data came from.
   *
   * It stays pending until access is known, so the list can't briefly render
   * as "empty" before the right query has even been enabled.
   */
  const modulesQuery = access.canOpenModules ? progress : outline;
  const modulesState = {
    data: modules,
    isPending: !access.isResolved || modulesQuery.isPending,
    isError: modulesQuery.isError,
    error: modulesQuery.error,
    refetch: modulesQuery.refetch,
  };

  if (course.isError && isStatus(course.error, 404)) {
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

  return (
    <PageContainer>
      <QueryState query={course} errorTitle="Kurs nije moguće učitati">
        {(courseData) => {
          const thumbnail = courseThumbnailUrl(courseData.thumbnail_path);
          const categoryName = courseData.category_id
            ? categories.names.get(courseData.category_id)
            : undefined;

          return (
            <Stack spacing={3}>
              {access.isAdmin ? (
                <Alert
                  severity="info"
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button
                        href={`/admin/courses/${courseId}/edit`}
                        size="small"
                        color="inherit"
                        startIcon={<EditOutlinedIcon />}
                      >
                        Izmeni
                      </Button>
                      <Button
                        href={`/admin/courses/${courseId}/modules`}
                        size="small"
                        color="inherit"
                        startIcon={<ViewModuleOutlinedIcon />}
                      >
                        Moduli
                      </Button>
                    </Stack>
                  }
                >
                  Gledate javnu stranicu kursa kao administrator — svi moduli su vam otključani.
                </Alert>
              ) : null}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack spacing={3}>
                    <Box
                      sx={{
                        aspectRatio: '16 / 9',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'text.disabled',
                      }}
                    >
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnail}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageOutlinedIcon sx={{ fontSize: 48 }} />
                      )}
                    </Box>

                    <Stack spacing={1.5}>
                      {categoryName ? (
                        <Box>
                          <Chip label={categoryName} size="small" variant="outlined" />
                        </Box>
                      ) : null}

                      <Typography variant="h1" component="h1">
                        {courseData.name}
                      </Typography>

                      {courseData.description ? (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          // Preserve the paragraph breaks the admin typed into
                          // the textarea; the column is already width-limited.
                          sx={{ whiteSpace: 'pre-line' }}
                        >
                          {courseData.description}
                        </Typography>
                      ) : null}
                    </Stack>

                    <ContentCard
                      title="Sadržaj kursa"
                      description={
                        access.canOpenModules
                          ? 'Moduli se otključavaju redom, kako ih završavate.'
                          : 'Pregled modula. Sadržaj postaje dostupan nakon odobrenog pristupa.'
                      }
                      disablePadding
                    >
                      <QueryState
                        query={modulesState}
                        errorTitle="Module nije moguće učitati"
                        loading={<LoadingState minHeight={160} />}
                        isEmpty={(items) => items.length === 0}
                        empty={
                          <EmptyState
                            title="Kurs još nema module"
                            description="Sadržaj se uskoro dodaje."
                          />
                        }
                      >
                        {(items) => (
                          <ModuleList
                            modules={items}
                            courseId={courseId}
                            lockedHint={
                              access.canOpenModules
                                ? 'Završite prethodni modul da biste otključali ovaj.'
                                : 'Potreban je odobren pristup kursu.'
                            }
                          />
                        )}
                      </QueryState>
                    </ContentCard>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {/* Until access is known, neither panel is safe to show. */}
                  {!access.isResolved ? (
                    <ContentCard>
                      <LoadingState minHeight={160} label="Provera pristupa…" />
                    </ContentCard>
                  ) : access.canOpenModules ? (
                    <CourseProgressSummary
                      completedCount={progress.data?.completed_count ?? 0}
                      moduleCount={progress.data?.module_count ?? 0}
                      courseCompleted={progress.data?.course_completed ?? false}
                    />
                  ) : (
                    <CoursePurchasePanel
                      courseId={courseId}
                      price={courseData.price}
                      purchaseState={access.purchaseState}
                      isAuthenticated={access.isAuthenticated}
                    />
                  )}
                </Grid>
              </Grid>
            </Stack>
          );
        }}
      </QueryState>
    </PageContainer>
  );
}
