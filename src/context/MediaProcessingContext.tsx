import React, { createContext, useContext, useRef, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
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
  
  // Cache the snapshot to return the same reference when data hasn't changed
  const cachedRef = useRef<MediaJob[]>([]);
  const getSnapshot = useCallback(() => {
    const jobs = mediaProcessingQueue.getActiveJobs();
    // Only return new reference if length changed (simple check)
    if (jobs.length !== cachedRef.current.length) {
      cachedRef.current = jobs;
    } else {
      // Check if any job changed
      const changed = jobs.some((j, i) => {
        const prev = cachedRef.current[i];
        return !prev || prev.roomId !== j.roomId || prev.status !== j.status || prev.progress !== j.progress;
      });
      if (changed) {
        cachedRef.current = jobs;
      }
    }
    return cachedRef.current;
  }, []);

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
