// ============================================================================
// Pagmenos — Browser Image Compressor (100% local, zero API, zero cost)
// ============================================================================
// Uses native Canvas API to resize and compress images to WebP.
// No external service, no SaaS, no server — runs entirely in the browser.

export interface CompressionResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  savings: number; // percentage
  format: string;
}

const MAX_PRODUCT_DIMENSION = 1200;
const MAX_BANNER_DIMENSION = 1600;
const INITIAL_QUALITY = 0.76;
const MIN_QUALITY = 0.55;
const MAX_SIZE_BYTES = 200_000; // 200KB target

/**
 * Compresses a product image for upload.
 * - Resizes to max 1200px on longest side
 * - Exports as WebP ~0.76 quality
 * - Adaptive: reduces quality if still too large
 * - Returns Blob ready for upload
 */
export async function compressProductImage(file: File): Promise<CompressionResult> {
  return compressImage(file, MAX_PRODUCT_DIMENSION);
}

/**
 * Compresses a banner image for upload.
 * - Resizes to max 1600px on longest side
 */
export async function compressBannerImage(file: File): Promise<CompressionResult> {
  return compressImage(file, MAX_BANNER_DIMENSION);
}

async function compressImage(file: File, maxDimension: number): Promise<CompressionResult> {
  // Validate
  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo inválido. Selecione uma imagem (JPEG, PNG ou WebP).');
  }

  const originalSize = file.size;

  // Decode image
  const bitmap = await createImageBitmap(file);
  const { width: origW, height: origH } = bitmap;

  // Calculate resize
  let targetW = origW;
  let targetH = origH;

  if (origW > maxDimension || origH > maxDimension) {
    if (origW >= origH) {
      targetW = maxDimension;
      targetH = Math.round((origH / origW) * maxDimension);
    } else {
      targetH = maxDimension;
      targetW = Math.round((origW / origH) * maxDimension);
    }
  }

  // Use OffscreenCanvas if available, fallback to regular Canvas
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(targetW, targetH);
    ctx = canvas.getContext('2d');
  } else {
    canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    ctx = canvas.getContext('2d');
  }

  if (!ctx) throw new Error('Não foi possível criar o contexto de renderização.');

  // Draw resized image
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // Export as WebP with adaptive quality
  let quality = INITIAL_QUALITY;
  let blob: Blob;

  // Check if WebP is supported
  const supportsWebP = await checkWebPSupport();
  const format = supportsWebP ? 'image/webp' : 'image/jpeg';

  blob = await exportBlob(canvas, format, quality);

  // Adaptive quality reduction if still too large
  let attempts = 0;
  while (blob.size > MAX_SIZE_BYTES && quality > MIN_QUALITY && attempts < 5) {
    quality -= 0.05;
    blob = await exportBlob(canvas, format, quality);
    attempts++;
  }

  const compressedSize = blob.size;
  const savings = Math.round((1 - compressedSize / originalSize) * 100);

  return {
    blob,
    width: targetW,
    height: targetH,
    originalSize,
    compressedSize,
    savings: Math.max(0, savings),
    format: supportsWebP ? 'webp' : 'jpeg',
  };
}

async function exportBlob(canvas: HTMLCanvasElement | OffscreenCanvas, type: string, quality: number): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao exportar imagem'))),
      type,
      quality
    );
  });
}

async function checkWebPSupport(): Promise<boolean> {
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const c = new OffscreenCanvas(1, 1);
      const b = await c.convertToBlob({ type: 'image/webp' });
      return b.type === 'image/webp';
    } catch { return false; }
  }
  return new Promise((resolve) => {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    c.toBlob((b) => resolve(b?.type === 'image/webp'), 'image/webp');
  });
}
