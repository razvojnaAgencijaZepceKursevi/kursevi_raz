'use client';

import NextLink from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

/**
 * One module as the course page needs to render it.
 *
 * Normalised on purpose: the same list is built from two different sources —
 * the public outline (`/outline`, no completion data) and a purchaser's
 * progress (`/progress`) — and this component shouldn't know or care which.
 * The page maps whichever it has into this shape.
 */
export type ModuleListItem = {
  id: string;
  title: string;
  order: number;
  completed: boolean;
  /** Whether this viewer may open it. Decided by `unlockedModuleIds`. */
  unlocked: boolean;
};

/**
 * The module list on the course page.
 *
 * A locked row is rendered as a plain `<Stack>`, not a disabled link — there is
 * no href at all, so it can't be opened by keyboard, middle-click, or by
 * reading the markup. The lock is a statement about the UI; the backend
 * enforces the same rule independently.
 */
export default function ModuleList({
  modules,
  courseSlug,
  /** Explains the padlock. Differs for "not purchased" vs "finish the previous one". */
  lockedHint,
}: {
  modules: ModuleListItem[];
  /** Used to build module hrefs, which live under the course's public URL. */
  courseSlug: string;
  lockedHint: string;
}) {
  return (
    <Stack divider={<Divider />}>
      {modules.map((module, index) => {
        const position = index + 1;

        const marker = (
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: '50%',
              fontSize: '0.8125rem',
              fontWeight: 600,
              bgcolor: module.completed ? 'transparent' : 'action.hover',
              color: module.unlocked ? 'text.primary' : 'text.disabled',
            }}
          >
            {module.completed ? <CheckCircleIcon fontSize="small" color="success" /> : position}
          </Box>
        );

        const body = (
          <>
            {marker}

            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                flex: 1,
                minWidth: 0,
                color: module.unlocked ? 'text.primary' : 'text.secondary',
              }}
            >
              {module.title}
            </Typography>

            {module.completed ? (
              <Chip label="Završeno" size="small" color="success" variant="outlined" />
            ) : null}

            {module.unlocked ? (
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            ) : (
              <Tooltip title={lockedHint}>
                <LockOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </Tooltip>
            )}
          </>
        );

        const sx = {
          px: 3,
          py: 2,
          alignItems: 'center',
          gap: 2,
        } as const;

        return module.unlocked ? (
          <Stack
            key={module.id}
            component={NextLink}
            href={`/courses/${courseSlug}/modules/${module.id}`}
            direction="row"
            sx={{
              ...sx,
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {body}
          </Stack>
        ) : (
          <Stack
            key={module.id}
            direction="row"
            // `aria-disabled` rather than a disabled control: this is static
            // content, so it just tells assistive tech the row isn't actionable.
            aria-disabled
            sx={sx}
          >
            {body}
          </Stack>
        );
      })}
    </Stack>
  );
}
