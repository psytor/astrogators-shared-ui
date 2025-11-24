import React from 'react';
import styles from './Loader.module.css';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots';
  className?: string;
}

/**
 * Loader component
 * Loading indicator with spinner or dots animation
 */
export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'spinner',
  className = '',
}) => {
  if (variant === 'dots') {
    return (
      <div className={`${styles.dots} ${styles[size]} ${className}`}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    );
  }

  return (
    <div className={`${styles.spinner} ${styles[size]} ${className}`} role="status">
      <span className={styles.visuallyHidden}>Loading...</span>
    </div>
  );
};
