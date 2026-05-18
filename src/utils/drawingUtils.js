export function getCanvasPoint(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

export function drawSmoothStroke(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

export function drawCubicStroke(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 0; i < points.length - 2; i++) {
      const cp1x = points[i].x + (points[i + 1].x - points[i].x) * 0.5;
      const cp1y = points[i].y + (points[i + 1].y - points[i].y) * 0.5;
      const cp2x = points[i + 1].x - (points[i + 2].x - points[i].x) * 0.15;
      const cp2y = points[i + 1].y - (points[i + 2].y - points[i].y) * 0.15;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

export function drawPencilStroke(ctx, points) {
  if (points.length < 2) return;

  const last = points[points.length - 1];

  // Main stroke
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  // Now draw all the way to the current pointer position
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  // Texture layer — thin parallel offset strokes
  if (points.length > 3) {
    ctx.save();
    ctx.globalAlpha *= 0.18;
    ctx.lineWidth *= 0.4;

    for (let offset of [-1.2, 1.2]) {
      ctx.beginPath();
      ctx.moveTo(points[0].x + offset, points[0].y + offset);
      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2 + offset;
        const midY = (points[i].y + points[i + 1].y) / 2 + offset;
        ctx.quadraticCurveTo(
          points[i].x + offset,
          points[i].y + offset,
          midX,
          midY
        );
      }
      // Also connect the texture layer to the last point
      ctx.lineTo(last.x + offset, last.y + offset);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function applyPressureCurve(raw, curve = 'medium') {
  const curves = {
    soft: (p) => Math.pow(p, 0.5),
    medium: (p) => p,
    firm: (p) => Math.pow(p, 2),
  };
  return Math.max(0.01, Math.min(1, (curves[curve] ?? curves.medium)(raw)));
}

export function invalidateRectCache() {
  // Provided for backward compatibility if called
}

const MIN_DISTANCE_SQ = 4; // 2px squared
export function shouldAddPoint(points, newPoint) {
  if (points.length === 0) return true;
  const last = points[points.length - 1];
  const dx = newPoint.x - last.x;
  const dy = newPoint.y - last.y;
  return (dx * dx + dy * dy) >= MIN_DISTANCE_SQ;
}

export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return '';

  const d = stroke.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length];
    return acc + `${x0},${y0} ${(x0 + x1) / 2},${(y0 + y1) / 2} `;
  }, `M ${stroke[0][0]},${stroke[0][1]} Q `);

  return d + 'Z';
}

export function drawShapePreview(ctx, tool, start, end, color, size, opacity, shiftKey) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = size;
  ctx.globalAlpha = opacity;
  ctx.lineCap     = 'round';

  const TOOLS = { LINE: 'line', RECTANGLE: 'rectangle', CIRCLE: 'circle' }; // fallback

  if (tool === 'line' || tool === TOOLS.LINE) {
    let ex = end.x, ey = end.y;
    if (shiftKey) {
      const dx    = end.x - start.x, dy = end.y - start.y;
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      const dist  = Math.hypot(dx, dy);
      ex = start.x + Math.cos(angle) * dist;
      ey = start.y + Math.sin(angle) * dist;
    }
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(ex, ey);
  } else if (tool === 'rectangle' || tool === TOOLS.RECTANGLE) {
    let w = end.x - start.x, h = end.y - start.y;
    if (shiftKey) {
      const s = Math.sign(w) * Math.min(Math.abs(w), Math.abs(h));
      w = s; h = Math.sign(h) * Math.abs(s);
    }
    ctx.rect(start.x, start.y, w, h);
  } else if (tool === 'circle' || tool === TOOLS.CIRCLE) {
    let rx = (end.x - start.x) / 2, ry = (end.y - start.y) / 2;
    if (shiftKey) {
      const r = Math.min(Math.abs(rx), Math.abs(ry));
      rx = Math.sign(rx) * r; ry = Math.sign(ry) * r;
    }
    ctx.ellipse(start.x + rx, start.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
  }
  ctx.stroke();
}