export type BottomNavigationDestination = 'Home' | 'Search' | 'Near Me' | 'Profile';

export interface PendingNavigation {
  destination: BottomNavigationDestination;
  pathname: string;
  originKey: string;
}

export function navigationHasArrived(pending: PendingNavigation, pathname: string, key: string) {
  return pathname === pending.pathname && key !== pending.originKey;
}

export function navigationWasRedirected(pending: PendingNavigation, pathname: string, key: string) {
  return key !== pending.originKey && pathname !== pending.pathname;
}