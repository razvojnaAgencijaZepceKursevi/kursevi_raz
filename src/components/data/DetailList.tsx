import * as React from 'react';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export type DetailItem = {
  label: string;
  /** Anything renderable — a chip, a link, formatted money. */
  value: React.ReactNode;
  /** Drop a row entirely when the underlying field is absent. */
  hidden?: boolean;
};

/**
 * Label/value rows for a detail screen.
 *
 * Renders a real `<dl>`, so the pairing between a label and its value is
 * carried by the markup rather than only by visual alignment.
 *
 *   <DetailList
 *     items={[
 *       { label: 'Student', value: purchase.profiles?.full_name ?? '—' },
 *       { label: 'Cena', value: formatPrice(purchase.price) },
 *     ]}
 *   />
 */
export default function DetailList({ items }: { items: DetailItem[] }) {
  const visible = items.filter((item) => !item.hidden);

  return (
    <Stack component="dl" divider={<Divider />} sx={{ m: 0 }}>
      {visible.map((item) => (
        <Stack
          key={item.label}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.5, sm: 3 }}
          sx={{ py: 1.75, alignItems: { sm: 'baseline' } }}
        >
          <Typography
            component="dt"
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 180, flexShrink: 0 }}
          >
            {item.label}
          </Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, minWidth: 0, flex: 1 }}>
            {item.value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
