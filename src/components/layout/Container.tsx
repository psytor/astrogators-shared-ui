import React from 'react';
import { ReactNode, CSSProperties } from 'react';
import styles from './Container.module.css';

export interface ContainerProps {
  children: ReactNode;
  maxWidth?: string;
  style?: CSSProperties;
  padding?: boolean;
  className?: string;
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
}) => {
  return (
    <div
      className={`${styles.container} ${styles[`maxWidth-${maxWidth}`]} ${
        padding ? styles.padding : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
