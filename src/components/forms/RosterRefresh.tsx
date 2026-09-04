import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import {
  parseBackendTimestamp,
  formatRelativeTime,
  formatCountdown,
} from '../../utils/formatTime';
import styles from './RosterRefresh.module.css';

export interface RosterRefreshProps {
  /** Fired when the user clicks the refresh button. The app owns the actual
   *  re-pull (and any cache-timing state it feeds back in via the props below). */
  onRefresh: () => void;
  /** True while a re-pull is in flight — spins the glyph and disables the button. */
  isRefreshing: boolean;
  /** Backend timestamp of the current snapshot (naive-UTC ISO tolerated). Drives
   *  the "Updated X ago" label; omit / null → no label, just the button. */
  cachedAt?: string | null;
  /** Epoch ms when the next refresh is allowed. Drives the "fresh in m:ss"
   *  countdown and keeps the button disabled until it elapses. */
  refreshAvailableAt?: number | null;
  /** Lead-in word for the label. Default `"Updated"`. */
  labelPrefix?: string;
  className?: string;
}

/**
 * RosterRefresh — the suite-standard NavBar control for re-pulling a player's
 * roster / mod inventory from the game. Compose it into `NavBar`'s `rightExtras`
 * (it is not a `showAllyCode`-style flag because it needs app-specific data).
 *
 * Presentational only: the app performs the fetch in `onRefresh` and feeds the
 * resulting cache timing back through `cachedAt` / `refreshAvailableAt`. This
 * component owns just the 1s display clock for its own label — no network.
 */
export const RosterRefresh: React.FC<RosterRefreshProps> = ({
  onRefresh,
  isRefreshing,
  cachedAt = null,
  refreshAvailableAt = null,
  labelPrefix = 'Updated',
  className = '',
}) => {
  // Display clock — ticks once a second ONLY while there's a snapshot to age or
  // a cooldown to count down. Not data polling: no fetches happen here.
  const [now, setNow] = useState<number>(() => Date.now());
  const runClock =
    Boolean(cachedAt) || (refreshAvailableAt != null && refreshAvailableAt > now);

  useEffect(() => {
    if (!runClock) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runClock]);

  const cooldownRemaining = refreshAvailableAt
    ? Math.max(0, Math.ceil((refreshAvailableAt - now) / 1000))
    : 0;
  const updatedAgo = cachedAt
    ? formatRelativeTime(parseBackendTimestamp(cachedAt), now)
    : null;
  const disabled = isRefreshing || cooldownRemaining > 0;

  const hint =
    cooldownRemaining > 0
      ? `Fresh data available in ${formatCountdown(cooldownRemaining)}`
      : 'Refresh roster';

  return (
    <div className={`${styles.rosterRefresh} ${className}`}>
      {updatedAgo && (
        <span className={styles.updatedLabel} title={hint}>
          {cooldownRemaining > 0
            ? `${labelPrefix} ${updatedAgo} · fresh in ${formatCountdown(cooldownRemaining)}`
            : `${labelPrefix} ${updatedAgo}`}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={disabled}
        title={hint}
        aria-label="Refresh roster"
        className={styles.refreshButton}
      >
        <span className={isRefreshing ? styles.spin : undefined}>⟳</span>
      </Button>
    </div>
  );
};
