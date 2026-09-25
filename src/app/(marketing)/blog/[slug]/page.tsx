import { notFound } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import MarkdownContent from '@/components/markdown/MarkdownContent';
import { BLOG_POSTS, findBlogPost } from '@/lib/blog';
import { formatDate } from '@/lib/format';
import Box from '@mui/material/Box';
import Image from 'next/image';

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
        description={formatDate(post.publishedAt)}
      />

      {post.image ? (
      <Box 
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 2,
        overflow: 'hidden',
      }}
      >
        <Image 
        src={post.image.src}
        alt={post.image.alt}
        fill
        style={{ objectFit: 'cover' }}
        sizes="(max-width: 900px) 100vw, 800px"
        priority
        />
      </Box>
      ) : null}

      <ContentCard>
        {/*
          A Server Component, so the whole article is parsed here and arrives in
          the initial HTML. That is the point of having a blog at all — a
          crawler must not have to run JavaScript to read it.
        */}
        <MarkdownContent content={post.content} />
      </ContentCard>

      <Stack direction="row">
        <Button href="/blog" color="inherit" startIcon={<ArrowBackIcon />}>
          Svi tekstovi
        </Button>
      </Stack>
    </PageContainer>
  );
}
