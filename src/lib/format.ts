/**
 * Display formatting. Every price/date rendered anywhere in the app goes
 * through here, so the locale and currency are decided in one place rather
 * than re-chosen (and quietly diverging) at each call site.
 */

/**
 * `bs-BA`. The UI is Bosnian (ijekavian), and this is the locale that agrees
 * with it — see §7 "The UI language is Bosnian".
 *
 * This replaced `sr-BA`, which was **not** a cosmetic difference:
 * `Intl.RelativeTimeFormat('sr-BA')` renders in **Cyrillic** (`прије 5 минута`),
 * so every notification timestamp was the only Cyrillic text in an otherwise
 * Latin UI. `sr-Latn-BA` would fix the script but still says `avgust` where
 * Bosnian says `august`.
 *
 * The one thing `bs-BA` changes for the worse is date spacing —
 * `06. 08. 2026.` rather than `06.08.2026.` — which is why an earlier note here
 * called it "not interchangeable". That spacing is the Bosnian convention, so
 * with the copy in Bosnian it is now the correct rendering rather than a
 * regression.
 */
const LOCALE = 'bs-BA';
const CURRENCY = 'BAM';

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  /**
   * `narrowSymbol` was load-bearing under `sr-BA`, where the default (`symbol`)
   * rendered BAM as Cyrillic `КМ` — visually almost identical to Latin `KM`,
   * but a different pair of characters, which broke search and copy-paste.
   *
   * Under `bs-BA` both settings produce Latin `KM`, so this is now belt and
   * braces rather than a fix. Kept deliberately: it costs nothing and it means
   * a future locale change cannot quietly reintroduce Cyrillic currency.
   */
  currencyDisplay: 'narrowSymbol',
  // Prices are numeric(10,2) but are nearly always whole marks — show decimals
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

/** `1500` → `1.500 KM`. Free courses read as "Besplatno" rather than "0 KM". */
export function formatPrice(price: number): string {
  if (price === 0) return 'Besplatno';
  return priceFormatter.format(price);
}

/** ISO timestamp → `06. 08. 2026.` */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateFormatter.format(new Date(iso));
}

/** ISO timestamp → `06. 08. 2026. u 14:30` */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateTimeFormatter.format(new Date(iso));
}

/**
 * ISO timestamp → `prije 5 minuta`, `jučer`, `prije 3 dana`.
 *
 * Notification lists are read by "how fresh is this", not "what date was it",
 * so an absolute timestamp makes the reader do arithmetic to answer the only
 * question they have. Falls back to the absolute date past a week, where
 * "prije 43 dana" stops being easier than reading the date.
 *
 * `Intl.RelativeTimeFormat` handles the plural forms itself — hand-rolling this
 * with `pluralBs` would mean re-deriving rules the platform already knows.
 */
const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';

  const then = new Date(iso).getTime();
  const seconds = Math.round((then - Date.now()) / 1000);
  const absolute = Math.abs(seconds);

  if (absolute < 60) return 'upravo sada';
  if (absolute < 3600) return relativeFormatter.format(Math.round(seconds / 60), 'minute');
  if (absolute < 86_400) return relativeFormatter.format(Math.round(seconds / 3600), 'hour');
  if (absolute < 604_800) return relativeFormatter.format(Math.round(seconds / 86_400), 'day');

  return formatDate(iso);
}

/** Trims long text to a card-friendly length without cutting mid-word. */
export function truncate(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

/**
 * Bosnian plural form for a count.
 *
 * There are three, chosen by the *last digit* (with a carve-out for the teens):
 *
 *   1 kurs   ·  21 kurs   ·  101 kurs        → `one`
 *   2 kursa  ·  34 kursa                     → `few`   (last digit 2–4)
 *   5 kurseva · 11 kurseva · 100 kurseva     → `many`  (everything else, incl. 11–14)
 *
 * The 11–14 exception is the part that's easy to miss: 11 ends in 1 but takes
 * `many`, so "11 kurs" is wrong. Pass all three forms and let this pick.
 *
 *   `${n} ${pluralBs(n, 'kurs', 'kursa', 'kurseva')}`  →  "3 kursa"
 */
export function pluralBs(count: number, one: string, few: string, many: string): string {
  const lastTwo = Math.abs(count) % 100;
  const lastOne = lastTwo % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (lastOne === 1) return one;
  if (lastOne >= 2 && lastOne <= 4) return few;
  return many;
}

/** `3` → `3 kursa`. The count of courses in a category, phrased correctly. */
export function formatCourseCount(count: number): string {
  return `${count} ${pluralBs(count, 'kurs', 'kursa', 'kurseva')}`;
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
