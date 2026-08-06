'use client';

import { useController, type FieldValues, type FieldPath } from 'react-hook-form';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

/**
 * A numeric input that stores an actual `number` in form state.
 *
 * This exists as its own component because `<input type="number">` always
 * reports a **string**, and a schema field declared `z.number()` would then fail
 * validation on a perfectly valid entry. The conversion below is the whole
 * reason not to reach for `<FormTextField type="number">`.
 *
 *   <FormNumberField name="price" label="Cena" suffix="RSD" min={0} step={100} />
 */
export default function FormNumberField<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  helperText,
  placeholder,
  suffix,
  min,
  max,
  step,
  required = false,
  disabled = false,
}: {
  name: FieldPath<TFieldValues>;
  label: string;
  helperText?: string;
  placeholder?: string;
  /** Unit shown inside the field, e.g. `RSD` or `%`. */
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
}) {
  const { field, fieldState } = useController<TFieldValues>({ name });

  return (
    <TextField
      name={field.name}
      inputRef={field.ref}
      onBlur={field.onBlur}
      // `?? ''` keeps the input controlled while the field is empty; `Number('')`
      // is 0, so an empty box must become `undefined` and let the schema decide
      // whether that's allowed rather than silently reading as zero.
      value={field.value ?? ''}
      onChange={(event) => {
        const raw = event.target.value;
        field.onChange(raw === '' ? undefined : Number(raw));
      }}
      label={label}
      type="number"
      placeholder={placeholder}
      required={required}
      disabled={disabled || field.disabled}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
      slotProps={{
        // `htmlInput`, not the removed `inputProps` — these land on the <input>.
        htmlInput: { min, max, step, inputMode: 'decimal' },
        input: suffix
          ? { endAdornment: <InputAdornment position="end">{suffix}</InputAdornment> }
          : undefined,
        formHelperText: { sx: { minHeight: 20, mx: 0 } },
      }}
    />
  );
}
