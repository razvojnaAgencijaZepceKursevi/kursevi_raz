import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import Button from '@mui/material/Button';
import PageContainer from '@/components/layout/PageContainer';
import ContentCard from '@/components/layout/ContentCard';
import EmptyState from '@/components/feedback/EmptyState';

export const metadata = { title: 'Nije pronađeno — Admin' };

/**
 * 404 inside the admin shell.
 *
 * Separate from the root one so the sidebar and top bar stay put: someone who
 * mistypes an admin URL is mid-task and should be able to click straight on,
 * not be ejected to the public site.
 */
export default function AdminNotFound() {
  return (
    <PageContainer>
      <ContentCard>
        <EmptyState
          icon={<SearchOffOutlinedIcon />}
          title="Stranica nije pronađena"
          description="Ova administratorska stranica ne postoji ili je sadržaj uklonjen."
          action={
            <Button href="/admin" variant="contained">
              Nazad na pregled
            </Button>
          }
        />
      </ContentCard>
    </PageContainer>
  );
}
