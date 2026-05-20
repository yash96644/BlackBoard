/** Fixed internal resolution for the drawing surface coordinate system */
export const CANVAS_SIZE = 5000;

/**
 * Resize canvas backing store only when needed; preserve pixel data.
 */
export function ensureCanvasSize(canvas, targetW, targetH) {
  if (!canvas) return false;
  const dpr = window.devicePixelRatio || 1;
  const backingW = Math.round(targetW * dpr);
  const backingH = Math.round(targetH * dpr);

  if (canvas.width === backingW && canvas.height === backingH) return false;

  canvas.width = backingW;
  canvas.height = backingH;

  return true;
}

/** Default pan offset to center the 5000×5000 coordinate space in the viewport */
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

