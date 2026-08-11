'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

/**
 * One column of a `<DataTable>`.
 *
 * `cell` receives the whole row and returns whatever should be rendered — a
 * chip, a formatted price, a nested stack. It is not limited to text, which is
 * why there's no "renderer type" to choose from.
 */
export type DataTableColumn<TRow> = {
  /** Stable key. Also used as the React key for the cell. */
  id: string;
  header: React.ReactNode;
  cell: (row: TRow) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Applied to both the header and body cells of this column. */
  width?: number | string;
};

/**
 * A table driven by a column config.
 *
 * Three admin screens (users, purchases, certificates) render the same
 * structure over different rows, so the structure lives here and each page
 * supplies only what differs — its columns.
 *
 *   <DataTable
 *     rows={page.data}
 *     getRowId={(u) => u.id}
 *     onRowClick={(u) => `/admin/users/${u.id}`}
 *     columns={[
 *       { id: 'name', header: 'Ime', cell: (u) => u.full_name },
 *       { id: 'role', header: 'Uloga', cell: (u) => <StatusChip … /> },
 *     ]}
 *   />
 *
 * `onRowClick` returns an **href**, not a handler. Navigation is the only thing
 * these rows do, and returning the target lets the row be a real navigation —
 * `router.push` on click, plus a keyboard-reachable row — rather than a click
 * handler that only works with a mouse.
 */
export default function DataTable<TRow>({
  rows,
  columns,
  getRowId,
  onRowClick,
}: {
  rows: TRow[];
  columns: DataTableColumn<TRow>[];
  getRowId: (row: TRow) => string;
  /** Return the href a row navigates to, or omit for a static table. */
  onRowClick?: (row: TRow) => string;
}) {
  const router = useRouter();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align} sx={{ width: column.width }}>
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => {
            const href = onRowClick?.(row);

            return (
              <TableRow
                key={getRowId(row)}
                hover={Boolean(href)}
                onClick={href ? () => router.push(href) : undefined}
                // A table row can't be an <a>, so it's made operable instead:
                // focusable, activated by Enter, and announced as a link.
                role={href ? 'link' : undefined}
                tabIndex={href ? 0 : undefined}
                onKeyDown={
                  href
                    ? (event) => {
                        if (event.key === 'Enter') router.push(href);
                      }
                    : undefined
                }
                sx={href ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
