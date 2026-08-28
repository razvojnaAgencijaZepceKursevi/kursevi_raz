'use client';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import StatusChip from '@/components/data/StatusChip';
import CourseActions from './CourseActions';
import { formatDate, formatPrice } from '@/lib/format';
import { publishStatus } from '@/lib/status';
import type { Course } from '@/lib/schemas/courses.schema';

/**
 * Table view of the admin course list. Denser than the grid and better for
 * comparing price/status across courses at a glance.
 *
 * `categoryNames` is a lookup rather than a field on the course because the
 * endpoint returns `category_id` only — the page fetches categories once and
 * passes the map down, instead of every row resolving its own name.
 */
export default function CourseTable({
  courses,
  categoryNames,
}: {
  courses: Course[];
  categoryNames: Map<string, string>;
}) {
  return (
    <TableContainer>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Naziv</TableCell>
            <TableCell>Kategorija</TableCell>
            <TableCell align="right">Cijena</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Kreiran</TableCell>
            {/* Actions column: no header text, but it still needs a cell. */}
            <TableCell align="right" sx={{ width: 56 }} />
          </TableRow>
        </TableHead>

        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} hover>
              <TableCell sx={{ maxWidth: 360 }}>
                <Stack spacing={0.25}>
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    variant="body2"
                    underline="hover"
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    {course.name}
                  </Link>
                  {course.description ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {course.description}
                    </Typography>
                  ) : null}
                </Stack>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {course.category_id
                    ? (categoryNames.get(course.category_id) ?? '—')
                    : 'Bez kategorije'}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">{formatPrice(course.price)}</Typography>
              </TableCell>

              <TableCell>
                <StatusChip {...publishStatus(course.published)} />
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(course.created_at)}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <CourseActions course={course} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
