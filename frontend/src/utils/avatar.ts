/**
 * Resolves an avatar URL into a loadable image source URL.
 * Handles:
 * - Data URLs (data:image/webp;base64,...)
 * - Absolute URLs (https://..., http://...)
 * - Backend relative paths (/uploads/avatars/...)
 */
export function getAvatarUrl(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl || typeof avatarUrl !== 'string') return undefined;
  if (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  // Relative path from backend
  const backendBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
  const origin = backendBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}

/**
 * Converts any image file (PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, HEIC)
 * into a center-cropped, high-resolution WebP Data URL using HTML5 Canvas.
 */
export function processImageToWebP(file: File, maxSize = 400, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|svg|bmp|heic)$/i)) {
      reject(new Error('Selected file is not a supported image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Calculate square crop dimensions
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        const canvas = document.createElement('canvas');
        const targetSize = Math.min(minDim, maxSize);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // High quality bicubic smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw center-cropped square
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);

        // Export as WebP
        try {
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(webpDataUrl);
        } catch {
          // Fallback to PNG if browser somehow cannot export webp
          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

