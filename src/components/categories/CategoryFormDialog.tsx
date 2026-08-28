'use client';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Form from '@/components/form/Form';
import FormActions from '@/components/form/FormActions';
import FormTextField from '@/components/form/FormTextField';
import { useZodForm } from '@/lib/forms/useZodForm';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { toast } from '@/store/useToastStore';
import {
  categoryFormSchema,
  categoryToFormValues,
  emptyCategoryFormValues,
  toCreateCategoryPayload,
  toUpdateCategoryPayload,
  type CategoryFormValues,
} from '@/lib/schemas/category-form.schema';
import type { Category } from '@/lib/schemas/categories.schema';

/**
 * Create or edit a category, in a dialog.
 *
 * A category is one text field, so a dedicated page for it would be mostly
 * navigation — the dialog keeps the admin on the list, where the result of the
 * change is immediately visible. Anything with more fields than this (a course,
 * a module) belongs on its own page instead.
 *
 * ## One component for both modes
 *
 * `category` decides which: `null` creates, a row edits. The two differ only in
 * which mutation runs and what the labels say, so splitting them into two
 * components would duplicate the form to save an `if`.
 *
 * ## Why the parent mounts this only while it's open
 *
 * `defaultValues` is read **once, at mount**. If this stayed mounted with the
 * dialog merely hidden, opening it on a second category would still show the
 * first one's name. Rendering it only while open makes each open a fresh mount,
 * which is the same rule that puts an edit form *inside* its `<QueryState>`.
 */
export default function CategoryFormDialog({
  category,
  onClose,
}: {
  /** The category being edited, or `null` to create a new one. */
  category: Category | null;
  onClose: () => void;
}) {
  const isEdit = category !== null;

  const form = useZodForm(categoryFormSchema, {
    defaultValues: isEdit ? categoryToFormValues(category) : emptyCategoryFormValues,
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  // No try/catch: <Form> catches whatever this throws and surfaces it inline.
  // A duplicate name arrives here as a 409 and is reported that way.
  async function handleSubmit(values: CategoryFormValues) {
    if (isEdit) {
      await updateCategory.mutateAsync({ id: category.id, body: toUpdateCategoryPayload(values) });
      toast.success(`Kategorija „${values.name}” je sačuvana.`);
    } else {
      await createCategory.mutateAsync(toCreateCategoryPayload(values));
      toast.success(`Kategorija „${values.name}” je kreirana.`);
    }

    onClose();
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog
      open
      // Closing mid-save would hide an action that is still going to happen.
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{isEdit ? 'Izmijeni kategoriju' : 'Nova kategorija'}</DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Form form={form} onSubmit={handleSubmit} pendingLabel={isEdit ? 'Čuvanje…' : 'Kreiranje…'}>
          <FormTextField
            name="name"
            label="Naziv kategorije"
            placeholder="npr. Programiranje"
            required
          />

          <FormActions submitLabel={isEdit ? 'Sačuvaj' : 'Kreiraj kategoriju'} onCancel={onClose} />
        </Form>
      </DialogContent>
    </Dialog>
  );
}
