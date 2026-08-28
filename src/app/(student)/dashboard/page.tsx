'use client';

import * as React from 'react';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SupportOutlinedIcon from '@mui/icons-material/SupportOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import { usePurchases } from '@/hooks/usePurchases';
import { useCertificates } from '@/hooks/useCertificates';
import { useIssues } from '@/hooks/useIssues';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * The student's home screen — a way *to* things, not the things themselves.
 *
 * ## Why it is a hub and not a wall
 *
 * It used to stack enrolments, pending requests and certificates on one page.
 * Each of those grows independently, and a student with a dozen courses and
 * half a dozen certificates got a screen they had to scroll to navigate. Worse,
 * none of the three sections had a URL of its own, so nothing could be linked
 * to or bookmarked.
 *
 * Each destination is now its own page and this points at them, with the one
 * number that says whether the page is worth opening.
 *
 * ## The catalogue lives here and nowhere else
 *
 * "Pregledaj kurseve" used to sit in the header of every student page, which
 * made it noise on the four screens where it was not what you came for. It is
 * one tile now — visually the odd one out, because it is the only card that
 * leads *out* of the student's own material rather than into it.
 *
 * ## The counts are the point
 *
 * A menu of four identical cards tells you nothing. "2 zahtjeva" versus "nema
 * zahtjeva" is what decides whether you click, so each tile carries its own
 * small query. Four `pageSize: 1` requests reading `meta.total` — the project's
 * standing answer to needing a count rather than rows.
 */
type Tile = {
  href: string;
  label: string;
  description: string;
  icon: SvgIconComponent;
  /** Undefined while loading, so the tile can stay quiet rather than say "0". */
  count: number | undefined;
  /** Rendered instead of the bare number when there is nothing there. */
  emptyLabel: string;
  countLabel: (n: number) => string;
};

export default function StudentDashboardPage() {
  const profile = useAuthStore((s) => s.profile);

  const enrolled = usePurchases({ status: 'approved', pageSize: 1 });
  const pending = usePurchases({ status: 'requested', pageSize: 1 });
  const certificates = useCertificates({ pageSize: 1 });
  const openIssues = useIssues({ status: 'open', pageSize: 1 });

  const tiles: Tile[] = [
    {
      href: '/dashboard/courses',
      label: 'Moji kursevi',
      description: 'Kursevi kojima imate pristup i vaš napredak kroz njih.',
      icon: LibraryBooksOutlinedIcon,
      count: enrolled.data?.meta.total,
      emptyLabel: 'Još nijedan kurs',
      countLabel: (n) => `${n} ${n === 1 ? 'kurs' : n < 5 ? 'kursa' : 'kurseva'}`,
    },
    {
      href: '/dashboard/purchases',
      label: 'Kupovine',
      description: 'Zahtjevi za pristup, pozivi na broj i status svake uplate.',
      icon: ReceiptLongOutlinedIcon,
      count: pending.data?.meta.total,
      emptyLabel: 'Nema zahtjeva na čekanju',
      countLabel: (n) => `${n} ${n === 1 ? 'zahtjev čeka' : 'zahtjeva čeka'}`,
    },
    {
      href: '/dashboard/certificates',
      label: 'Certifikati',
      description: 'Certifikati koje ste osvojili završetkom kursa.',
      icon: WorkspacePremiumOutlinedIcon,
      count: certificates.data?.meta.total,
      emptyLabel: 'Još nijedan certifikat',
      countLabel: (n) => `${n} ${n === 1 ? 'certifikat' : n < 5 ? 'certifikata' : 'certifikata'}`,
    },
    {
      href: '/issues',
      label: 'Podrška',
      description: 'Pitanja i problemi koje ste poslali administratorima.',
      icon: SupportOutlinedIcon,
      count: openIssues.data?.meta.total,
      emptyLabel: 'Nema otvorenih zahtjeva',
      countLabel: (n) => `${n} ${n === 1 ? 'otvoren zahtjev' : 'otvorena zahtjeva'}`,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={profile ? `Zdravo, ${profile.full_name}` : 'Kontrolna tabla'}
        description="Sve na jednom mjestu — izaberite gdje želite da nastavite."
      />

      {/*
        Deliberately outside the grid and styled against it: filled rather than
        outlined, so it reads as an invitation rather than a fifth destination
        of the same kind.
      */}
      <Card
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          backgroundImage: 'none',
        }}
      >
        <CardActionArea href="/courses" sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' } }}
          >
            <ExploreOutlinedIcon sx={{ fontSize: 32 }} />
            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <Typography variant="h6" component="h2">
                Pregledaj kurseve
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Pronađite novi kurs u katalogu i zatražite pristup.
              </Typography>
            </Stack>
          </Stack>
        </CardActionArea>
      </Card>

      <Grid container spacing={3}>
        {tiles.map((tile) => {
          const Icon = tile.icon;

          return (
            <Grid key={tile.href} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                {/* CardActionArea resolves to a real anchor through the theme's
                    LinkComponent, so this is a proper link — keyboard reachable,
                    middle-clickable — not a click handler. */}
                <CardActionArea href={tile.href} sx={{ height: '100%', p: 3 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Icon color="primary" />
                      <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
                        {tile.label}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {tile.description}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                      color={tile.count ? 'text.primary' : 'text.disabled'}
                    >
                      {tile.count === undefined
                        ? ' '
                        : tile.count === 0
                          ? tile.emptyLabel
                          : tile.countLabel(tile.count)}
                    </Typography>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </PageContainer>
  );
}
