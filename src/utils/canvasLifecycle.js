/** Fixed internal resolution for the drawing surface */
export const CANVAS_SIZE = 5000;

/**
 * Resize canvas backing store only when needed; preserve pixel data.
 * Setting width/height clears the buffer — always snapshot first.
 */
export function ensureCanvasSize(canvas, targetW, targetH) {
  if (!canvas) return false;
  if (canvas.width === targetW && canvas.height === targetH) return false;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  const saved =
    canvas.width > 0 && canvas.height > 0
      ? ctx.getImageData(0, 0, canvas.width, canvas.height)
      : null;

  canvas.width = targetW;
  canvas.height = targetH;

  if (saved) {
    const dx = Math.floor((targetW - saved.width) / 2);
    const dy = Math.floor((targetH - saved.height) / 2);
    ctx.putImageData(saved, dx, dy);
  }

  return true;
}

/** Default pan offset to center the 5000×5000 board in the viewport */
export function getDefaultPanOffset(viewportW, viewportH) {
  return {
    x: -(CANVAS_SIZE - viewportW) / 2,
    y: -(CANVAS_SIZE - viewportH) / 2,
  };
}

export function buildCanvasTransform(panX, panY, zoom) {
  return {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: '0 0',
  };
}
