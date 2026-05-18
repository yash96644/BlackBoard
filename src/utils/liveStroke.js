import { TOOLS } from './constants';

/** Squared distance threshold (2px) — matches drawingUtils.shouldAddPoint */
export const MIN_POINT_DIST_SQ = 4;

export function shouldAddPoint(last, x, y) {
  if (!last) return true;
  const dx = x - last[0];
  const dy = y - last[1];
  return dx * dx + dy * dy >= MIN_POINT_DIST_SQ;
}

/**
 * Cache canvas → screen mapping once per stroke (avoids layout thrash).
 */
export function captureCanvasTransform(canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    scaleX: canvas.width / rect.width,
    scaleY: canvas.height / rect.height,
    left: rect.left,
    top: rect.top,
  };
}

export function pointFromEvent(t, e, pressure = 0.5) {
  return [
    (e.clientX - t.left) * t.scaleX,
    (e.clientY - t.top) * t.scaleY,
    pressure,
  ];
}

/**
 * O(1) segment draw — only the newest piece of the stroke (live layer).
 */
export function drawLiveSegment(ctx, from, to, tool, color, brushSize, opacity) {
  if (!from || !to) return;

  const p0 = from[2] ?? 0.5;
  const p1 = to[2] ?? 0.5;
  const width0 = brushSize * (tool === TOOLS.PENCIL ? 0.85 : 1) * (0.35 + p0 * 0.65);
  const width1 = brushSize * (tool === TOOLS.PENCIL ? 0.85 : 1) * (0.35 + p1 * 0.65);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = tool === TOOLS.MARKER ? opacity * 0.5 : opacity;

  if (tool === TOOLS.LASER) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }

  ctx.lineWidth = (width0 + width1) / 2;
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();

  if (tool === TOOLS.LASER) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }
  ctx.restore();
}

/** Single-point tap preview on the live layer */
export function drawLiveDot(ctx, point, tool, color, brushSize, opacity) {
  const p = point[2] ?? 0.5;
  const r = Math.max(
    (brushSize * (tool === TOOLS.PENCIL ? 0.85 : 1) * (0.35 + p * 0.65)) / 2,
    1
  );

  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = tool === TOOLS.MARKER ? opacity * 0.5 : opacity;
  if (tool === TOOLS.LASER) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }
  ctx.beginPath();
  ctx.arc(point[0], point[1], r, 0, Math.PI * 2);
  ctx.fill();
  if (tool === TOOLS.LASER) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }
  ctx.restore();
}

/**
 * True erase on the committed layer — removes pixels (transparent), never paints black.
 */
export function eraseOnCommitted(ctx, from, to, brushSize) {
  if (!ctx || !from || !to) return;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.restore();
}

/** Single-point erase (tap) */
export function eraseDotOnCommitted(ctx, point, brushSize) {
  if (!ctx || !point) return;
  const r = Math.max(brushSize / 2, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.beginPath();
  ctx.arc(point[0], point[1], r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
