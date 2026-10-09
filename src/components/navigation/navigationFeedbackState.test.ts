import { describe, expect, it } from 'bun:test';
import { destinationIsReady, type PendingNavigation } from './navigationFeedbackState';

describe('bottom navigation readiness', () => {
  for (const label of ['Home', 'Search', 'Near Me', 'Profile'] as const) {
    const pending: PendingNavigation = {
      label,
      destination: label === 'Profile' ? '/profile' : '/find-room',
      originKey: 'before-tap',
    };
    it(`${label} stays loading until its destination is ready`, () => {
      expect(destinationIsReady(pending, pending.destination, 'after-tap', true)).toBe(false);
      expect(destinationIsReady(pending, pending.destination, 'after-tap', false)).toBe(true);
    });
    it(`${label} ignores readiness from the previous navigation`, () => {
      expect(destinationIsReady(pending, pending.destination, 'before-tap', false)).toBe(false);
      expect(destinationIsReady(pending, '/other-page', 'after-tap', false)).toBe(false);
    });
  }
});