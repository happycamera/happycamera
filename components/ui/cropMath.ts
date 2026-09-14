export const CROP_ASPECT = 4 / 3;
export const FINAL_MAX_DIMENSION = 2400;
export const RESIZE_THRESHOLD_BYTES = 5 * 1024 * 1024;
export const ABSURD_CEILING_BYTES = 50 * 1024 * 1024;
export const PRE_RESIZE_MAX = 2400;
export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isHeicLike(file: { type: string; name: string }): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.type === "image/heic-sequence" ||
    file.type === "image/heif-sequence" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name)
  );
}

export function resolveCropRect(crop: Rect, imageW: number, imageH: number): Rect {
  const touchesX = crop.x <= 1 || crop.x + crop.width >= imageW - 1;
  const touchesY = crop.y <= 1 || crop.y + crop.height >= imageH - 1;
  const aspectOk = Math.abs(crop.width / crop.height - CROP_ASPECT) <= 0.005;

  let rect: Rect;
  if (!touchesX && !touchesY && aspectOk) {
    rect = { ...crop };
  } else {
    let cw: number;
    let ch: number;
    if (imageW >= imageH * CROP_ASPECT) {
      ch = imageH;
      cw = imageH * CROP_ASPECT;
    } else {
      cw = imageW;
      ch = imageW / CROP_ASPECT;
    }
    rect = { x: (imageW - cw) / 2, y: (imageH - ch) / 2, width: cw, height: ch };
  }

  let x = Math.max(0, Math.round(rect.x));
  let y = Math.max(0, Math.round(rect.y));
  let w = Math.round(rect.width);
  let h = Math.round(rect.height);
  if (x + w > imageW) w = imageW - x;
  if (y + h > imageH) h = imageH - y;
  w = Math.max(1, w);
  h = Math.max(1, h);

  return { x, y, width: w, height: h };
}

export function scaleToMax(
  width: number,
  height: number,
  max: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const ratio = max / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export function resizeDataUrl(dataUrl: string, max = PRE_RESIZE_MAX): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scaled = scaleToMax(img.naturalWidth, img.naturalHeight, max);
      const canvas = document.createElement("canvas");
      canvas.width = scaled.width;
      canvas.height = scaled.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const out = canvas.toDataURL("image/jpeg", 0.85);
      resolve(out);
    };
    img.onerror = () => reject(new Error("Failed to load image for resizing"));
    img.src = dataUrl;
  });
}