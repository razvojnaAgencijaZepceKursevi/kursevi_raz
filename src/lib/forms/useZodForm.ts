'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import type { ZodType, input, output } from 'zod';

/**
 * `useForm` with a zod schema wired in as the validator.
 *
 * Always start a form with this rather than `useForm` directly: the schema then
 * defines both the validation rules and the value types, so there is exactly
 * one description of what a valid form looks like.
 *
 *   const form = useZodForm(courseFormSchema, {
 *     defaultValues: { name: '', price: 0, published: false },
 *   });
 *
 * Two types are in play and they are not the same:
 *   - `input`  — what the fields hold while typing (a `.default()` field may be
 *                undefined, a number field may be an empty string).
 *   - `output` — what the schema produces after parsing, and therefore what the
 *                submit handler receives.
 * Passing both to `useForm` is what makes `onSubmit(values)` correctly typed as
 * the parsed shape rather than the raw one.
 *
 * `mode: 'onTouched'` validates a field once the user has left it and on every
 * keystroke after that — it avoids shouting about an empty field the user
 * hasn't reached yet, while still confirming a fix immediately.
 */
export function useZodForm<TSchema extends ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  options: Omit<UseFormProps<input<TSchema>, unknown, output<TSchema>>, 'resolver'> = {},
): UseFormReturn<input<TSchema>, unknown, output<TSchema>> {
  return useForm<input<TSchema>, unknown, output<TSchema>>({
    // `zodResolver` can only infer precise types from a concrete schema; with
    // `TSchema` still generic it widens to `Resolver<FieldValues, …>`. The cast
    // restores what the type parameter already guarantees. It's contained to
    // this one line — every call site stays fully checked against its schema.
    resolver: zodResolver(schema) as unknown as Resolver<input<TSchema>, unknown, output<TSchema>>,
    mode: 'onTouched',
    ...options,
  });
}
