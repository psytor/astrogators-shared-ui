import React from 'react';
import styles from './TopBar.module.css';

export interface TopBarProps {
  logo?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

/**
 * TopBar component
 * Global navigation bar shown across all applications
 */
export const TopBar: React.FC<TopBarProps> = ({
  logo,
  leftContent,
  rightContent,
  className = '',
}) => {
  return (
    <header className={`${styles.topBar} ${className}`}>
      <div className={styles.content}>
        {/* Left section - Logo and navigation */}
        <div className={styles.left}>
          {logo && <div className={styles.logo}>{logo}</div>}
          {leftContent}
        </div>

        {/* Right section - User menu, login, etc */}
        <div className={styles.right}>{rightContent}</div>
      </div>
    </header>
  );
};
