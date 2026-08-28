// Route-segment fallback.
//
// A dynamic detail route needs its own: Next resolves the *nearest*
// `loading.tsx`, so without this the parent list's fallback would render — a
// table skeleton standing in for a single record, which promises a layout the
// page then contradicts.
import { FormPageSkeleton } from '@/components/feedback/PageSkeletons';

export default function Loading() {
  return <FormPageSkeleton fields={6} cards={2} />;
}
