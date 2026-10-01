/**
 * Site-wide facts: the brand, how to reach us, who we legally are.
 *
 * ## Why this is a file and not environment variables
 *
 * Everything here is the same in every environment — local, Vercel preview and
 * production all show the same phone number — and all of it is public. Env vars
 * earn their place when a value is secret or differs per deployment; neither is
 * true here. As env vars these would be untyped strings, copied by hand into
 * three Vercel environments, edited in a dashboard with no review, and still
 * needing a redeploy to change (`NEXT_PUBLIC_*` is inlined at build time). As a
 * file they are typed, reviewed like any other copy, and changed in one place.
 *
 * The test for adding something: **would it ever differ between preview and
 * production, or must it stay secret?** If yes, it belongs in `.env.example`.
 * If no, it belongs here.
 *
 * ## What is deliberately not here
 *
 * - **Payment details** (recipient, bank, account number) live in the database
 *   (`payment_settings`, edited at `/admin/settings/payment`). An admin must be
 *   able to correct an account number without a deploy.
 * - **Terms and privacy policy** — also the database (`/admin/settings/legal`),
 *   for the same reason.
 * - **Course categories in the footer** — those should come from the
 *   `categories` table, not from a list maintained by hand.
 *
 * Values marked `PLACEHOLDER` must be replaced before launch.
 */
type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  contact: {
    email: string;
    supportEmail: string;
    phone: { display: string; tel: string };
    hours: string;
  };
  social: { label: string; href: string }[];
  company: { legalName: string; address: string; idNumber: string };
};

export const SITE: SiteConfig = {
  /** The brand. Used in page titles, the logo, emails and the certificate PDF. */
  name: 'Katedra',

  /** Second half of the home page title: "Katedra — {tagline}". */
  tagline: 'online kursevi sa certifikatom',

  /** One sentence: the footer blurb and the default meta description. */
  description: 'Platforma za online kurseve s pregledom zadataka i certifikatom po završetku.',

  contact: {
    /** General enquiries. Also the fallback recipient of the contact form. PLACEHOLDER */
    email: 'info@katedra.ba',
    /** Shown on /kontakt for students already enrolled. PLACEHOLDER */
    supportEmail: 'podrska@katedra.ba',
    /**
     * `display` is what people read, `tel` is what a phone dials — written
     * separately because spacing that helps reading breaks a `tel:` link.
     * PLACEHOLDER
     */
    phone: { display: '+387 33 000 000', tel: '+38733000000' },
    /** When the phone is answered. */
    hours: 'Ponedjeljak – petak, 09:00 – 17:00',
  },

  /**
   * Profiles linked from the footer. An entry with an empty `href` is not
   * rendered, so a network the business is not on is simply left blank.
   * PLACEHOLDER — these point at the networks' home pages.
   */
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
  ],

  /**
   * The legal entity behind the site, printed under the footer's copyright.
   * Empty fields are skipped, so the line grows as the details are confirmed.
   * PLACEHOLDER — all empty until the client provides them.
   */
  company: {
    /** Registered name, e.g. "Katedra d.o.o." */
    legalName: '',
    /** Address of the registered seat. */
    address: '',
    /** Identification number (JIB / ID broj). */
    idNumber: '',
  },
};
