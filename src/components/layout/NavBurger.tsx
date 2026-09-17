import { forwardRef } from 'react';
import styles from './NavBurger.module.css';

export interface NavBurgerProps {
  isOpen: boolean;
  onClick: () => void;
  controlsId: string;
}

/**
 * Mobile-only burger/✕ toggle. Stateless — NavBar owns whether the mobile
 * panel is open; this just renders the current state and reports clicks.
 * Forwards its ref so MobileNavPanel can return focus here on Escape.
 */
export const NavBurger = forwardRef<HTMLButtonElement, NavBurgerProps>(
  ({ isOpen, onClick, controlsId }, ref) => (
    <button
      ref={ref}
      type="button"
      className={styles.burger}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
    >
      {isOpen ? (
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
);

NavBurger.displayName = 'NavBurger';
