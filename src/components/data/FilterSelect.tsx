'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

/**
 * A dropdown that narrows a list, with an "everything" option at the top.
 *
 * ## The bug this exists to fix
 *
 * These filters use `''` as the sentinel for "no filter" — `useListParams`
 * drops empty values so the param is never sent. That is right on the data
 * side, but it breaks the *label*: MUI decides whether a floating label should
 * shrink with `isFilled()`, which reads
 *
 * ```js
 * hasValue(obj.value) && obj.value !== ''
 * ```
 *
 * so a value of `''` counts as empty. The label therefore stayed full-size,
 * un-notched, sitting directly on top of the "Svi statusi" the Select was
 * rendering underneath it — which read as a blank or broken field.
 *
 * Forcing `shrink` is the fix, and it belongs here rather than repeated on a
 * dozen call sites where the next filter added would forget it.
 *
 * ## Why not change the sentinel instead
 *
 * Using `'all'` would dodge the shrink rule, but then every list page would
 * need to translate `'all'` back into "omit this param" before querying, and
 * `useListParams` would have to learn a magic string. The empty value is the
 * honest representation of "no filter"; the label just needs telling.
 */
export type FilterOption = { value: string; label: string };

export default function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  width = 220,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /**
   * The top entry, which clears the filter. Omit for a select where every
   * choice is a real one and "all" makes no sense.
   */
  allLabel?: string;
  /** Max width on md and up; the field is full-width below that. */
  width?: number;
  disabled?: boolean;
}) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      // Always shrunk: see the note above. Without this the label overlaps the
      // "all" option whenever no filter is applied.
      slotProps={{ inputLabel: { shrink: true } }}
      sx={{ width: '100%', maxWidth: { md: width } }}
    >
      {allLabel ? <MenuItem value="">{allLabel}</MenuItem> : null}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
