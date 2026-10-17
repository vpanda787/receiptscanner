// Shrink a photo to a JPEG no larger than maxSide px so uploads stay small and fast.
export async function compressImage(file, maxSide = 1600, quality = 0.85) {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image. Choose a photo of a receipt.");
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // e.g. HEIC on some browsers: send the original
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  return blob || file;
}
