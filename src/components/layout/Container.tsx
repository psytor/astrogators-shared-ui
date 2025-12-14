import React, { CSSProperties } from 'react';
import styles from './Container.module.css';

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Container component
 * Centers content and applies max-width constraints
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = true,
  className = '',
  style,
}) => {
  return (
    <div
      className={`${styles.container} ${styles[`maxWidth-${maxWidth}`]} ${
        padding ? styles.padding : ''
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
