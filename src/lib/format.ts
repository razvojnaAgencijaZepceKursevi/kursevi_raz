/**
 * Display formatting. Every price/date rendered anywhere in the app goes
 * through here, so the locale and currency are decided in one place rather
 * than re-chosen (and quietly diverging) at each call site.
 */

const LOCALE = 'sr-RS';
const CURRENCY = 'RSD';

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  // Prices are numeric(10,2) but are nearly always whole dinars — show decimals
  // only when they carry information.
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** `1500` → `1.500 RSD`. Free courses read as "Besplatno" rather than "0 RSD". */
export function formatPrice(price: number): string {
  if (price === 0) return 'Besplatno';
  return priceFormatter.format(price);
}

/** ISO timestamp → `06.08.2026.` */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateFormatter.format(new Date(iso));
}

/** ISO timestamp → `06.08.2026. 14:30` */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateTimeFormatter.format(new Date(iso));
}

/** Trims long text to a card-friendly length without cutting mid-word. */
export function truncate(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

/** First letters of a name, for avatar fallbacks. */
export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
