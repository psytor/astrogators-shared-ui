/**
 * The single source of truth for the suite-wide NavBar's contents.
 *
 * No app passes its own name, sections, or logo target into `NavBar` — it all
 * comes from here. If a future app needs something this shape can't express,
 * grow the shape (a new field on `SuiteNavApp`/`SuiteNavSection`); an app
 * never gets its own bypass prop instead. See `NavBar`'s doc comment and
 * `../../CLAUDE.md`'s NavBar note for the full rationale.
 */

export type SuiteAppId = 'hub' | 'mod-ledger' | 'navicharts' | 'nightwatcher';

export interface SuiteNavSection {
  id: string;
  label: string;
  /** Absolute, same-origin path, e.g. '/mod-ledger/evaluations'. */
  href: string;
  /** Hidden when logged out. */
  requiresAuth?: boolean;
  /** Hidden unless the current user's role is in this list. */
  roles?: string[];
}

export interface SuiteNavApp {
  id: Exclude<SuiteAppId, 'hub'>;
  label: string;
  href: string;
  status: 'available' | 'coming-soon';
  sections: SuiteNavSection[];
}

export const SUITE_NAV: SuiteNavApp[] = [
  {
    id: 'mod-ledger',
    label: 'Mod Ledger',
    href: '/mod-ledger/',
    status: 'available',
    sections: [
      { id: 'grid', label: 'Inventory', href: '/mod-ledger/' },
      { id: 'my-evaluations', label: 'My Evaluations', href: '/mod-ledger/evaluations' },
      { id: 'official', label: 'Official', href: '/mod-ledger/evaluations#official' },
      {
        id: 'moderation',
        label: 'Moderation',
        href: '/mod-ledger/moderation',
        roles: ['admin', 'mod'],
      },
    ],
  },
  {
    id: 'navicharts',
    label: 'Navicharts',
    href: '/navicharts/',
    status: 'available',
    sections: [
      { id: 'mine', label: 'Mine', href: '/navicharts/' },
      { id: 'official', label: 'Official', href: '/navicharts/#official' },
      { id: 'guild', label: 'Guild', href: '/navicharts/#guild' },
      { id: 'bookmarked', label: 'Bookmarked', href: '/navicharts/#bookmarked' },
      {
        id: 'moderation',
        label: 'All Shared',
        href: '/navicharts/#moderation',
        roles: ['admin', 'mod'],
      },
    ],
  },
  {
    id: 'nightwatcher',
    label: 'Nightwatcher',
    href: '/nightwatcher/',
    status: 'available',
    sections: [{ id: 'overview', label: 'Overview', href: '/nightwatcher/' }],
  },
];
