import { describe, it, expect } from 'vitest';
import { formatDate, getDateColor, getPointLabel } from '../utils/date';
import { getTagLabel, getTagClassName } from '../utils/tags';

// Since useTasks now depends on Apollo Client and a live API,
// we test the utility functions it relies on instead.
// Integration tests for the full hook would require mocking the GraphQL client.

describe('date utilities', () => {
  it('formatDate returns a non-empty string', () => {
    const result = formatDate('2026-08-05T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('getDateColor returns "red" for past dates', () => {
    const pastDate = new Date(Date.now() - 86400000 * 5).toISOString();
    expect(getDateColor(pastDate)).toBe('red');
  });

  it('getDateColor returns "yellow" for dates within 2 days', () => {
    const soonDate = new Date(Date.now() + 86400000).toISOString();
    expect(getDateColor(soonDate)).toBe('yellow');
  });

  it('getDateColor returns "green" for dates more than 2 days away', () => {
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
    expect(getDateColor(futureDate)).toBe('green');
  });

  it('getPointLabel returns correct labels', () => {
    expect(getPointLabel('ZERO')).toBe('0 Points');
    expect(getPointLabel('FOUR')).toBe('4 Points');
    expect(getPointLabel('EIGHT')).toBe('8 Points');
  });

  it('getPointLabel returns raw value for unknown inputs', () => {
    expect(getPointLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('tag utilities', () => {
  it('getTagLabel returns the display label for each tag', () => {
    expect(getTagLabel('REACT')).toBe('React');
    expect(getTagLabel('ANDROID')).toBe('Android');
    expect(getTagLabel('IOS')).toBe('IOS APP');
    expect(getTagLabel('NODE_JS')).toBe('Node.js');
    expect(getTagLabel('RAILS')).toBe('Rails');
  });

  it('getTagClassName returns a CSS-safe class suffix', () => {
    expect(getTagClassName('REACT')).toBe('react');
    expect(getTagClassName('NODE_JS')).toBe('nodejs');
    expect(getTagClassName('ANDROID')).toBe('android');
  });
});
