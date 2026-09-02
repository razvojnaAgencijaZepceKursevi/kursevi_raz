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
 * ## …and the second half of the same bug: `displayEmpty`
 *
 * Shrinking the label moved it out of the way but left the field looking
 * *empty*, because `isFilled()` gates more than the label. In `SelectInput`:
 *
 * ```js
 * if (isFilled({ value }) || displayEmpty) { … computeDisplay = true … }
 * ```
 *
 * With `value === ''` and no `displayEmpty`, `computeDisplay` never runs, so
 * the selected item's label is never rendered — MUI draws a zero-width space
 * instead. That is why picking "Sve kategorije" left the control blank: the
 * option was selected, it simply had nothing on screen to say so.
 *
 * `displayEmpty` is therefore not optional here. The two props are one fix:
 * `shrink` moves the label up, `displayEmpty` puts the value in its place.
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
      // Both halves of the fix — see the note above. `shrink` keeps the label
      // off the value; `displayEmpty` is what makes the "all" option actually
      // render once it is selected.
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
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
