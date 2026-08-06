import LoadingState from '@/components/feedback/LoadingState';

/**
 * Shown while any `/admin/*` page's server component is still resolving.
 *
 * The sidebar and top bar live in the layout above this, so they stay visible
 * and interactive — only the content area swaps to this fallback.
 */
export default function AdminLoading() {
  return <LoadingState minHeight="60vh" />;
}
