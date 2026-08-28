'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { useDeleteCourse } from '@/hooks/useCourses';
import { errorMessage } from '@/lib/api/errorMessage';
import { toast } from '@/store/useToastStore';
import type { Course } from '@/lib/schemas/courses.schema';

/**
 * Delete a course, from its own edit page.
 *
 * Separate from `CourseActions` (the ⋮ menu on the list) because the two differ
 * in where they leave you: deleting from the list keeps you on the list, while
 * deleting the record you are currently editing has to navigate away — the page
 * would otherwise sit on a 404.
 *
 * Rendered *outside* `<CourseForm>` on purpose. It is not a form action: it
 * ignores everything typed in the fields, and grouping it with "Sačuvaj" would
 * suggest otherwise.
 */
export default function CourseDeleteSection({ course }: { course: Course }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const deleteCourse = useDeleteCourse();

  async function handleDelete() {
    try {
      await deleteCourse.mutateAsync(course.id);
      toast.success(`Kurs „${course.name}” je obrisan.`);
      // Not `router.back()` — the previous entry may be this same page.
      router.push('/admin/courses');
    } catch (error) {
      // The dialog stays open so the admin can retry or cancel deliberately.
      toast.error(errorMessage(error));
    }
  }

  return (
    <ContentCard title="Brisanje kursa">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="body2" color="text.secondary">
          Briše kurs i sav njegov sadržaj — module, kvizove, zadatke i otpremljene fajlove. Radije
          sačuvajte kurs kao nacrt ako želite samo da ga sklonite iz kataloga.
        </Typography>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          onClick={() => setConfirming(true)}
          sx={{ flexShrink: 0 }}
        >
          Obriši kurs
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirming}
        title="Obrisati kurs?"
        description={
          <>
            Kurs <strong>{course.name}</strong> i sav njegov sadržaj — moduli, kvizovi, zadaci i
            fajlovi — bit će trajno obrisani. Ova akcija se ne može poništiti.
          </>
        }
        confirmLabel="Obriši kurs"
        pending={deleteCourse.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void handleDelete()}
      />
    </ContentCard>
  );
}
