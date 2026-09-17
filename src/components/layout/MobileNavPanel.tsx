import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SUITE_NAV, SuiteAppId, SuiteNavSection } from '../../navigation/suiteNav';
import { AllyCodeDropdown } from '../forms/AllyCodeDropdown';
import { AccountCluster } from './AccountCluster';
import { useAuth } from '../../contexts/AuthContext';
import styles from './MobileNavPanel.module.css';

export interface MobileNavPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentApp: SuiteAppId;
  activeSectionId?: string;
  onSectionClick?: (section: SuiteNavSection, event: React.MouseEvent<HTMLAnchorElement>) => void;
  rightExtras?: React.ReactNode;
  showAuth?: boolean;
  panelId: string;
  /** The burger button — focus returns here when Escape closes the panel. */
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

/**
 * Portalled to `document.body`: TopBar's `backdrop-filter` makes the header
 * a containing block for `position: fixed` descendants, which would clip a
 * fixed panel/backdrop rendered inside it. This escapes that entirely.
 *
 * Unlike the lightweight desktop NavMenu disclosures, this behaves like a
 * modal — focus moves in on open, Escape closes and returns focus to the
 * burger, body scroll is locked while open.
 */
export const MobileNavPanel: React.FC<MobileNavPanelProps> = ({
  isOpen,
  onClose,
  currentApp,
  activeSectionId,
  onSectionClick,
  rightExtras,
  showAuth,
  panelId,
  returnFocusRef,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [expandedApp, setExpandedApp] = useState<SuiteAppId | null>(
    currentApp === 'hub' ? null : currentApp
  );
  const panelRef = useRef<HTMLDivElement>(null);

  // Body scroll lock — same idiom as Modal.tsx.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        returnFocusRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    setExpandedApp(currentApp === 'hub' ? null : currentApp);
    panelRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSectionClick =
    (appId: SuiteAppId, section: SuiteNavSection) =>
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (appId === currentApp) {
        onSectionClick?.(section, event);
      }
      onClose();
    };

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.accordion}>
          {SUITE_NAV.map((app) => {
            const isExpanded = expandedApp === app.id;
            const isCurrentApp = currentApp === app.id;
            const visibleSections = app.sections.filter((section) => {
              if (section.requiresAuth && !isAuthenticated) return false;
              if (section.roles && (!user || !section.roles.includes(user.role))) return false;
              return true;
            });
            const accordionPanelId = `mobile-accordion-${app.id}`;

            return (
              <div key={app.id} className={styles.accordionItem}>
                <button
                  type="button"
                  className={`${styles.accordionHeader} ${isCurrentApp ? styles.currentApp : ''}`}
                  aria-expanded={isExpanded}
                  aria-controls={accordionPanelId}
                  onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                >
                  {app.label}
                  <svg
                    className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    aria-hidden="true"
                  >
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
                {isExpanded && (
                  <div id={accordionPanelId} className={styles.accordionPanel}>
                    {app.status === 'coming-soon' ? (
                      <div className={styles.comingSoon}>Coming soon</div>
                    ) : (
                      visibleSections.map((section) => {
                        const isActiveSection = isCurrentApp && activeSectionId === section.id;
                        return (
                          <a
                            key={section.id}
                            href={section.href}
                            className={`${styles.sectionLink} ${
                              isActiveSection ? styles.sectionActive : ''
                            }`}
                            aria-current={isActiveSection ? 'page' : undefined}
                            onClick={handleSectionClick(app.id, section)}
                          >
                            {section.label}
                          </a>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.allySection}>
          <AllyCodeDropdown variant="inline" />
        </div>

        {rightExtras && <div className={styles.extrasSection}>{rightExtras}</div>}

        <div className={styles.accountSection}>
          <AccountCluster showAuth={showAuth} />
        </div>
      </div>
    </div>,
    document.body
  );
};
