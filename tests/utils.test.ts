import { describe, expect, it } from 'vitest';
import { formatAllyCode, unformatAllyCode } from '../src/utils/formatAllyCode';
import { formatCountdown, formatRelativeTime, parseBackendTimestamp } from '../src/utils/formatTime';

describe('formatAllyCode', () => {
  it('formats 9 digits as ###-###-###', () => {
    expect(formatAllyCode('123456789')).toBe('123-456-789');
  });

  it('leaves anything that is not 9 characters untouched', () => {
    expect(formatAllyCode('12345')).toBe('12345');
    expect(formatAllyCode('')).toBe('');
  });

  it('unformat is the inverse', () => {
    expect(unformatAllyCode('123-456-789')).toBe('123456789');
    expect(unformatAllyCode(formatAllyCode('987654321'))).toBe('987654321');
  });
});

describe('parseBackendTimestamp', () => {
  it('treats a naive timestamp as UTC, not local time', () => {
    expect(parseBackendTimestamp('2026-09-04T12:34:56').toISOString()).toBe('2026-09-04T12:34:56.000Z');
  });

  it('leaves timestamps that already carry a Z or an offset alone', () => {
    expect(parseBackendTimestamp('2026-09-04T12:34:56Z').toISOString()).toBe('2026-09-04T12:34:56.000Z');
    expect(parseBackendTimestamp('2026-09-04T14:34:56+02:00').toISOString()).toBe('2026-09-04T12:34:56.000Z');
  });
});

describe('formatRelativeTime', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const at = (seconds: number) => t0.getTime() + seconds * 1000;

  it.each([
    [0, '0s ago'],
    [59, '59s ago'],
    [60, '1m ago'],
    [3599, '59m ago'],
    [3600, '1h ago'],
    [86399, '23h ago'],
    [86400, '1d ago'],
    [3 * 86400, '3d ago'],
  ])('%is elapsed -> %s', (seconds, expected) => {
    expect(formatRelativeTime(t0, at(seconds))).toBe(expected);
  });

  it('never goes negative when the timestamp is slightly in the future (clock skew)', () => {
    expect(formatRelativeTime(t0, at(-5))).toBe('0s ago');
  });
});

describe('formatCountdown', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [59, '0:59'],
    [60, '1:00'],
    [125, '2:05'],
    [600, '10:00'],
  ])('%is -> %s', (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });
});
