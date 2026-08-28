'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { useDeleteModule } from '@/hooks/useModules';
import { errorMessage } from '@/lib/api/errorMessage';
import { toast } from '@/store/useToastStore';
import type { Module } from '@/lib/schemas/modules.schema';

/**
 * Delete a module, from its own edit page.
 *
 * The same split as courses: `ModuleActions` deletes from the list and stays
 * there, while this deletes the record being edited and therefore has to
 * navigate away — the page would otherwise sit on a "not found".
 *
 * Rendered outside `<ModuleForm>` on purpose. It ignores everything typed in
 * the fields, so grouping it with "Sačuvaj" would misrepresent it.
 */
export default function ModuleDeleteSection({
  currentModule,
  courseId,
}: {
  currentModule: Module;
  courseId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const deleteModule = useDeleteModule();

  async function handleDelete() {
    try {
      await deleteModule.mutateAsync(currentModule.id);
      toast.success(`Modul "${currentModule.title}" je obrisan.`);
      // Not `router.back()` — the previous entry may be this same page.
      router.push(`/admin/courses/${courseId}/modules`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <ContentCard title="Brisanje modula">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="body2" color="text.secondary">
          Briše modul i sve što mu pripada — kviz, zadatak, materijale i napredak studenata na
          njemu. Ostali moduli zadržavaju svoj redoslijed.
        </Typography>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          onClick={() => setConfirming(true)}
          sx={{ flexShrink: 0 }}
        >
          Obriši modul
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirming}
        title="Obrisati modul?"
        description={
          <>
            Modul <strong>{currentModule.title}</strong> bit će trajno obrisan, zajedno sa svojim
            kvizom, zadatkom i materijalima. Ova akcija se ne može poništiti.
          </>
        }
        confirmLabel="Obriši modul"
        pending={deleteModule.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void handleDelete()}
      />
    </ContentCard>
  );
}
