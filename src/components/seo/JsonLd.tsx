/**
 * Structured data (schema.org JSON-LD) for search engines.
 *
 * Rendered in the page body as Next's docs recommend; crawlers read it from
 * anywhere in the document. Works in Server and Client Components alike, but
 * belongs in a Server Component page so the data is in the initial HTML.
 *
 * `<` is escaped because course names and blog titles are authored text, and a
 * literal `</script>` inside one would end the tag early and inject whatever
 * follows into the page.
 *
 * Check the output with Google's Rich Results Test after changing a schema.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(
          /</g,
          '\\u003c',
        ),
      }}
    />
  );
}
