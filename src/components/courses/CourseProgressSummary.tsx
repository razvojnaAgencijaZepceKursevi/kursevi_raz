'use client';

import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import { progressPercent } from '@/lib/courseAccess';

/**
 * How far through the course this student is. Replaces the price panel once
 * they own the course — the useful number changes from "what does it cost" to
 * "how much is left".
 */
export default function CourseProgressSummary({
  completedCount,
  moduleCount,
  courseCompleted,
}: {
  completedCount: number;
  moduleCount: number;
  courseCompleted: boolean;
}) {
  const percent = progressPercent(completedCount, moduleCount);

  return (
    <ContentCard>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Vaš napredak
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            <Typography variant="h2" component="p">
              {percent}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedCount} od {moduleCount} modula
            </Typography>
          </Stack>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={percent}
          // Announced by screen readers as a labelled progress bar rather than
          // an anonymous one.
          aria-label="Napredak kroz kurs"
          sx={{ height: 8, borderRadius: 4 }}
        />

        {courseCompleted ? (
          <Alert severity="success" icon={<WorkspacePremiumOutlinedIcon fontSize="inherit" />}>
            Završili ste sve module. Sertifikat je dostupan u vašem nalogu.
          </Alert>
        ) : null}
      </Stack>
    </ContentCard>
  );
}
