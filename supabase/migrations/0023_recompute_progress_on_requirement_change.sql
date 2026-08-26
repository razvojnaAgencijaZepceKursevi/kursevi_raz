-- 0023_recompute_progress_on_requirement_change.sql
--
-- Keeps `module_progress.completed` honest when a module's *requirements*
-- change, not just when a student's progress does.
--
-- ## The gap
--
-- `completed` is derived (0011):
--
--   completed = (no quiz for module OR quiz_done) AND (no task for module OR task_done)
--
-- but `recompute_module_progress_completed` is a trigger on `module_progress`,
-- so it only ever fires when that row is written. Adding or removing a quiz or a
-- task changes what the formula *means* for every existing row on that module,
-- and nothing recomputed them. The stored value then sat stale until something
-- unrelated touched the row, at which point it silently flipped.
--
-- Both directions were wrong, and the second is the harmful one:
--
--   * Add a quiz to a module people had already finished → they stay
--     `completed` and are never asked to take it. **This one is left alone
--     deliberately** — see the note on the WHERE clause below.
--   * Delete a quiz a student had NOT finished → they stay `completed = false`
--     with nothing left to complete. Under the sequential unlock rule that
--     strands them on that module permanently, and no action in the UI can
--     clear it, because nothing writes to the row.
--
-- This was not theoretical: it was found on live data after a task was added
-- through the admin screens to a module a student had already completed.
--
-- ## The fix
--
-- Touch the affected `module_progress` rows whenever a quiz or task is created
-- or deleted, and let the existing BEFORE UPDATE trigger re-derive `completed`.
-- The derivation stays in exactly one place; this only decides *when* it runs.

create or replace function public.recompute_progress_for_module()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_module uuid;
  v_new_module uuid;
begin
  -- `NEW` is unassigned during DELETE and `OLD` during INSERT; referencing the
  -- wrong one raises "record is not assigned yet", so branch on TG_OP rather
  -- than reaching for coalesce(new.…, old.…).
  if tg_op <> 'INSERT' then
    v_old_module := old.module_id;
  end if;

  if tg_op <> 'DELETE' then
    v_new_module := new.module_id;
  end if;

  -- A no-op write: `module_progress_recompute_completed` runs BEFORE UPDATE and
  -- recalculates `completed` from the module's current quiz/task, so assigning a
  -- column to itself is enough to re-derive it.
  --
  -- **Only rows that are not already complete.** This is a product decision, not
  -- a technical one: once a student has finished a module it stays finished, even
  -- if an admin later adds a requirement to it. Recomputing everything would
  -- retroactively un-complete people who did nothing wrong — and, on a final
  -- module, would contradict a certificate that has already been issued.
  --
  -- Restricting it this way also makes the operation one-directional: an
  -- incomplete row can only become complete (because a requirement was removed),
  -- never the reverse. That is precisely the stranded-student case, and nothing
  -- else.
  --
  -- Covers UPDATE too, where both modules need recomputing if `module_id` ever
  -- moved. It does not today (it is unique per quiz/task and never reassigned),
  -- but handling it costs one extra predicate and removes a trap.
  update public.module_progress
  set completed = completed
  where completed = false
    and (module_id = v_old_module or module_id = v_new_module);

  return null;
end;
$$;

comment on function public.recompute_progress_for_module() is
  'Re-derives module_progress.completed for a module whose quiz or task was added, moved or removed.';

create trigger quizzes_recompute_progress
  after insert or update or delete on public.quizzes
  for each row execute function public.recompute_progress_for_module();

create trigger tasks_recompute_progress
  after insert or update or delete on public.tasks
  for each row execute function public.recompute_progress_for_module();

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------
--
-- Every row written before the triggers existed may be holding a stale value.
-- The same no-op write re-derives them — and, for the same reason as above,
-- only the ones that are not already complete. Anyone already finished stays
-- finished.

update public.module_progress set completed = completed where completed = false;
