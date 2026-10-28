import { describe, expect, it } from 'vitest';
import { getSearchSuggestions, rememberSearch, readRecentSearches, spellingDistance, SearchTerm } from './searchSuggestions';

const catalog: SearchTerm[] = [
  { name: 'Jawahar Nagar', kind: 'location' },
  { name: 'Indra vihar', kind: 'location' },
  { name: 'Talwandi', kind: 'location' },
  { name: 'Allen Safalya', kind: 'hotspot' },
  { name: 'BK Residency', kind: 'building' },
];
describe('evidence-based search suggestions', () => {
  it('does not force an unsupported Zavar to Jawahar correction', () => {
    expect(getSearchSuggestions('Zavar', catalog)).toEqual([]);
  });
  it('accepts verified aliases only when explicitly supplied', () => {
    expect(getSearchSuggestions('Zavar', [{ ...catalog[0], verifiedAliases: ['zavar'] }])[0]).toMatchObject({ query: 'Jawahar Nagar', correction: true });
  });
  it('handles character transpositions and real locality misspellings', () => {
    expect(spellingDistance('talwnadi', 'talwandi')).toBe(1);
    expect(getSearchSuggestions('Talwnadi', catalog)[0]).toMatchObject({ query: 'Talwandi', correction: true });
    expect(getSearchSuggestions('Indra vihr', catalog)[0]).toMatchObject({ query: 'Indra vihar', correction: true });
  });
  it('preserves explicit type, suitability and budget when correcting a hotspot', () => {
    expect(getSearchSuggestions('hostel for boys near Allen Safalye under 5000', catalog)[0]).toMatchObject({ query: 'hostel for boys near Allen Safalya under 5000', correction: true });
  });
  it('does not correct canonical spelling or casing and whitespace', () => {
    expect(getSearchSuggestions('  JAWAHAR   NAGAR ', catalog)[0]).toMatchObject({ correction: false });
    expect(getSearchSuggestions('Allen Safalya', catalog)[0]).toMatchObject({ correction: false });
  });
  it('supports accommodation typos without losing intent', () => {
    expect(getSearchSuggestions('hostle for boys', catalog)[0]).toMatchObject({ query: 'hostel for boys', correction: true });
  });
  it('rejects ambiguous and low-confidence corrections', () => {
    expect(getSearchSuggestions('randomunknown', catalog)).toEqual([]);
    expect(getSearchSuggestions('talwandi', [{ name: 'Talwandu', kind: 'location' }, { name: 'Talwanda', kind: 'location' }]).filter(s => s.correction)).toEqual([]);
  });
  it('suggests actual buildings and partial hotspot names', () => {
    expect(getSearchSuggestions('BK Res', catalog)[0].label).toBe('BK Residency');
    expect(getSearchSuggestions('Allen Saf', catalog)[0].label).toBe('Allen Safalya');
  });
});
describe('local recent searches', () => {
  it('stores at most eight searches with normalized deduplication', () => {
    const history = rememberSearch('  boys hostel  ', ['Boys Hostel', ...Array.from({ length: 12 }, (_, i) => `locality ${i}`)]);
    expect(history).toHaveLength(8);
    expect(history[0]).toBe('boys hostel');
    expect(history.filter(s => s.toLowerCase() === 'boys hostel')).toHaveLength(1);
  });
  it('handles unavailable, corrupted or invalid history safely', () => {
    expect(readRecentSearches({ getItem: () => '{broken' })).toEqual([]);
    expect(readRecentSearches({ getItem: () => '[1,"Hostel",null]' })).toEqual(['Hostel']);
  });
});