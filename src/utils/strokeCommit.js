import getStroke from 'perfect-freehand';
import { getSvgPathFromStroke, drawShapePreview } from './drawingUtils';
import { TOOLS } from './constants';
import { useCanvasStore } from '../store/canvasStore';


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
  ctx.fillStyle = tool === TOOLS.LASER ? '#EF4444' : color;
  ctx.globalAlpha = tool === TOOLS.MARKER ? opacity * 0.5 : opacity;

  if (tool === TOOLS.LASER) {
    ctx.shadowColor = '#EF4444';
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

export function redrawCanvas(canvas, strokes) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  // Clear the full canvas backing store in screen pixels
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { zoom, panOffset, boardMode } = useCanvasStore.getState();

  // Draw background grid if whiteboard
  if (boardMode === 'whiteboard' && panOffset) {
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;
    const left = -panOffset.x / zoom;
    const top = -panOffset.y / zoom;
    const right = left + viewW / zoom;
    const bottom = top + viewH / zoom;
    const gridSpacing = 40;
    const startX = Math.floor(left / gridSpacing) * gridSpacing;
    const endX = Math.ceil(right / gridSpacing) * gridSpacing;
    const startY = Math.floor(top / gridSpacing) * gridSpacing;
    const endY = Math.ceil(bottom / gridSpacing) * gridSpacing;

    ctx.save();
    ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, panOffset.x * dpr, panOffset.y * dpr);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let x = startX; x <= endX; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (!strokes || !Array.isArray(strokes)) return;

  ctx.save();
  if (panOffset) {
    ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, panOffset.x * dpr, panOffset.y * dpr);
  }

  for (const stroke of strokes) {
    if (stroke.tool === TOOLS.ERASER) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.points && stroke.points.length === 1) {
        const r = Math.max(stroke.brushSize / 2, 1);
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        ctx.arc(stroke.points[0][0], stroke.points[0][1], r, 0, Math.PI * 2);
        ctx.fill();
      } else if (stroke.points && stroke.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if ([TOOLS.PEN, TOOLS.PENCIL, TOOLS.MARKER].includes(stroke.tool)) {
      drawFreehandStroke(
        ctx,
        stroke.tool,
        stroke.points,
        stroke.color,
        stroke.brushSize,
        stroke.opacity,
        stroke.pressureEnabled,
        true
      );
    } else if ([TOOLS.LINE, TOOLS.RECTANGLE, TOOLS.CIRCLE].includes(stroke.tool)) {
      drawShapePreview(
        ctx,
        stroke.tool,
        stroke.startPoint,
        stroke.endPoint,
        stroke.color,
        stroke.brushSize,
        stroke.opacity,
        stroke.shiftKey
      );
    } else if (stroke.tool === TOOLS.TEXT) {
      const fontSize = stroke.brushSize * 4;
      const lineHeight = fontSize + 4;
      ctx.save();
      ctx.globalAlpha = stroke.opacity;
      ctx.fillStyle = stroke.color;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textBaseline = 'top';
      stroke.value.split('\n').forEach((line, i) => {
        ctx.fillText(line, stroke.x, stroke.y + i * lineHeight);
      });
      ctx.restore();
    }
  }

  ctx.restore();
}

