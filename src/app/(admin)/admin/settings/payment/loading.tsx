// Route-segment fallback. Next renders this the instant a navigation into
// this section starts, so the destination's shape appears immediately instead
// of the page sitting on the previous screen. See `PageSkeletons` for why each
// section has its own rather than one generic spinner at the top.
import { FormPageSkeleton } from '@/components/feedback/PageSkeletons';

export default function Loading() {
  return <FormPageSkeleton fields={4} cards={3} />;
}
