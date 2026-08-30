import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  chamfered?: boolean;
  chamferSize?: 'sm' | 'md' | 'lg' | 'asymmetric';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  /**
   * Colour of the whole chamfered outline. The straight-side border AND the
   * diagonal corner lines both take this one value, so corners and sides can
   * never render different colours. Defaults to `var(--color-border)` on a
   * chamfered card, so a chamfered card always has a visible closed edge
   * without the consumer re-declaring a local `border` rule.
   */
  edgeColor?: string;
  /**
   * Draw the 45deg lines across the chamfered corner cuts. Defaults to `true`
   * for a chamfered card — a chamfered card finishes its cut corners with a
   * line, always, so the outline reads as closed. Set `false` only to leave a
   * deliberately bare cut. Ignored on a non-chamfered card. Always uses
   * `edgeColor`; carries no colour of its own.
   */
  showDiagonalBorders?: boolean;
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
  showDiagonalBorders = true,
  edgeColor,
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

  // One colour drives the whole outline. A chamfered card always resolves an
  // edge colour (the prop, or the border token) so its straight edge is never
  // invisible; the diagonal corner lines below read the very same value.
  const resolvedEdgeColor =
    edgeColor ?? (chamfered ? 'var(--color-border)' : undefined);
  const lineStyle = resolvedEdgeColor
    ? ({ color: resolvedEdgeColor } as React.CSSProperties)
    : undefined;
  const rootStyle = resolvedEdgeColor
    ? ({ ...style, ['--card-edge-color']: resolvedEdgeColor } as React.CSSProperties)
    : style;

  return (
    <div
      className={`${styles.card} ${chamfered ? styles.chamfered : ''} ${styles[variant]} ${styles[`padding-${padding}`]} ${chamferClass} ${
        hoverable ? styles.hoverable : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={rootStyle}
    >
      {/* Diagonal corner lines — drawn for every chamfered card so the cut
          corners are always finished off (pass showDiagonalBorders={false} to
          leave a bare cut). Colour is resolvedEdgeColor, the same value that
          paints the straight border, so corners and sides always match. */}
      {chamfered && showDiagonalBorders && (
        <>
          <div className="chamfered-diagonal-border chamfered-diagonal-tl" style={lineStyle} />
          <div className="chamfered-diagonal-border chamfered-diagonal-tr" style={lineStyle} />
          <div className="chamfered-diagonal-border chamfered-diagonal-bl" style={lineStyle} />
          <div className="chamfered-diagonal-border chamfered-diagonal-br" style={lineStyle} />
        </>
      )}
      {children}
    </div>
  );
};
