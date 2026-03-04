/**
 * Image compression and thumbnail generation utilities
 * - Full images: max 1280px, WebP format, 82% quality
 * - Thumbnails: 300px wide, WebP format, 75% quality
 */

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const QUALITY = 0.82;
const TARGET_SIZE_BYTES = 2 * 1024 * 1024; // 2MB target

const THUMB_MAX_WIDTH = 300;
const THUMB_MAX_HEIGHT = 300;
const THUMB_QUALITY = 0.75;

/** Check if browser supports WebP encoding */
const supportsWebP = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

const outputFormat = supportsWebP() ? 'image/webp' : 'image/jpeg';
const outputExt = supportsWebP() ? '.webp' : '.jpg';

function resizeAndDraw(
  img: HTMLImageElement,
  maxW: number,
  maxH: number
): HTMLCanvasElement {
  let width = img.width;
  let height = img.height;

  if (width > maxW || height > maxH) {
    const ratio = Math.min(maxW / width, maxH / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  name: string,
  format: string,
  quality: number,
  targetSize?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const tryCompress = (q: number) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            if (q > 0.3) return tryCompress(q - 0.15);
            reject(new Error('Failed to compress image'));
            return;
          }
          if (targetSize && blob.size > targetSize && q > 0.3) {
            tryCompress(q - 0.12);
            return;
          }
          const ext = format === 'image/webp' ? '.webp' : '.jpg';
          const finalName = name.replace(/\.\w+$/, ext);
          resolve(new File([blob], finalName, { type: format, lastModified: Date.now() }));
        },
        format,
        q
      );
    };
    tryCompress(quality);
  });
}

/**
 * Compress a single image → WebP at 1280px max
 */
export const compressImage = async (file: File): Promise<File> => {
  const img = await loadImage(file);
  const canvas = resizeAndDraw(img, MAX_WIDTH, MAX_HEIGHT);
  const compressed = await canvasToFile(canvas, file.name, outputFormat, QUALITY, TARGET_SIZE_BYTES);
  console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB (${outputFormat})`);
  return compressed;
};

/**
 * Generate a 300px thumbnail from an image file
 */
export const generateThumbnail = async (file: File): Promise<File> => {
  const img = await loadImage(file);
  const canvas = resizeAndDraw(img, THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT);
  const thumb = await canvasToFile(canvas, `thumb_${file.name}`, outputFormat, THUMB_QUALITY);
  console.log(`Thumbnail generated: ${(thumb.size / 1024).toFixed(0)}KB (${outputFormat})`);
  return thumb;
};

/**
 * Compress multiple images with retry logic
 */
export const compressImages = async (files: File[]): Promise<File[]> => {
  const compressed: File[] = [];

  for (const file of files) {
    try {
      console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
      compressed.push(await compressImage(file));
    } catch (error) {
      console.error('Compression failed for:', file.name, error);
      // Aggressive fallback
      try {
        const img = await loadImage(file);
        const canvas = resizeAndDraw(img, 1000, 1000);
        const fallback = await canvasToFile(canvas, file.name, 'image/jpeg', 0.6);
        compressed.push(fallback);
        console.log('Aggressive compression succeeded for:', file.name);
      } catch (retryError) {
        throw new Error(`Unable to compress ${file.name}. Please try a different image.`);
      }
    }
  }

  return compressed;
};

/**
 * Generate thumbnails for multiple images
 */
export const generateThumbnails = async (files: File[]): Promise<File[]> => {
  const thumbnails: File[] = [];
  for (const file of files) {
    try {
      thumbnails.push(await generateThumbnail(file));
    } catch (error) {
      console.error('Thumbnail generation failed for:', file.name, error);
      // Skip failed thumbnails - not critical
    }
  }
  return thumbnails;
};

/**
 * Derive thumbnail URL from a full image URL (convention-based)
 * Full: userId/timestamp_random.webp → Thumb: userId/thumbs/timestamp_random.webp
 */
export const getThumbnailUrl = (fullUrl: string): string => {
  try {
    const url = new URL(fullUrl);
    const pathParts = url.pathname.split('/');
    // Find the filename (last part) and insert 'thumbs' before it
    const fileName = pathParts.pop();
    if (!fileName) return fullUrl;
    pathParts.push('thumbs', fileName);
    url.pathname = pathParts.join('/');
    return url.toString();
  } catch {
    return fullUrl;
  }
};
