/**
 * Compress image files to ensure they're under size limits
 */

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const QUALITY = 0.9;
const TARGET_SIZE_BYTES = 3 * 1024 * 1024; // Target 3MB to be safe

/**
 * Compress an image file using canvas - ALWAYS compresses to ensure upload success
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels until we get under target size
        const tryCompress = (q: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // If blob creation fails, try with even lower quality
                if (q > 0.2) {
                  tryCompress(q - 0.15);
                  return;
                }
                reject(new Error('Failed to compress image'));
                return;
              }

              // If still too large and quality can be reduced, try again
              if (blob.size > TARGET_SIZE_BYTES && q > 0.2) {
                console.log(`Compressed to ${(blob.size / 1024 / 1024).toFixed(2)}MB, trying lower quality...`);
                tryCompress(q - 0.15);
                return;
              }

              // Convert to JPEG if it's not already (better compression)
              const finalType = file.type === 'image/png' ? 'image/jpeg' : file.type;
              const finalName = file.name.replace(/\.(png|webp)$/i, '.jpg');
              
              // Create new file from blob
              const compressedFile = new File([blob], finalName, {
                type: finalType,
                lastModified: Date.now(),
              });

              console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(compressedFile);
            },
            'image/jpeg', // Always use JPEG for best compression
            q
          );
        };

        tryCompress(QUALITY);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress multiple images with retry logic
 */
export const compressImages = async (files: File[]): Promise<File[]> => {
  const compressed: File[] = [];
  
  for (const file of files) {
    try {
      console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
      const compressedFile = await compressImage(file);
      compressed.push(compressedFile);
    } catch (error) {
      console.error('First compression attempt failed for:', file.name, error);
      
      // If compression fails, try with more aggressive settings
      try {
        console.log('Retrying compression with aggressive settings...');
        const canvas = document.createElement('canvas');
        const img = new Image();
        const reader = new FileReader();
        
        const aggressiveCompress = await new Promise<File>((resolve, reject) => {
          reader.onload = (e) => {
            img.onload = () => {
              // Very aggressive size reduction
              const maxDim = 1200;
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                if (width > maxDim) {
                  height = (height * maxDim) / width;
                  width = maxDim;
                }
              } else {
                if (height > maxDim) {
                  width = (width * maxDim) / height;
                  height = maxDim;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                reject(new Error('Canvas error'));
                return;
              }
              
              ctx.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const finalFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    resolve(finalFile);
                  } else {
                    reject(new Error('Blob creation failed'));
                  }
                },
                'image/jpeg',
                0.6 // Very aggressive quality
              );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = e.target?.result as string;
          };
          reader.onerror = () => reject(new Error('File read failed'));
          reader.readAsDataURL(file);
        });
        
        compressed.push(aggressiveCompress);
        console.log('Aggressive compression succeeded');
      } catch (retryError) {
        console.error('Aggressive compression also failed:', retryError);
        // Last resort: create a tiny placeholder or skip
        throw new Error(`Unable to compress ${file.name}. Please try a different image.`);
      }
    }
  }
  
  return compressed;
};
