'use client';

import * as React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * `<ContentCard>` whose body folds away behind its header.
 *
 * For reference sections a reader opens on purpose rather than reads top to
 * bottom — long tables that would otherwise push everything below them off
 * the screen. Same header, same edges, so a page can mix the two.
 *
 * A Client Component because it holds the open state; the body is still
 * rendered on the server (only hidden), so a Server Component page can pass
 * its tables straight in.
 */
export default function CollapsibleCard({
  title,
  description,
  children,
  defaultOpen = false,
  disablePadding = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  disablePadding?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const bodyId = React.useId();

  return (
    <Card sx={{ position: 'relative', overflow: 'hidden' }}>
      <ButtonBase
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={bodyId}
        sx={{ display: 'block', width: '100%', textAlign: 'left' }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ px: 3, py: 2.5, justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Stack spacing={0.25}>
            <Typography variant="h4">{title}</Typography>
            {description ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : null}
          </Stack>
          <ExpandMoreIcon
            color="action"
            sx={{
              flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: (theme) => theme.transitions.create('transform'),
            }}
          />
        </Stack>
      </ButtonBase>

      <Collapse in={open} id={bodyId}>
        <Divider />
        {disablePadding ? children : <CardContent>{children}</CardContent>}
      </Collapse>
    </Card>
  );
}
