
import { useEffect, useState } from 'react';

/**
 * Hook to detect if the current device is mobile
 * @returns {boolean} Whether the current device is mobile
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = () => {
      // Check if it's running in a browser environment
      if (typeof window === 'undefined') return false;
      
      // Check if device is mobile based on user agent
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check if the screen size is mobile-like (less than 768px)
      const isMobileScreenSize = window.innerWidth < 768;
      
      setIsMobile(isMobileUserAgent || isMobileScreenSize);
    };

    // Initial check
    checkIfMobile();
    
    // Add event listener for resize to recheck
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
};
