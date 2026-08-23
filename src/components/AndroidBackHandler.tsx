import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HOME_PATHS = ['/', '/find-room', '/dashboard'];

/**
 * Makes the Android hardware back button behave like normal Android navigation:
 * go back through in-app history first, and only exit the app when there is
 * nothing left to go back to.
 */
const AndroidBackHandler = () => {
  const location = useLocation();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    import('@capacitor/app')
      .then(({ App }) => {
        const handle = App.addListener('backButton', ({ canGoBack }) => {
          const atRoot = HOME_PATHS.includes(window.location.pathname);

          if (canGoBack || (!atRoot && window.history.length > 1)) {
            // Let the router / any popstate handlers (modals, viewers) react
            window.history.back();
          } else {
            App.exitApp();
          }
        });

        cleanup = () => {
          Promise.resolve(handle).then((h) => h.remove()).catch(() => {});
        };
      })
      .catch(() => {
        // Not running in a Capacitor environment — nothing to do.
      });

    return () => cleanup?.();
  }, []);

  // location referenced so the component stays mounted with router context
  void location;

  return null;
};

export default AndroidBackHandler;
