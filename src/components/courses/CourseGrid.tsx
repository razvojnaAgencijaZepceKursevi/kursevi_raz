'use client';

import Grid from '@mui/material/Grid';
import CourseCard from './CourseCard';
import CourseActions from './CourseActions';
import type { Course } from '@/lib/schemas/courses.schema';

/**
 * Card grid of the admin course list. The visual counterpart to
 * `<CourseTable>` — same records, chosen when thumbnails matter more than
 * comparing fields.
 */
export default function CourseGrid({
  courses,
  categoryNames,
}: {
  courses: Course[];
  categoryNames: Map<string, string>;
}) {
  return (
    <Grid container spacing={2}>
      {courses.map((course) => (
        <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
          <CourseCard
            course={course}
            href={`/admin/courses/${course.id}/edit`}
            categoryName={course.category_id ? categoryNames.get(course.category_id) : undefined}
            showStatus
            footer={<CourseActions course={course} />}
          />
        </Grid>
      ))}
    </Grid>
  );
}
