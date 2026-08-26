'use client';

import * as React from 'react';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { useDeleteQuiz } from '@/hooks/useQuizzes';
import { errorMessage } from '@/lib/api/errorMessage';
import { toast } from '@/store/useToastStore';

/**
 * Remove the quiz from a module.
 *
 * Stays on the page afterwards, like `TaskDeleteSection` — the module still
 * exists, so the screen simply reverts to offering a new quiz, which is the
 * useful outcome if you deleted it to start over.
 *
 * Outside `<QuizForm>` on purpose: it ignores everything in the fields.
 */
export default function QuizDeleteSection({ quizId }: { quizId: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const deleteQuiz = useDeleteQuiz();

  async function handleDelete() {
    try {
      await deleteQuiz.mutateAsync(quizId);
      toast.success('Kviz je obrisan.');
      setConfirming(false);
    } catch (error) {
      // The dialog stays open so the admin can retry or cancel deliberately.
      toast.error(errorMessage(error));
    }
  }

  return (
    <ContentCard title="Brisanje kviza">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="body2" color="text.secondary">
          Briše kviz sa svim pitanjima i odgovorima. Modul ostaje, samo više neće imati kviz —
          studenti ga tada završavaju bez njega.
        </Typography>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          onClick={() => setConfirming(true)}
          sx={{ flexShrink: 0 }}
        >
          Obriši kviz
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirming}
        title="Obrisati kviz?"
        description="Kviz, sva pitanja i odgovori biće trajno obrisani. Ova akcija se ne može poništiti."
        confirmLabel="Obriši kviz"
        pending={deleteQuiz.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void handleDelete()}
      />
    </ContentCard>
  );
}
