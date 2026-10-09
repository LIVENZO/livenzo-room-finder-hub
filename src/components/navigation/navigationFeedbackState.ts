export type BottomNavigationLabel = 'Home' | 'Search' | 'Share' | 'Near Me' | 'Profile';

export interface PendingNavigation {
  label: BottomNavigationLabel;
  destination: string;
  originKey: string;
}

export function destinationIsReady(
  pending: PendingNavigation,
  pathname: string,
  key: string,
  loading: boolean,
) {
  return !loading && pathname === pending.destination && key !== pending.originKey;
}