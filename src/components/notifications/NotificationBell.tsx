'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/format';
import type { Notification } from '@/lib/schemas/notifications.schema';

/** How many fit in a dropdown before it stops being a dropdown. */
const PREVIEW_COUNT = 8;

/**
 * The bell: an unread badge, and the last few notifications behind it.
 *
 * Rendered in every shell a signed-in person can be in — the admin top bar, the
 * student header, the account pages — because the whole point is that you see
 * these without going looking for them.
 *
 * ## The badge polls; the list does not
 *
 * `useUnreadNotificationCount` refetches on a timer and on window focus. The
 * list underneath only loads when the menu opens (`enabled: open`), so sitting
 * on a page costs one small count query a minute and nothing else.
 *
 * ## Opening one marks it read
 *
 * Not "mark all read on open" — that would clear the badge for things the
 * person never actually looked at. Reading is per notification, on click, and
 * there is a separate explicit "mark all read" for when someone genuinely wants
 * the badge gone.
 */
export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const unread = useUnreadNotificationCount();
  // Only fetched while the menu is open — sitting on a page should cost the
  // count query and nothing more.
  const notifications = useNotifications({ pageSize: PREVIEW_COUNT }, { enabled: open });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const count = unread.data ?? 0;
  const rows = notifications.data?.data ?? [];

  function handleOpenItem(notification: Notification) {
    setAnchorEl(null);

    // Fired, not awaited. Navigation should feel instant, and a failed
    // mark-as-read is a badge that stays up — recoverable, and not worth
    // holding the click for.
    if (!notification.read_at) markRead.mutate(notification.id);

    // The link may point at something since deleted — a notification records
    // what was true when it was sent, not what still is. That resolves as the
    // destination's own "not found", which is the honest answer.
    if (notification.link) router.push(notification.link);
  }

  return (
    <>
      <Tooltip title="Obavještenja">
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label={count > 0 ? `Obavještenja (${count} nepročitanih)` : 'Obavještenja'}
        >
          <Badge badgeContent={count} color="error" max={99}>
            <NotificationsNoneOutlinedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: '100vw' } } }}
      >
        <Stack
          direction="row"
          sx={{ px: 2, py: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="subtitle2">Obavještenja</Typography>
          {count > 0 ? (
            <Button
              size="small"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Označi sve kao pročitano
            </Button>
          ) : null}
        </Stack>

        <Divider />

        {notifications.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ px: 2, py: 4 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Nemate obavještenja.
            </Typography>
          </Box>
        ) : (
          rows.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleOpenItem(notification)}
              sx={{
                display: 'block',
                whiteSpace: 'normal',
                py: 1.25,
                borderLeft: 3,
                borderColor: notification.read_at ? 'transparent' : 'primary.main',
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: notification.read_at ? 400 : 700, mb: 0.25 }}
              >
                {notification.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {notification.body}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {formatRelativeTime(notification.created_at)}
              </Typography>
            </MenuItem>
          ))
        )}

        <Divider />

        {/* `component={NextLink}` is required here and only here: MenuItem sets
            its root to 'li', so ButtonBase never swaps in the theme's
            LinkComponent and a plain `href` would render a dead `<li href>`.
            Safe because this whole component is a Client Component. */}
        <MenuItem
          component={NextLink}
          href="/notifications"
          onClick={() => setAnchorEl(null)}
          sx={{ justifyContent: 'center', py: 1.25 }}
        >
          <Typography variant="body2" color="primary">
            Sva obavještenja
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
