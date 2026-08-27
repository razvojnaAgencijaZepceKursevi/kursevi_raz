import { notFound } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import { BLOG_POSTS, findBlogPost } from '@/lib/blog';
import { formatDate } from '@/lib/format';

/**
 * One blog post.
 *
 * A Server Component reading from `src/lib/blog.ts`, so a post is static HTML
 * with no client JavaScript and no request to anything.
 *
 * `generateStaticParams` pre-renders every post at build time. With the array
 * empty it yields nothing, which is correct — there is simply nothing to
 * pre-render yet, and the route still 404s properly for any slug.
 */
export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  const post = findBlogPost(slug);

  if (!post) return { title: 'Tekst nije pronađen — Kursevi' };

  return {
    title: `${post.title} — Kursevi`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  const post = findBlogPost(slug);

  // An unknown slug is a genuine 404, handled by `app/not-found.tsx`. Rendering
  // an empty article instead would leave a URL that looks real and says
  // nothing.
  if (!post) notFound();

  return (
    <PageContainer maxWidth="form">
      <PageHeader
        breadcrumbs={[{ label: 'Blog', href: '/blog' }, { label: post.title }]}
        title={post.title}
        description={`${post.category} · ${formatDate(post.publishedAt)}`}
      />

      <ContentCard>
        <Stack spacing={2}>
          {post.body.map((paragraph, index) => (
            <Typography
              // Paragraphs have no ids and are static; the index is stable
              // because the array never reorders at runtime.
              key={index}
              variant="body1"
              sx={{ lineHeight: 1.75 }}
            >
              {paragraph}
            </Typography>
          ))}
        </Stack>
      </ContentCard>

      <Stack direction="row">
        <Button href="/blog" color="inherit" startIcon={<ArrowBackIcon />}>
          Svi tekstovi
        </Button>
      </Stack>
    </PageContainer>
  );
}
