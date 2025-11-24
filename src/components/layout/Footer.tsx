import React from 'react';
import styles from './Footer.module.css';

export interface FooterProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Footer component
 * Global footer shown across all applications
 */
export const Footer: React.FC<FooterProps> = ({ children, className = '' }) => {
  return (
    <footer className={`${styles.footer} ${className}`}>
      <div className={styles.content}>
        {children || (
          <div className={styles.defaultContent}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} The Astrogator's Table. All rights reserved.
            </p>
            <p className={styles.disclaimer}>
              Star Wars: Galaxy of Heroes is a trademark of Electronic Arts Inc.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
};
