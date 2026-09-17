import React, { useEffect, useRef, useState } from 'react';
import { TopBar } from './TopBar';
import { NavMenu } from './NavMenu';
import { NavBurger } from './NavBurger';
import { MobileNavPanel } from './MobileNavPanel';
import { AccountCluster } from './AccountCluster';
import { AllyCodeDropdown } from '../forms/AllyCodeDropdown';
import { SUITE_NAV, SuiteAppId, SuiteNavLink } from '../../navigation/suiteNav';
import styles from './NavBar.module.css';

export interface NavBarProps {
  /** Which app is rendering the bar — drives which trigger is highlighted
   *  and which app's sections `onNavigate` fires for. */
  currentApp: SuiteAppId;
  /** Which of currentApp's own sections is active, e.g. from the app's own
   *  router. Apps detect "where am I" differently (some have no router at
   *  all), so this is supplied by the consumer, not computed by NavBar. */
  activeSectionId?: string;
  /** Fires only for sections belonging to currentApp — cross-app links are
   *  always real `<a href>` full page loads, never intercepted. Call
   *  `event.preventDefault()` to soft-navigate instead; the menu closes
   *  either way, since no page load will unmount it for you. */
  onNavigate?: (section: SuiteNavLink, event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** The one per-app element allowed in the bar: RosterRefresh. Always in
   *  the same slot, just left of the ally-code dropdown on desktop, and
   *  moves into the mobile panel on small screens. Its position never
   *  varies — only its presence/content does. */
  rightExtras?: React.ReactNode;
  /** Render the account cluster (username/Admin/Logout, or Login/Sign Up).
   *  Default true. Set false only for a fully static page. */
  showAuth?: boolean;
  /** Non-layout hooks only (e.g. a data attribute for tests). Nothing
   *  passed here may change the bar's width, height, padding, or item
   *  positions — that capability doesn't exist on this component. */
  className?: string;
}

type OpenMenu = 'ally' | Exclude<SuiteAppId, 'hub'> | null;

/**
 * NavBar — the suite-wide top bar. It is built from exactly one source,
 * `SUITE_NAV` (`../../navigation/suiteNav.ts`), and exactly one component.
 * No app passes in its own nav structure, name, or logo target — that
 * capability was removed, not just left unused, because per-app
 * configurability of the bar is what caused it to look different in every
 * app before this component existed. The logo always targets `/`. If a
 * future app needs something the manifest can't express, the manifest's
 * shape grows to cover it; this component does not grow an escape-hatch
 * prop instead. See `../../../CLAUDE.md`'s NavBar note for the full
 * rationale.
 */
export const NavBar: React.FC<NavBarProps> = ({
  currentApp,
  activeSectionId,
  onNavigate,
  rightExtras,
  showAuth = true,
  className,
}) => {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelId = 'suite-mobile-nav-panel';

  // A resize across the breakpoint shouldn't leave a desktop popover open
  // and hidden underneath the mobile panel, or vice versa.
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = () => {
      setOpenMenu(null);
      setIsMobileOpen(false);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const handleMobileToggle = () => {
    setOpenMenu(null);
    setIsMobileOpen((open) => !open);
  };

  return (
    <>
      <TopBar
        className={className}
        logo={
          <a href="/" className={styles.logoLink}>
            The Astrogator&apos;s Table
          </a>
        }
        leftContent={
          <nav className={styles.appMenus}>
            {SUITE_NAV.map((app) => (
              <NavMenu
                key={app.id}
                app={app}
                isCurrentApp={currentApp === app.id}
                activeSectionId={activeSectionId}
                isOpen={openMenu === app.id}
                onOpenChange={(isOpen) => setOpenMenu(isOpen ? app.id : null)}
                onSectionClick={onNavigate}
              />
            ))}
          </nav>
        }
        rightContent={
          <>
            <div className={styles.desktopRight}>
              {rightExtras && <div className={styles.extrasGroup}>{rightExtras}</div>}
              <AllyCodeDropdown
                isOpen={openMenu === 'ally'}
                onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'ally' : null)}
              />
              <AccountCluster showAuth={showAuth} />
            </div>
            <NavBurger
              ref={burgerRef}
              isOpen={isMobileOpen}
              onClick={handleMobileToggle}
              controlsId={mobilePanelId}
            />
          </>
        }
      />

      <MobileNavPanel
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        currentApp={currentApp}
        activeSectionId={activeSectionId}
        onSectionClick={onNavigate}
        rightExtras={rightExtras}
        showAuth={showAuth}
        panelId={mobilePanelId}
        returnFocusRef={burgerRef}
      />
    </>
  );
};
