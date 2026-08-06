'use client';

import * as React from 'react';
import NextLink from 'next/link';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from '@/components/data/StatusChip';
import { formatPrice, truncate } from '@/lib/format';
import { courseThumbnailUrl } from '@/lib/storage';
import { publishStatus } from '@/lib/status';
import type { Course } from '@/lib/schemas/courses.schema';

/**
 * Course tile for grid views.
 *
 * Written to serve both the admin listing and the eventual public catalogue,
 * which is why the two things that differ between them are props:
 *   - `href` — where the card leads (edit screen vs. marketing page).
 *   - `showStatus` — only admins ever see that a course is a draft.
 *
 * `footer` takes row actions so this component stays presentational; it renders
 * a course, it doesn't know how to delete one.
 */
export default function CourseCard({
  course,
  href,
  categoryName,
  showStatus = false,
  footer,
}: {
  course: Course;
  href: string;
  categoryName?: string;
  showStatus?: boolean;
  footer?: React.ReactNode;
}) {
  const thumbnail = courseThumbnailUrl(course.thumbnail_path);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea component={NextLink} href={href} sx={{ flex: 1, alignItems: 'stretch' }}>
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '16 / 9',
            bgcolor: 'action.hover',
            display: 'grid',
            placeItems: 'center',
            color: 'text.disabled',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {thumbnail ? (
            // Plain <img>: next/image would need the Supabase storage host
            // allow-listed in next.config.ts, and these are CDN-served already.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageOutlinedIcon />
          )}

          {showStatus ? (
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Box sx={{ bgcolor: 'background.paper', borderRadius: 1.5 }}>
                <StatusChip {...publishStatus(course.published)} />
              </Box>
            </Box>
          ) : null}
        </Box>

        <Stack spacing={1} sx={{ p: 2.5 }}>
          {categoryName ? (
            <Typography variant="overline" color="text.secondary">
              {categoryName}
            </Typography>
          ) : null}

          <Typography variant="h5" component="h3">
            {course.name}
          </Typography>

          {course.description ? (
            <Typography variant="body2" color="text.secondary">
              {truncate(course.description, 110)}
            </Typography>
          ) : null}

          <Typography variant="body2" sx={{ fontWeight: 600, pt: 0.5 }}>
            {formatPrice(course.price)}
          </Typography>
        </Stack>
      </CardActionArea>

      {footer ? (
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}
        >
          {footer}
        </Stack>
      ) : null}
    </Card>
  );
}
