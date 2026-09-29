import { notFound } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Image from 'next/image';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MarkdownContent from '@/components/markdown/MarkdownContent';
import { BLOG_POSTS, estimateReadingMinutes, findBlogPost } from '@/lib/blog';
import { formatDate } from '@/lib/format';

/**
 * One blog post.
 * 
 * A server component reading from `src/lib/blog.ts`, so a post is static HTML
 * with no client JavaScript and no request to anything.
 * 
 * `generateStaticParams` pre-renders every post at build time. With the array
 * empty it yields nothing, which is correct - there is simply nothing to
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
    title: `${post.title} - Kursevi`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  const post = findBlogPost(slug);

  //An unknown slug is genuine 404, handled by `app/not-found.tsx`. Rendering
  //an empty article instead would leave a URL that looks real and says
  //nothing.
  if (!post) notFound();

  return(
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 } }}>
      <Stack spacing={0.75} sx={{ mb: 1 }}>
        <Button
        href="/blog"
        size="small"
        color="inherit"
        startIcon={<ArrowBackIcon fontSize="small" />}
        sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
        >
          Svi tekstovi
        </Button>
      </Stack>

      <Stack spacing={2} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {post.category && (
            <Chip label={post.category} size="small" color="primary" variant="outlined" />
          )}
          <Typography variant="caption" color="text.secondary">
            {formatDate(post.publishedAt)} · {estimateReadingMinutes(post.content)} MIN 
          </Typography>
        </Stack>

        <Typography variant="h3" component="h1"  sx={{ fontSize: { xs: 30, md: 42 } }}>
          {post.title}
        </Typography>

        <Typography variant="h6" component="p" color="text.secondary" sx={{ fontWeight: 400 }}>
          {post.excerpt}
        </Typography>
      </Stack>

      {post.image ? (
        <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 5,
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

      {/* 
        A Server Component, so the whole article is parsed here and arrives in
        the initial HTML. That is the point of having a blog at all - a 
        crawler must not have to run JavaScript to read it.
        */}
        <MarkdownContent content={post.content} />

       <Divider sx={{ my: 5 }} />

       <Stack direction="row">
        <Button href="/blog" color="inherit" startIcon={<ArrowBackIcon />}>
        Svi tekstovi
        </Button>
       </Stack>
     </Container>
  );
}