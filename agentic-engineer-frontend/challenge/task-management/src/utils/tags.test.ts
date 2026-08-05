import { describe, it, expect } from 'vitest';
import { getTagLabel, getTagClassName } from './tags';

describe('getTagLabel', () => {
  it('returns display label for each tag', () => {
    expect(getTagLabel('REACT')).toBe('React');
    expect(getTagLabel('ANDROID')).toBe('Android');
    expect(getTagLabel('IOS')).toBe('IOS APP');
    expect(getTagLabel('NODE_JS')).toBe('Node.js');
    expect(getTagLabel('RAILS')).toBe('Rails');
  });
});

describe('getTagClassName', () => {
  it('returns CSS-safe class suffix for each tag', () => {
    expect(getTagClassName('REACT')).toBe('react');
    expect(getTagClassName('ANDROID')).toBe('android');
    expect(getTagClassName('IOS')).toBe('ios');
    expect(getTagClassName('NODE_JS')).toBe('nodejs');
    expect(getTagClassName('RAILS')).toBe('rails');
  });
});
