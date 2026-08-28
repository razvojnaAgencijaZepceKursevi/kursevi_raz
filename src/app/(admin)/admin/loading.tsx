// Route-segment fallback. Next renders this the instant a navigation into
// this section starts, so the destination's shape appears immediately instead
// of the page sitting on the previous screen. See `PageSkeletons` for why each
// section has its own rather than one generic spinner at the top.
// `/admin` is the dashboard. It is also the fallback for any admin route
// without a nearer `loading.tsx`, which is why the shape stays generic enough
// to not be actively wrong there.
import { DashboardSkeleton } from '@/components/feedback/PageSkeletons';

export default function Loading() {
  return <DashboardSkeleton tiles={5} tileSpan={2.4} />;
}
