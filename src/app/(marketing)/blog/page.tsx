import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import EmptyState from '@/components/feedback/EmptyState';
import { BLOG_POSTS } from '@/lib/blog';
import { formatDate } from '@/lib/format';
import Image from 'next/image';
import Box from '@mui/material/Box';

export const metadata = {
  title: 'Blog — Kursevi',
  description: 'Tekstovi o učenju, kursevima i temama koje pokrivamo.',
};

/**
 * The blog index.
 *
 * ## Hardcoded, deliberately
 *
 * There is no CMS and no `posts` table. The point of the blog here is indexable
 * public content, and for a handful of articles a typed array in
 * `src/lib/blog.ts` is less machinery than a table, an admin editor and a set
 * of policies — and it makes a post a code review rather than a database write.
 *
 * If it ever grows past a couple of dozen posts, MDX files on disk are the next
 * step, not a database. Both keep the "publishing is a deploy" property.
 *
 * A Server Component: the content is static, so this ships no JavaScript and
 * can be crawled without one.
 */
export default function BlogIndexPage() {
  // Array order is display order — newest first lives in `blog.ts`.
  const posts = BLOG_POSTS;

  return (
    <PageContainer>
      <PageHeader
        title="Blog"
        description="Tekstovi o učenju, kursevima i temama koje pokrivamo."
      />

      {posts.length === 0 ? (
        <ContentCard>
          <EmptyState
            icon={<ArticleOutlinedIcon />}
            title="Još nema objavljenih tekstova"
            description="Prvi tekstovi stižu uskoro."
          />
        </ContentCard>
      ) : (
        <Grid container spacing={3}>
          {posts.map((post, index) => (
            <Grid key={post.slug} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* CardActionArea resolves to a real anchor through the theme's
                LinkComponent - no `component` prop needed. */}
                <CardActionArea
                href={`/blog/${post.slug}`}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  {post.image ? (
                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                      <Image
                      src={post.image.src}
                      alt={post.image.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                      priority={index < 3} // first row of images is eagerly-loaded
                      />
                    </Box>
                  ) : null}

                  <Stack spacing={1} sx={{ p: 3 }}>
                    <Typography variant="overline" color="text.secondary">
                      {formatDate(post.publishedAt)}
                    </Typography>
                    <Typography variant="h6" component="h2">
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {post.excerpt}
                    </Typography>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </PageContainer>
  );
}
