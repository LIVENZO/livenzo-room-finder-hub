import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationNavigationService } from '@/services/NotificationNavigationService';

export const useNotificationNavigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set the navigate function for the service
    NotificationNavigationService.setNavigate(navigate);
    
    // Initialize notification listener
    NotificationNavigationService.initializeNotificationListener();
    
    return () => {
      // Cleanup if needed
      NotificationNavigationService.setNavigate(null as any);
    };
  }, [navigate]);
};