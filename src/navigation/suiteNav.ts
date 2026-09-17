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

/** Fields shared by a flat section and a group's own entry. */
export interface SuiteNavLink {
  id: string;
  label: string;
  /** Absolute, same-origin path, e.g. '/mod-ledger/evaluations'. */
  href: string;
  /** Hidden when logged out. */
  requiresAuth?: boolean;
  /** Hidden unless the current user's role is in this list. */
  roles?: string[];
}

export interface SuiteNavSection extends SuiteNavLink {}

/** A labelled group of related sections shown nested under one heading in
 *  the dropdown/accordion, e.g. "Evaluations" with My Evaluations/Official/
 *  Moderation as its `items`. The group's own `href` is its primary
 *  destination (clicking the heading itself, not just an item). */
export interface SuiteNavGroup extends SuiteNavLink {
  items: SuiteNavSection[];
}

export type SuiteNavEntry = SuiteNavSection | SuiteNavGroup;

export function isSuiteNavGroup(entry: SuiteNavEntry): entry is SuiteNavGroup {
  return 'items' in entry;
}

export interface SuiteNavApp {
  id: Exclude<SuiteAppId, 'hub'>;
  label: string;
  href: string;
  status: 'available' | 'coming-soon';
  sections: SuiteNavEntry[];
}

export const SUITE_NAV: SuiteNavApp[] = [
  {
    id: 'mod-ledger',
    label: 'Mod Ledger',
    href: '/mod-ledger/',
    status: 'available',
    sections: [
      { id: 'overview', label: 'Overview', href: '/mod-ledger/' },
      {
        id: 'evaluations',
        label: 'Evaluations',
        href: '/mod-ledger/evaluations',
        items: [
          { id: 'my-evaluations', label: 'My Evaluations', href: '/mod-ledger/evaluations' },
          { id: 'official', label: 'Official', href: '/mod-ledger/evaluations#official' },
          {
            id: 'moderation',
            label: 'Moderation',
            href: '/mod-ledger/evaluations#moderation',
            roles: ['admin', 'mod'],
          },
        ],
      },
    ],
  },
  {
    id: 'navicharts',
    label: 'Navicharts',
    href: '/navicharts/',
    status: 'available',
    sections: [
      { id: 'overview', label: 'Overview', href: '/navicharts/' },
      {
        id: 'starcharts',
        label: 'Star Charts',
        href: '/navicharts/starcharts',
        items: [
          { id: 'mine', label: 'My Star Charts', href: '/navicharts/starcharts' },
          { id: 'guild', label: 'Guild Star Charts', href: '/navicharts/starcharts#guild' },
          { id: 'official', label: 'Official Star Charts', href: '/navicharts/starcharts#official' },
          { id: 'bookmarked', label: 'Bookmarked Star Charts', href: '/navicharts/starcharts#bookmarked' },
          {
            id: 'moderation',
            label: 'All Shared',
            href: '/navicharts/starcharts#moderation',
            roles: ['admin', 'mod'],
          },
        ],
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
