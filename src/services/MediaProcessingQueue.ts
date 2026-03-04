/**
 * Singleton background media processing queue.
 * Compresses images/videos after instant listing creation,
 * then re-uploads optimized files and updates the DB.
 */

import { supabase } from '@/integrations/supabase/client';
import { compressImage, generateThumbnail } from '@/utils/imageCompression';
import { compressVideo } from '@/utils/videoCompression';
import { toast } from 'sonner';

export interface MediaJob {
  roomId: string;
  userId: string;
  originalImageUrls: string[];
  originalVideoUrls: string[];
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number; // 0-100
  error?: string;
}

type Listener = () => void;

class MediaProcessingQueue {
  private jobs: Map<string, MediaJob> = new Map();
  private processing = false;
  private queue: string[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getJob(roomId: string): MediaJob | undefined {
    return this.jobs.get(roomId);
  }

  getAllJobs(): MediaJob[] {
    return Array.from(this.jobs.values());
  }

  getActiveJobs(): MediaJob[] {
    return this.getAllJobs().filter((j) => j.status === 'queued' || j.status === 'processing');
  }

  /**
   * Enqueue a room for background media processing.
   * Call this right after the room listing is saved with original media.
   */
  enqueue(roomId: string, userId: string, imageUrls: string[], videoUrls: string[]) {
    if (this.jobs.has(roomId)) return; // Already queued

    const job: MediaJob = {
      roomId,
      userId,
      originalImageUrls: imageUrls,
      originalVideoUrls: videoUrls,
      status: 'queued',
      progress: 0,
    };

    this.jobs.set(roomId, job);
    this.queue.push(roomId);
    this.notify();
    this.processNext();
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const roomId = this.queue.shift()!;
    const job = this.jobs.get(roomId)!;

    job.status = 'processing';
    job.progress = 5;
    this.notify();

    try {
      const totalSteps =
        job.originalImageUrls.length * 2 + job.originalVideoUrls.length * 3 + 1; // +1 for DB update
      let completedSteps = 0;

      const updateProgress = () => {
        completedSteps++;
        job.progress = Math.min(Math.round((completedSteps / totalSteps) * 100), 99);
        this.notify();
      };

      // --- Process images ---
      const optimizedImageUrls: string[] = [];
      for (const url of job.originalImageUrls) {
        try {
          // Download original
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: blob.type });

          // Compress
          const compressed = await compressImage(file);
          updateProgress();

          // Generate thumbnail
          const thumbnail = await generateThumbnail(file);
          updateProgress();

          // Upload compressed
          const compressedUrl = await this.uploadFile(compressed, job.userId, 'rooms');
          if (compressedUrl) {
            optimizedImageUrls.push(compressedUrl);
            // Upload thumbnail (best effort)
            await this.uploadThumbnail(thumbnail, job.userId, 'rooms', compressedUrl);
          } else {
            optimizedImageUrls.push(url); // Keep original on failure
          }
        } catch (err) {
          console.error('Background image compression failed:', err);
          optimizedImageUrls.push(url); // Keep original
          updateProgress();
          updateProgress();
        }
      }

      // --- Process videos ---
      const optimizedVideoUrls: string[] = [];
      for (const url of job.originalVideoUrls) {
        try {
          // Download original
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
          updateProgress();

          // Compress
          const compressed = await compressVideo(file, (p) => {
            job.progress = Math.min(
              Math.round(((completedSteps + (p / 100)) / totalSteps) * 100),
              99
            );
            this.notify();
          });
          updateProgress();

          // Upload compressed
          const compressedUrl = await this.uploadFile(compressed, job.userId, 'rooms', 'video/mp4');
          updateProgress();

          if (compressedUrl) {
            optimizedVideoUrls.push(compressedUrl);
          } else {
            optimizedVideoUrls.push(url);
          }
        } catch (err) {
          console.error('Background video compression failed:', err);
          optimizedVideoUrls.push(url);
          updateProgress();
          updateProgress();
          updateProgress();
        }
      }

      // --- Update DB ---
      const { error } = await supabase
        .from('rooms')
        .update({
          images: optimizedImageUrls,
          videos: optimizedVideoUrls,
          media_processing: false,
        })
        .eq('id', roomId);

      if (error) {
        console.error('Failed to update room with optimized media:', error);
        job.status = 'error';
        job.error = error.message;
      } else {
        job.status = 'done';
        job.progress = 100;
        toast.success('Media optimization complete for your listing!', { duration: 4000 });
      }
    } catch (err: any) {
      console.error('Background processing failed:', err);
      job.status = 'error';
      job.error = err.message;

      // Mark room as not processing even on error
      await supabase
        .from('rooms')
        .update({ media_processing: false })
        .eq('id', roomId)
        .then(() => {});
    } finally {
      this.processing = false;
      this.notify();

      // Auto-clean done/error jobs after 30 seconds
      setTimeout(() => {
        if (job.status === 'done' || job.status === 'error') {
          this.jobs.delete(roomId);
          this.notify();
        }
      }, 30000);

      // Process next in queue
      this.processNext();
    }
  }

  private async uploadFile(
    file: File,
    userId: string,
    bucket: string,
    contentType?: string
  ): Promise<string | null> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'webp';
    const filePath = `${userId}/${timestamp}_${random}.${ext}`;

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: contentType || file.type,
    });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData?.publicUrl || null;
  }

  private async uploadThumbnail(
    file: File,
    userId: string,
    bucket: string,
    fullUrl: string
  ): Promise<void> {
    try {
      // Extract filename from full URL to create matching thumb path
      const url = new URL(fullUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts.pop();
      if (!fileName) return;

      const thumbPath = `${userId}/thumbs/${fileName}`;

      await supabase.storage.from(bucket).upload(thumbPath, file, {
        cacheControl: '31536000',
        upsert: false,
        contentType: file.type,
      });
    } catch (err) {
      console.warn('Thumbnail upload failed (non-critical):', err);
    }
  }
}

// Singleton instance
export const mediaProcessingQueue = new MediaProcessingQueue();
