/** Source-pixel rectangle shared by the live crop preview and the exported image. */
export function cropRect(width: number, height: number, aspect: number, zoom = 1, x = 50, y = 50) {
  if (![width, height, aspect, zoom, x, y].every(Number.isFinite) || width <= 0 || height <= 0 || aspect <= 0) throw new Error("Invalid image dimensions");
  const scale = Math.max(1, Math.min(3, zoom));
  const w = Math.min(width, height * aspect) / scale;
  const h = w / aspect;
  return { x: (width - w) * Math.max(0, Math.min(100, x)) / 100, y: (height - h) * Math.max(0, Math.min(100, y)) / 100, width: w, height: h };
}
