/**
 * cropImage.js
 * Utility to process cropping (with optional rotation) using HTML5 Canvas.
 */

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Only set crossOrigin for remote http(s) URLs.
    // For blob: URLs (local files), setting crossOrigin causes a CORS
    // error on mobile browsers that makes the canvas draw a black frame.
    if (url && url.startsWith('http')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding box size after rotating a rectangle by `rotation` degrees.
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:  Math.abs(Math.cos(rotRad) * width)  + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width)  + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * @param {string}  imageSrc         - blob: or data: URL of the source image
 * @param {object}  pixelCrop        - { x, y, width, height } from react-easy-crop
 * @param {number}  [rotation]       - degrees (0, 90, 180, 270, -90, …)
 * @param {object}  [targetDimensions] - optional { width, height } to scale crop to exact output size
 * @param {string}  [mimeType]       - 'image/jpeg' | 'image/png'
 * @param {number}  [quality]        - 0.0 - 1.0 (default 0.92)
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  targetDimensions = null,
  mimeType = 'image/jpeg',
  quality = 0.92
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);

  // The rotated image may be larger than the original — compute the bounding box.
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // Step 1 – draw the full rotated image onto an offscreen canvas.
  const offscreen = document.createElement('canvas');
  offscreen.width  = bBoxWidth;
  offscreen.height = bBoxHeight;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return null;

  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = 'high';

  offCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  offCtx.rotate(rotRad);
  offCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Step 2 – crop the rotated result.
  if (targetDimensions?.width && targetDimensions?.height) {
    // Generate exact requested output dimensions (e.g. 1080x1080, 1080x566, 1080x1920)
    canvas.width  = Math.round(targetDimensions.width);
    canvas.height = Math.round(targetDimensions.height);
  } else {
    // Default fallback: Cap output to 1200px on the longer side to avoid memory issues on mobile.
    const scale = Math.min(1, 1200 / Math.max(pixelCrop.width, pixelCrop.height));
    canvas.width  = Math.round(pixelCrop.width  * scale);
    canvas.height = Math.round(pixelCrop.height * scale);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    offscreen,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL(mimeType, quality);
}

/**
 * Helper to export cropped image as a File and Blob at exact dimensions
 */
export async function getCroppedFile(
  imageSrc,
  pixelCrop,
  rotation = 0,
  targetDimensions = null,
  fileName = 'cropped-artwork.jpg',
  mimeType = 'image/jpeg',
  quality = 0.95
) {
  const dataUrl = await getCroppedImg(imageSrc, pixelCrop, rotation, targetDimensions, mimeType, quality);
  if (!dataUrl) throw new Error('Failed to generate cropped image');
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], fileName, { type: mimeType });
  return {
    file,
    blob,
    dataUrl,
    width: targetDimensions?.width || pixelCrop.width,
    height: targetDimensions?.height || pixelCrop.height
  };
}

