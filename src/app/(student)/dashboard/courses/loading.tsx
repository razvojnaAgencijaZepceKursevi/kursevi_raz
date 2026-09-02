// Route-segment fallback. Next renders this the instant a navigation into
// this section starts, so the destination's shape appears immediately instead
// of the page sitting on the previous screen. See `PageSkeletons` for why each
// section has its own rather than one generic spinner at the top.
import { GridPageSkeleton } from '@/components/feedback/PageSkeletons';

export default function Loading() {
  return <GridPageSkeleton count={6} filters={0} />;
}
