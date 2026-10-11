import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { navigationHasArrived, navigationWasRedirected, PendingNavigation } from './navigationLoading';

const home: PendingNavigation = { destination: 'Home', pathname: '/find-room', originKey: 'profile-page' };

test('Home cannot finish while the previous Profile page is visible', () => {
  assert.equal(navigationHasArrived(home, '/profile', 'profile-page'), false);
  assert.equal(navigationHasArrived(home, '/find-room', 'home-page'), true);
});

test('same-page Search waits for the new navigation request', () => {
  const search: PendingNavigation = { destination: 'Search', pathname: '/find-room', originKey: 'old-search' };
  assert.equal(navigationHasArrived(search, '/find-room', 'old-search'), false);
  assert.equal(navigationHasArrived(search, '/find-room', 'new-search'), true);
});

test('Profile auth redirects release loading rather than blocking the landing page', () => {
  const profile: PendingNavigation = { destination: 'Profile', pathname: '/profile', originKey: 'listings' };
  assert.equal(navigationWasRedirected(profile, '/find-room', 'listings'), false);
  assert.equal(navigationWasRedirected(profile, '/profile', 'profile-loading'), false);
  assert.equal(navigationWasRedirected(profile, '/', 'auth-redirect'), true);
});