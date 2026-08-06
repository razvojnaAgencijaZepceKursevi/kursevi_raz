import Chip from '@mui/material/Chip';
import type { StatusDisplay } from '@/lib/status';

/**
 * A status pill. Takes an already-resolved label + colour rather than a raw
 * enum value, so the Serbian wording lives in `@/lib/status` and this component
 * stays usable for any status in the app.
 *
 *   <StatusChip {...PURCHASE_STATUS[purchase.status]} />
 *   <StatusChip {...publishStatus(course.published)} />
 */
export default function StatusChip({
  label,
  color,
  size = 'small',
}: StatusDisplay & { size?: 'small' | 'medium' }) {
  return <Chip label={label} color={color} size={size} variant="outlined" />;
}
