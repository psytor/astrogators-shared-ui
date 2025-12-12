import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  chamfered?: boolean;
  chamferSize?: 'sm' | 'md' | 'lg' | 'asymmetric';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  showDiagonalBorders?: boolean;
  diagonalBorderColor?: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Card component
 * Container for content with optional chamfered corners and diagonal borders
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  chamfered = false,
  chamferSize = 'md',
  padding = 'md',
  hoverable = false,
  showDiagonalBorders = false,
  diagonalBorderColor,
  className = '',
  onClick,
  style,
}) => {
  const chamferClass = chamfered
    ? chamferSize === 'asymmetric'
      ? 'chamfered-box-asymmetric'
      : chamferSize === 'sm'
      ? 'chamfered-box-sm'
      : chamferSize === 'lg'
      ? 'chamfered-box-lg'
      : 'chamfered-box'
    : '';

  const borderStyle = diagonalBorderColor ? { color: diagonalBorderColor } : undefined;

  return (
    <div
      className={`${styles.card} ${chamfered ? styles.chamfered : ''} ${styles[variant]} ${styles[`padding-${padding}`]} ${chamferClass} ${
        hoverable ? styles.hoverable : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
    >
      {/* Diagonal corner borders (optional) */}
      {showDiagonalBorders && (
        <>
          <div className="chamfered-diagonal-border chamfered-diagonal-tl" style={borderStyle} />
          <div className="chamfered-diagonal-border chamfered-diagonal-tr" style={borderStyle} />
          <div className="chamfered-diagonal-border chamfered-diagonal-bl" style={borderStyle} />
          <div className={`chamfered-diagonal-border ${chamferSize === 'asymmetric' ? 'chamfered-diagonal-br-large' : 'chamfered-diagonal-br'}`} style={borderStyle} />
        </>
      )}
      {children}
    </div>
  );
};
