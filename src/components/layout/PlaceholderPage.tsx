import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from './ContentCard';
import PageContainer from './PageContainer';
import PageHeader, { type Crumb } from './PageHeader';
import EmptyState from '@/components/feedback/EmptyState';

/**
 * Stand-in for a route that exists in the navigation but hasn't been built yet.
 *
 * Having the route resolve — rather than 404 — means the sidebar is honest, the
 * URL structure is settled up front, and building the real page is a matter of
 * replacing this call with the actual content.
 *
 * `plannedWork` is the short brief for whoever picks the page up; see
 * `pages-to-build.md` for the full description of each screen.
 */
export default function PlaceholderPage({
  title,
  description,
  breadcrumbs,
  plannedWork,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  plannedWork?: string[];
}) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={<Chip label="U izradi" size="small" color="warning" variant="outlined" />}
      />

      <ContentCard>
        <EmptyState
          icon={<ConstructionOutlinedIcon />}
          title="Ova stranica još nije napravljena"
          description="Ruta i navigacija su postavljene. Sadržaj se dodaje u nekom od narednih koraka."
        />

        {plannedWork?.length ? (
          <Stack spacing={1} sx={{ maxWidth: 560, mx: 'auto', pb: 4 }}>
            <Typography variant="overline" color="text.secondary">
              Planirano
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
              {plannedWork.map((item) => (
                <Typography key={item} component="li" variant="body2" color="text.secondary">
                  {item}
                </Typography>
              ))}
            </Stack>
          </Stack>
        ) : null}
      </ContentCard>
    </PageContainer>
  );
}
