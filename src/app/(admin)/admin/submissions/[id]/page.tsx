'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import DetailList from '@/components/data/DetailList';
import StatusChip from '@/components/data/StatusChip';
import MessageThread from '@/components/submissions/MessageThread';
import SubmissionReview from '@/components/submissions/SubmissionReview';
import { useAdminSubmission } from '@/hooks/useSubmissions';
import { formatDateTime } from '@/lib/format';
import { SUBMISSION_STATUS } from '@/lib/status';
import { isStatus } from '@/lib/api/errorMessage';

/**
 * One submission: the brief, the conversation, and the decision.
 *
 * A page rather than a modal on the list. Reviewing means reading the task
 * text, the whole thread and any attached work before answering — that is a
 * sit-down, not a glance, and it is worth a URL a reviewer can bookmark or send
 * to a colleague. (Categories went the other way for the opposite reason: one
 * text field is not worth a navigation.)
 *
 * Admins and teachers share it unchanged. RLS decides which submissions load at
 * all, so a teacher opening someone else's id gets the same "not found" as if
 * it never existed.
 */
export default function AdminSubmissionDetailPage(props: PageProps<'/admin/submissions/[id]'>) {
  const { id } = React.use(props.params);
  const submission = useAdminSubmission(id);

  if (submission.isError && isStatus(submission.error, 404)) {
    return (
      <PageContainer>
        <ContentCard>
          <EmptyState
            title="Predaja nije pronađena"
            description="Ova predaja ne postoji ili nije na vašem kursu."
          />
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <QueryState query={submission} errorTitle="Predaju nije moguće učitati">
        {(row) => {
          const studentName = row.profiles?.full_name ?? 'Nepoznat student';
          const currentModule = row.tasks?.modules;
          const course = currentModule?.courses;

          return (
            <>
              <PageHeader
                breadcrumbs={[
                  { label: 'Predati zadaci', href: '/admin/submissions' },
                  { label: studentName },
                ]}
                title={currentModule?.title ?? 'Predati zadatak'}
                description={`Rešenje koje je predao/la ${studentName}${
                  course ? ` — kurs „${course.name}”` : ''
                }.`}
                actions={<StatusChip {...SUBMISSION_STATUS[row.status]} size="medium" />}
              />

              {row.status === 'approved' ? (
                <Alert severity="success">
                  <AlertTitle>Rešenje je prihvaćeno</AlertTitle>
                  Zadatak je završen za ovog studenta i prepiska je zatvorena.
                </Alert>
              ) : null}

              {row.status === 'needs_revision' ? (
                <Alert severity="info">
                  Zatražena je izmena. Student može da odgovori u istoj prepisci.
                </Alert>
              ) : null}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ContentCard title="Student">
                    <DetailList
                      items={[
                        {
                          label: 'Ime i prezime',
                          value: row.profiles ? (
                            <Link href={`/admin/users/${row.profiles.id}`} underline="hover">
                              {row.profiles.full_name}
                            </Link>
                          ) : (
                            '—'
                          ),
                        },
                        { label: 'Email', value: row.profiles?.email ?? '—' },
                        { label: 'Predato', value: formatDateTime(row.created_at) },
                        { label: 'Poslednja izmena', value: formatDateTime(row.updated_at) },
                      ]}
                    />
                  </ContentCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <ContentCard title="Kurs i modul">
                    <DetailList
                      items={[
                        {
                          label: 'Kurs',
                          value: course ? (
                            <Link href={`/admin/courses/${course.id}/edit`} underline="hover">
                              {course.name}
                            </Link>
                          ) : (
                            '—'
                          ),
                        },
                        {
                          label: 'Modul',
                          value:
                            currentModule && course ? (
                              <Link
                                href={`/admin/courses/${course.id}/modules/${currentModule.id}/edit`}
                                underline="hover"
                              >
                                {currentModule.title}
                              </Link>
                            ) : (
                              '—'
                            ),
                        },
                        {
                          label: 'Zadatak',
                          value:
                            currentModule && course ? (
                              <Link
                                href={`/admin/courses/${course.id}/modules/${currentModule.id}/task`}
                                underline="hover"
                              >
                                Izmeni zadatak
                              </Link>
                            ) : (
                              '—'
                            ),
                        },
                      ]}
                    />
                  </ContentCard>
                </Grid>
              </Grid>

              <ContentCard
                title="Šta je traženo"
                description="Tekst zadatka, onakav kakav je student video."
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {row.tasks?.text ?? '—'}
                </Typography>
              </ContentCard>

              <ContentCard
                title="Prepiska"
                description="Poruke i prilozi obe strane."
                disablePadding
              >
                <MessageThread
                  submissionId={row.id}
                  studentId={row.student_id}
                  studentName={studentName}
                  reviewerLabel="Predavač"
                />

                <Divider />

                <SubmissionReview submissionId={row.id} status={row.status} />
              </ContentCard>
            </>
          );
        }}
      </QueryState>
    </PageContainer>
  );
}
