import { describe, expect, it } from 'vitest';
import { parseSearchIntent, resolveSearchFilters } from './searchIntent';

const hotspots = [
  { id: '1', name: 'Allen Safalya', latitude: 25.1, longitude: 75.8, city: 'Kota' },
];

describe('parseSearchIntent', () => {
  it.each([
    ['hostel for boys', 'Hostel', 'male'],
    ['boys hostel', 'Hostel', 'male'],
    ['hostle for boys', 'Hostel', 'male'],
    ['PG for boys', 'PG', 'male'],
    ['boys accommodation', undefined, 'male'],
    ['ladko ke liye pg', 'PG', 'male'],
  ] as const)('maps %s to structured type and suitability', (query, propertyType, gender) => {
    const intent = parseSearchIntent(query, hotspots);
    expect(intent.propertyType).toBe(propertyType);
    expect(intent.gender).toBe(gender);
  });

  it('extracts a hotspot from a natural location query', () => {
    const intent = parseSearchIntent('hostel near Allen Safalya', hotspots);
    expect(intent.hotspot?.name).toBe('Allen Safalya');
    expect(intent.locationQuery).toBe('Allen Safalya');
  });

  it('extracts a locality after removing intent words', () => {
    expect(parseSearchIntent('hostel in Indra Vihar').locationQuery).toBe('indra vihar');
    expect(parseSearchIntent('boy hostel talwandi').locationQuery).toBe('talwandi');
  });

  it('extracts budget and affordability intent', () => {
    const under = parseSearchIntent('hostel under 5000');
    expect(under.maxPrice).toBe(5000);
    expect(parseSearchIntent('cheap hostel').affordable).toBe(true);
  });
});

describe('resolveSearchFilters', () => {
  it('never weakens the stricter explicit budget', () => {
    const intent = parseSearchIntent('hostel under 5000');
    expect(resolveSearchFilters(intent, { maxPrice: 4000 }).filters.maxPrice).toBe(4000);
  });

  it('detects conflicting hard property and gender filters', () => {
    const intent = parseSearchIntent('boys hostel');
    expect(resolveSearchFilters(intent, { propertyType: 'PG' }).conflict).toBe(true);
    expect(resolveSearchFilters(intent, { gender: 'female' }).conflict).toBe(true);
  });
});