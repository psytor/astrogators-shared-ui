import React, { useRef } from 'react';
import { SuiteNavApp, SuiteNavLink, isSuiteNavGroup } from '../../navigation/suiteNav';
import { useAuth } from '../../contexts/AuthContext';
import { useDismissableMenu } from '../../hooks/useDismissableMenu';
import styles from './NavMenu.module.css';

export interface NavMenuProps {
  app: SuiteNavApp;
  isCurrentApp: boolean;
  activeSectionId?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSectionClick?: (section: SuiteNavLink, event: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * One trigger + dropdown panel per SUITE_NAV app. Disclosure pattern, not
 * `role="menu"` — these are page links, so Tab moves through them like any
 * other link list; arrow keys are an additive convenience, not a
 * replacement for Tab. A group entry (e.g. "Evaluations") renders its own
 * link plus its `items` nested and indented underneath — still all flat
 * `<a>`s in Tab order, just visually grouped.
 */
export const NavMenu: React.FC<NavMenuProps> = ({
  app,
  isCurrentApp,
  activeSectionId,
  isOpen,
  onOpenChange,
  onSectionClick,
}) => {
  const { isAuthenticated, user } = useAuth();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = `navmenu-panel-${app.id}`;

  useDismissableMenu({
    isOpen,
    onClose: () => onOpenChange(false),
    triggerRef,
    panelRef,
  });

  const isVisible = (link: SuiteNavLink) => {
    if (link.requiresAuth && !isAuthenticated) return false;
    if (link.roles && (!user || !link.roles.includes(user.role))) return false;
    return true;
  };

  const handleLinkClick = (link: SuiteNavLink) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isCurrentApp) {
      onSectionClick?.(link, event);
    }
    onOpenChange(false);
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a'));
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (currentIndex === -1) return;
    event.preventDefault();
    const nextIndex =
      event.key === 'ArrowDown'
        ? (currentIndex + 1) % links.length
        : (currentIndex - 1 + links.length) % links.length;
    links[nextIndex]?.focus();
  };

  const renderLink = (link: SuiteNavLink, extraClassName?: string) => {
    const isActiveSection = isCurrentApp && activeSectionId === link.id;
    return (
      <a
        key={link.id}
        href={link.href}
        className={`${styles.sectionLink} ${extraClassName ?? ''} ${isActiveSection ? styles.sectionActive : ''}`}
        aria-current={isActiveSection ? 'page' : undefined}
        onClick={handleLinkClick(link)}
      >
        {link.label}
      </a>
    );
  };

  return (
    <div className={styles.navMenu}>
      <button
        type="button"
        ref={triggerRef}
        className={`${styles.trigger} ${isCurrentApp ? styles.tabActive : ''}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => onOpenChange(!isOpen)}
      >
        {app.label}
        <svg className={styles.chevron} width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div id={panelId} ref={panelRef} className={styles.panel}>
          {app.status === 'coming-soon' ? (
            <div className={styles.comingSoon}>Coming soon</div>
          ) : (
            <nav aria-label={`${app.label} sections`} onKeyDown={handlePanelKeyDown}>
              {app.sections.map((entry) => {
                if (!isSuiteNavGroup(entry)) {
                  if (!isVisible(entry)) return null;
                  return renderLink(entry);
                }
                const visibleItems = entry.items.filter(isVisible);
                return (
                  <div key={entry.id} className={styles.group}>
                    {renderLink(entry, styles.groupLabel)}
                    <div className={styles.groupItems}>
                      {visibleItems.map((item) => renderLink(item, styles.groupItem))}
                    </div>
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      )}
    </div>
  );
};
