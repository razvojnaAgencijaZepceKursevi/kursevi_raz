import type { SvgIconComponent } from '@mui/icons-material';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';

export type AdminNavItem = {
  label: string;
  href: string;
  icon: SvgIconComponent;
  /**
   * By default a link is highlighted when the URL is the link or sits below it,
   * so `/admin/courses` stays active on `/admin/courses/new`. Set this for
   * links whose path is a prefix of every other one — without it `/admin` would
   * be highlighted on every page.
   */
  exact?: boolean;
};

export type AdminNavSection = {
  /** Rendered as a small heading above the group; omit for the first group. */
  title?: string;
  items: AdminNavItem[];
};

/**
 * The admin sidebar, in one place. Adding a page means adding a line here and
 * creating the matching folder under `src/app/(admin)/admin/` — nothing else.
 *
 * Every href must start with `/admin`: `src/proxy.ts` gates on that prefix, and
 * the `(admin)` route group contributes nothing to the URL.
 */
export const ADMIN_NAV: AdminNavSection[] = [
  {
    items: [{ label: 'Pregled', href: '/admin', icon: DashboardOutlinedIcon, exact: true }],
  },
  {
    title: 'Sadržaj',
    items: [
      { label: 'Kursevi', href: '/admin/courses', icon: LibraryBooksOutlinedIcon },
      { label: 'Kategorije', href: '/admin/categories', icon: CategoryOutlinedIcon },
    ],
  },
  {
    title: 'Studenti',
    items: [
      { label: 'Zahtevi za kupovinu', href: '/admin/purchases', icon: ReceiptLongOutlinedIcon },
      { label: 'Predati zadaci', href: '/admin/submissions', icon: AssignmentTurnedInOutlinedIcon },
      { label: 'Sertifikati', href: '/admin/certificates', icon: WorkspacePremiumOutlinedIcon },
      { label: 'Korisnici', href: '/admin/users', icon: PeopleOutlinedIcon },
    ],
  },
];

/** Whether `href` should render as the active link for the current pathname. */
export function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
