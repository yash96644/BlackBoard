import getStroke from 'perfect-freehand';
import { getSvgPathFromStroke } from './drawingUtils';
import { TOOLS } from './constants';

export function getFreehandOptions(tool, size, isLast = false) {
  const map = {
    [TOOLS.PEN]: {
      size,
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
      last: isLast,
    },
    [TOOLS.PENCIL]: {
      size: size * 0.8,
      thinning: 0.3,
      smoothing: 0.4,
      streamline: 0.3,
      simulatePressure: true,
      last: isLast,
    },
    [TOOLS.MARKER]: {
      size,
      thinning: 0.0,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: false,
      last: isLast,
    },
    [TOOLS.LASER]: {
      size,
      thinning: 0.4,
      smoothing: 0.6,
      streamline: 0.4,
      simulatePressure: false,
      last: isLast,
    },
  };
  return (
    map[tool] ?? {
      size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
      last: isLast,
    }
  );
}

/**
 * Draw a freehand stroke (or single-point dot) onto a 2D context.
 */
export function drawFreehandStroke(ctx, tool, points, color, brushSize, opacity, pressureEnabled, isLast = true) {
  if (!points.length) return false;

  const processed = pressureEnabled
    ? points
    : points.map(([x, y, p]) => [x, y, p ?? 0.5]);

  const options = getFreehandOptions(tool, brushSize, isLast);
  const stroke = getStroke(processed, options);

  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = tool === TOOLS.MARKER ? opacity * 0.5 : opacity;

  if (tool === TOOLS.LASER) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
  }

  if (stroke.length > 0) {
    ctx.fill(new Path2D(getSvgPathFromStroke(stroke)));
  } else if (processed.length >= 1) {
    const [x, y] = processed[0];
    const r = Math.max(brushSize / 2, 1);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.restore();
    return false;
  }

  if (tool === TOOLS.LASER) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }
  ctx.restore();
  return true;
}

/** Graphite texture — only on pointer-up (not during live draw) */
export function drawPencilTexture(ctx, points, color, brushSize, opacity) {
  if (points.length < 3) return;

  const asPoints = points.map(([x, y]) => ({ x, y }));
  const last = asPoints[asPoints.length - 1];

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize * 0.35;
  ctx.globalAlpha = opacity * 0.18;
  ctx.lineCap = 'round';

  for (const offset of [-1.2, 1.2]) {
    ctx.beginPath();
    ctx.moveTo(asPoints[0].x + offset, asPoints[0].y + offset);
    for (let i = 1; i < asPoints.length - 1; i++) {
      const midX = (asPoints[i].x + asPoints[i + 1].x) / 2 + offset;
      const midY = (asPoints[i].y + asPoints[i + 1].y) / 2 + offset;
      ctx.quadraticCurveTo(
        asPoints[i].x + offset,
        asPoints[i].y + offset,
        midX,
        midY
      );
    }
    ctx.lineTo(last.x + offset, last.y + offset);
    ctx.stroke();
  }
  ctx.restore();
}
