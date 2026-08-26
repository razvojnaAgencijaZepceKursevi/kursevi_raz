import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * The certificate PDF route reads two vendored `.ttf` files at runtime.
   *
   * Nothing imports them, so Next's dependency tracing cannot see them and
   * would leave them out of a production build — the route then works in `next
   * dev` and 500s once deployed. Naming the directory here is the documented
   * fix (`output.md` in the Next docs).
   */
  outputFileTracingIncludes: {
    '/api/certificates/[certificateId]/pdf': ['./src/lib/pdf/fonts/**/*'],
  },
};

export default nextConfig;
