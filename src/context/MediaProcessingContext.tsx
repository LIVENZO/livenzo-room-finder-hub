import React, { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import { mediaProcessingQueue, type MediaJob } from '@/services/MediaProcessingQueue';

interface MediaProcessingContextValue {
  activeJobs: MediaJob[];
  getJob: (roomId: string) => MediaJob | undefined;
  hasActiveJobs: boolean;
}

const MediaProcessingContext = createContext<MediaProcessingContextValue>({
  activeJobs: [],
  getJob: () => undefined,
  hasActiveJobs: false,
});

export const useMediaProcessing = () => useContext(MediaProcessingContext);

export const MediaProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscribe = useCallback((cb: () => void) => mediaProcessingQueue.subscribe(cb), []);
  const getSnapshot = useCallback(() => mediaProcessingQueue.getActiveJobs(), []);

  const activeJobs = useSyncExternalStore(subscribe, getSnapshot);

  const value: MediaProcessingContextValue = {
    activeJobs,
    getJob: (roomId: string) => mediaProcessingQueue.getJob(roomId),
    hasActiveJobs: activeJobs.length > 0,
  };

  return (
    <MediaProcessingContext.Provider value={value}>
      {children}
    </MediaProcessingContext.Provider>
  );
};
