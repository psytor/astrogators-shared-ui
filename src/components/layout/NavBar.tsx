import React from 'react';
import { TopBar } from './TopBar';
import { Button } from '../forms/Button';
import { AllyCodeDropdown } from '../forms/AllyCodeDropdown';
import { useAuth } from '../../contexts/AuthContext';
import styles from './NavBar.module.css';

/**
 * A single top-level section link in the NavBar tab strip.
 *
 * NavBar is intentionally router-agnostic: shared-ui takes no react-router
 * dependency. The consumer decides whether a tab is `active` (e.g. from its own
 * `useLocation`) and may supply `render` to inject a router `<Link>` for soft
 * client-side navigation. Without `render`, the tab is a plain `<a href>`.
 */
export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  render?: (props: { className: string; children: React.ReactNode }) => React.ReactNode;
}

export interface NavBarProps {
  /** Target for the ⟵ "The Astrogator's Table" logo — always the hub. Default '/'. */
  hubUrl?: string;
  /** This app's display name, e.g. "Mod Ledger". Omit on the hub (the logo is
   *  already the suite identity) for a logo-only left section. */
  appName?: string;
  /** Link target for the app name — the app's own root. Default '/'. */
  appHref?: string;
  /** Top-level section tabs. Omit (or empty) for apps with no sections. */
  navItems?: NavItem[];
  /** Render the shared AllyCodeDropdown in the right cluster. Default false. */
  showAllyCode?: boolean;
  /** Render the baked username/login/logout cluster. Default true. Set false for
   *  static pages (e.g. docs) that want no auth UI. */
  showAuth?: boolean;
  /** App-specific controls, rendered immediately left of the ally dropdown. */
  rightExtras?: React.ReactNode;
  className?: string;
}

/**
 * NavBar — the opinionated, suite-wide top bar built on top of the dumb `TopBar`
 * primitive. It bakes the blessed layout so every app's chrome is identical:
 *
 *   [ logo → hub ] · [ appName ]  [ section tabs ] ···· [ rightExtras ] [ ally ] [ auth cluster ]
 *
 * The username/profile/login/register/logout cluster is owned here (via useAuth);
 * apps no longer hand-roll it. Auth links point at the hub origin as plain anchors
 * because the auth UI lives in the hub and everything is served single-origin.
 */
export const NavBar: React.FC<NavBarProps> = ({
  hubUrl = '/',
  appName,
  appHref = '/',
  navItems,
  showAllyCode = false,
  showAuth = true,
  rightExtras,
  className,
}) => {
  const { user, isAuthenticated, logout, authEnabled } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = hubUrl;
  };

  const hasExtras = Boolean(rightExtras) || showAllyCode;
  const hasTabs = Boolean(navItems && navItems.length > 0);
  const hasLeft = Boolean(appName) || hasTabs;

  const authCluster = !showAuth ? null : isAuthenticated ? (
    <div className={styles.authCluster}>
      <a href="/profile" className={styles.userLink}>
        {user?.username}
      </a>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  ) : authEnabled ? (
    <div className={styles.authCluster}>
      <a href="/login">
        <Button variant="ghost" size="sm">
          Login
        </Button>
      </a>
      <a href="/register">
        <Button variant="primary" size="sm">
          Sign Up
        </Button>
      </a>
    </div>
  ) : null;

  return (
    <TopBar
      className={className}
      logo={
        <a href={hubUrl} className={styles.logoLink}>
          The Astrogator&apos;s Table
        </a>
      }
      leftContent={
        hasLeft ? (
        <div className={styles.appNav}>
          {appName && (
            <a href={appHref} className={styles.appName}>
              {appName}
            </a>
          )}
          {hasTabs && (
            <nav className={styles.tabs}>
              {navItems!.map((item) => {
                const cls = `${styles.tab} ${item.active ? styles.tabActive : ''}`;
                return item.render ? (
                  <React.Fragment key={item.href}>
                    {item.render({ className: cls, children: item.label })}
                  </React.Fragment>
                ) : (
                  <a key={item.href} href={item.href} className={cls}>
                    {item.label}
                  </a>
                );
              })}
            </nav>
          )}
        </div>
        ) : undefined
      }
      rightContent={
        <>
          {hasExtras && (
            <div className={styles.extrasGroup}>
              {rightExtras}
              {showAllyCode && <AllyCodeDropdown />}
            </div>
          )}
          {authCluster}
        </>
      }
    />
  );
};
