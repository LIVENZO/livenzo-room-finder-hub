import React from 'react';
import { useMediaProcessing } from '@/context/MediaProcessingContext';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { mediaProcessingQueue } from '@/services/MediaProcessingQueue';

/**
 * Global floating indicator showing active background media processing jobs.
 * Rendered at app level so it persists across navigation.
 */
const MediaProcessingIndicator: React.FC = () => {
  const { hasActiveJobs, activeJobs } = useMediaProcessing();
  const allJobs = mediaProcessingQueue.getAllJobs();
  
  // Show recently completed jobs too
  const visibleJobs = allJobs.filter(
    (j) => j.status === 'queued' || j.status === 'processing' || j.status === 'done' || j.status === 'error'
  );

  if (visibleJobs.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-80">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {hasActiveJobs ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Processing media in background…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Media processing complete
            </>
          )}
        </div>

        {visibleJobs.map((job) => (
          <div key={job.roomId} className="space-y-1">
            {(job.status === 'queued' || job.status === 'processing') && (
              <>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Optimizing images & videos</span>
                  <span>{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-2" />
              </>
            )}
            {job.status === 'done' && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All media optimized
              </p>
            )}
            {job.status === 'error' && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {job.error || 'Processing failed'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaProcessingIndicator;
