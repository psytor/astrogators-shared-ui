import { describe, expect, it } from 'vitest';
import { SUITE_NAV, isSuiteNavGroup } from '../src/navigation/suiteNav';
import type { SuiteNavLink } from '../src/navigation/suiteNav';

const allLinks = (app: (typeof SUITE_NAV)[number]): SuiteNavLink[] =>
  app.sections.flatMap((entry) => (isSuiteNavGroup(entry) ? [entry, ...entry.items] : [entry]));

describe('SUITE_NAV manifest', () => {
  it.each(SUITE_NAV.map((app) => [app.id, app] as const))(
    '%s: link ids are unique (NavBar matches the active section by id)',
    (_id, app) => {
      const ids = allLinks(app).map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  );

  it.each(SUITE_NAV.map((app) => [app.id, app] as const))(
    '%s: every href is a same-origin path under the app root',
    (_id, app) => {
      const root = app.href.replace(/\/$/, '');
      for (const link of allLinks(app)) {
        expect(link.href.startsWith(root), `${link.id}: ${link.href}`).toBe(true);
      }
    }
  );

  it('app ids are unique', () => {
    const ids = SUITE_NAV.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('isSuiteNavGroup tells a group from a flat section', () => {
    const mod = SUITE_NAV.find((a) => a.id === 'mod-ledger')!;
    expect(mod.sections.some(isSuiteNavGroup)).toBe(true);
    expect(mod.sections.some((s) => !isSuiteNavGroup(s))).toBe(true);
  });

  it('role-gated entries name only roles (never an empty list, which would hide the link from everyone)', () => {
    for (const app of SUITE_NAV) {
      for (const link of allLinks(app)) {
        if (link.roles) expect(link.roles.length).toBeGreaterThan(0);
      }
    }
  });
});
