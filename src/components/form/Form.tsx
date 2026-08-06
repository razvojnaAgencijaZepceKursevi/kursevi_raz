'use client';

import * as React from 'react';
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LoadingOverlay from '@/components/feedback/LoadingOverlay';
import { errorMessage } from '@/lib/api/errorMessage';
import { toast } from '@/store/useToastStore';

/**
 * The wrapper every form in the app uses. It owns the three things that would
 * otherwise be re-implemented (and quietly diverge) on every form page:
 *
 *  1. **Context** — publishes the form via `<FormProvider>`, which is how the
 *     `Form*` field components find it without being passed the form object.
 *  2. **Submit-time locking** — renders a `<LoadingOverlay>` while the submit
 *     handler is running, so a double-click can't fire two mutations.
 *  3. **Error surfacing** — catches anything the submit handler throws, turns
 *     it into a readable sentence, and shows it both inline and as a toast.
 *
 * That last point is what shapes how you write the handler: just `await` the
 * mutations and let failures throw. Don't try/catch inside it.
 *
 *   <Form form={form} onSubmit={async (values) => { await create.mutateAsync(values); }}>
 *     <FormTextField name="name" label="Naziv" />
 *     <FormActions submitLabel="Sačuvaj" />
 *   </Form>
 */
export default function Form<TFieldValues extends FieldValues, TTransformed extends FieldValues>({
  form,
  onSubmit,
  children,
  pendingLabel = 'Čuvanje…',
  showErrorToast = true,
}: {
  form: UseFormReturn<TFieldValues, unknown, TTransformed>;
  /** Receives parsed, validated values. Throw to signal failure. */
  onSubmit: (values: TTransformed) => Promise<void> | void;
  children: React.ReactNode;
  pendingLabel?: string;
  showErrorToast?: boolean;
}) {
  const {
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = form;

  // `root` is react-hook-form's slot for errors that belong to the form as a
  // whole rather than to one field — exactly right for a failed request.
  const rootError = errors.root?.message;

  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      await onSubmit(values);
    } catch (error) {
      const message = errorMessage(error);
      setError('root', { message });
      if (showErrorToast) toast.error(message);
    }
  });

  return (
    <FormProvider {...form}>
      {/* `noValidate` hands validation entirely to zod — otherwise the browser's
          own bubbles fire first, in the wrong language and the wrong style. */}
      <Box component="form" onSubmit={submit} noValidate sx={{ position: 'relative' }}>
        <LoadingOverlay open={isSubmitting} label={pendingLabel} />

        <Stack spacing={3}>
          {rootError ? <Alert severity="error">{rootError}</Alert> : null}
          {children}
        </Stack>
      </Box>
    </FormProvider>
  );
}
