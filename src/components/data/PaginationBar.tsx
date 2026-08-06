'use client';

import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { PaginationMeta } from '@/lib/api/client';

/**
 * Page controls plus a "showing X–Y of Z" line, driven by the `meta` envelope
 * every list endpoint returns.
 *
 * Renders nothing when there's only one page — controls that can't do anything
 * are just noise.
 *
 *   <PaginationBar meta={courses.data?.meta} onChange={list.setPage} />
 */
export default function PaginationBar({
  meta,
  onChange,
}: {
  meta: PaginationMeta | undefined;
  onChange: (page: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  const firstOnPage = (meta.page - 1) * meta.pageSize + 1;
  const lastOnPage = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        Prikazano {firstOnPage}–{lastOnPage} od {meta.total}
      </Typography>

      <Pagination
        count={meta.totalPages}
        page={meta.page}
        onChange={(_event, page) => onChange(page)}
        shape="rounded"
        color="primary"
        siblingCount={1}
      />
    </Stack>
  );
}
