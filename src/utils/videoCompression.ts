/**
 * Browser-based video compression using FFmpeg.wasm
 * - Resizes to 720p max
 * - Uses H.264 codec
 * - Targets ~15MB max output
 * - Lazily loads FFmpeg only when needed
 */

import { toast } from 'sonner';

const TARGET_MAX_SIZE = 14 * 1024 * 1024; // 14MB target (leave margin)
const MAX_HEIGHT = 720;

let ffmpegInstance: any = null;
let ffmpegLoading = false;

/**
 * Lazily load and initialize FFmpeg
 */
const getFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) {
    // Wait for ongoing load
    while (ffmpegLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return ffmpegInstance;
  }

  ffmpegLoading = true;
  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('Video compression engine failed to load. Please try a smaller video.');
  } finally {
    ffmpegLoading = false;
  }
};

/**
 * Get video metadata (duration, width, height) using HTML video element
 */
const getVideoInfo = (file: File): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read video metadata'));
    };
  });
};

/**
 * Compress a single video file to 720p H.264
 * Returns the compressed file, or the original if already small enough
 */
export const compressVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  // If already under target size AND is MP4, skip compression
  const info = await getVideoInfo(file);

  if (file.size <= TARGET_MAX_SIZE && info.height <= MAX_HEIGHT) {
    console.log(`Video already optimized: ${(file.size / 1024 / 1024).toFixed(1)}MB, ${info.height}p`);
    return file;
  }

  console.log(
    `Compressing video: ${(file.size / 1024 / 1024).toFixed(1)}MB, ${info.width}x${info.height}, ${info.duration.toFixed(1)}s`
  );

  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  // Calculate target bitrate based on duration
  // Target: 14MB for the video, subtract ~5% for audio
  const videoBudgetBytes = TARGET_MAX_SIZE * 0.92;
  const targetBitrate = Math.floor((videoBudgetBytes * 8) / info.duration); // bits per second
  // Cap at 2.5Mbps for good quality, minimum 500kbps
  const bitrate = Math.max(500_000, Math.min(targetBitrate, 2_500_000));
  const bitrateK = Math.floor(bitrate / 1000);

  // Calculate scale: maintain aspect ratio, max 720p height
  const scale =
    info.height > MAX_HEIGHT ? `scale=-2:${MAX_HEIGHT}` : `scale=-2:${info.height}`;

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.min(Math.round(progress * 100), 99));
    });
  }

  // Write input file
  await ffmpeg.writeFile('input.mp4', await fetchFile(file));

  // Run compression
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-vf', scale,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-b:v', `${bitrateK}k`,
    '-maxrate', `${Math.floor(bitrateK * 1.5)}k`,
    '-bufsize', `${bitrateK * 2}k`,
    '-c:a', 'aac',
    '-b:a', '96k',
    '-movflags', '+faststart',
    '-y',
    'output.mp4',
  ]);

  // Read output
  const outputData = await ffmpeg.readFile('output.mp4');
  const outputBlob = new Blob([outputData], { type: 'video/mp4' });
  const outputFile = new File([outputBlob], file.name.replace(/\.\w+$/, '.mp4'), {
    type: 'video/mp4',
    lastModified: Date.now(),
  });

  // Clean up
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp4');

  console.log(
    `Video compressed: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(outputFile.size / 1024 / 1024).toFixed(1)}MB`
  );

  if (onProgress) onProgress(100);

  return outputFile;
};

/**
 * Compress multiple videos sequentially
 */
export const compressVideos = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<File[]> => {
  const results: File[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const compressed = await compressVideo(files[i], (p) => onProgress?.(i, p));
      results.push(compressed);
    } catch (error: any) {
      console.error(`Video compression failed for ${files[i].name}:`, error);
      // If compression fails but file is under limit, use original
      if (files[i].size <= 15 * 1024 * 1024) {
        results.push(files[i]);
        toast.warning(`Could not compress "${files[i].name}", uploading original.`);
      } else {
        toast.error(
          `"${files[i].name}" is too large (${Math.round(files[i].size / (1024 * 1024))}MB) and compression failed. Please try a shorter video.`
        );
      }
    }
  }

  return results;
};
