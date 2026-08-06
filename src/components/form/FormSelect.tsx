'use client';

import { useController, type FieldValues, type FieldPath } from 'react-hook-form';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

export type SelectOption = {
  value: string;
  label: string;
};

/**
 * A dropdown bound to a form field.
 *
 * Options usually come from a React Query hook, so it accepts `loading` and
 * disables itself until they arrive — otherwise an edit form briefly shows an
 * empty dropdown and looks like the saved value was lost.
 *
 *   const categories = useCategories({ pageSize: 100 });
 *
 *   <FormSelect
 *     name="category_id"
 *     label="Kategorija"
 *     loading={categories.isPending}
 *     options={(categories.data?.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
 *     emptyOptionLabel="Bez kategorije"
 *   />
 */
export default function FormSelect<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  options,
  helperText,
  /** Adds a "none" choice that stores `null`. Use for nullable columns. */
  emptyOptionLabel,
  loading = false,
  required = false,
  disabled = false,
}: {
  name: FieldPath<TFieldValues>;
  label: string;
  options: SelectOption[];
  helperText?: string;
  emptyOptionLabel?: string;
  loading?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  const { field, fieldState } = useController<TFieldValues>({ name });

  return (
    <TextField
      {...field}
      select
      // `null` is a legitimate stored value but an invalid `<select>` value —
      // both it and `undefined` render as "nothing selected".
      value={field.value ?? ''}
      onChange={(event) => {
        const next = event.target.value;
        // Map the empty choice back to `null`, which is what a nullable foreign
        // key column expects. Sending `''` would fail uuid validation.
        field.onChange(next === '' ? null : next);
      }}
      label={label}
      required={required}
      disabled={disabled || loading || field.disabled}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
      slotProps={{
        input: loading
          ? {
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 3 }}>
                  <CircularProgress size={16} />
                </InputAdornment>
              ),
            }
          : undefined,
        formHelperText: { sx: { minHeight: 20, mx: 0 } },
      }}
    >
      {emptyOptionLabel ? (
        <MenuItem value="">
          <em>{emptyOptionLabel}</em>
        </MenuItem>
      ) : null}

      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
