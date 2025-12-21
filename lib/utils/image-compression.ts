/**
 * Image compression utility
 * Compresses images to max 1MB while maintaining quality
 */

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compress image to max 1MB
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1, // 1MB default
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85, // 85% quality
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // If file is already smaller than max size, return as is
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // If still too large, reduce quality further
            if (blob.size > maxSizeBytes) {
              compressWithLowerQuality(canvas, maxSizeBytes, quality - 0.1)
                .then((compressedBlob) => {
                  const compressedFile = new File(
                    [compressedBlob],
                    file.name,
                    { type: 'image/jpeg' } // Convert to JPEG for better compression
                  );
                  resolve(compressedFile);
                })
                .catch(reject);
            } else {
              // Determine output format
              const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const compressedFile = new File(
                [blob],
                file.name,
                { type: outputType }
              );
              resolve(compressedFile);
            }
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        );
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
}

/**
 * Compress with progressively lower quality until size is acceptable
 */
function compressWithLowerQuality(
  canvas: HTMLCanvasElement,
  maxSizeBytes: number,
  initialQuality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let quality = initialQuality;
    const minQuality = 0.3; // Minimum quality (30%)

    const tryCompress = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          if (blob.size <= maxSizeBytes || quality <= minQuality) {
            resolve(blob);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        },
        'image/jpeg', // Always use JPEG for maximum compression
        quality
      );
    };

    tryCompress();
  });
}

/**
 * Validate and compress image file
 * Returns compressed file if needed, or original if already small enough
 */
export async function validateAndCompressImage(
  file: File,
  maxSizeMB: number = 1
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const originalSize = file.size;

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // If file is already small enough, return as is
  if (file.size <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: file.size,
    };
  }

  // Compress the image
  const compressedFile = await compressImage(file, { maxSizeMB });
  
  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}


