import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  chamfered?: boolean;
  chamferSize?: 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Card component
 * Container for content with optional chamfered corners
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  chamfered = false,
  chamferSize = 'md',
  padding = 'md',
  hoverable = false,
  className = '',
  onClick,
}) => {
  const chamferClass = chamfered
    ? chamferSize === 'sm'
      ? 'chamfered-box-sm'
      : chamferSize === 'lg'
      ? 'chamfered-box-lg'
      : 'chamfered-box'
    : '';

  return (
    <div
      className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${chamferClass} ${
        hoverable ? styles.hoverable : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};
