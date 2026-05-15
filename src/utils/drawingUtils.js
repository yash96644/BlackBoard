export function getCanvasPoint(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
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

export function drawChalkStroke(ctx, points, size, color, opacity) {
  if (points.length < 2) return;
  // Chalk: multiple thin strands with random offsets and varying alpha
  const strands = 4;
  for (let s = 0; s < strands; s++) {
    ctx.beginPath();
    const offsetX = (Math.random() - 0.5) * size * 0.3;
    const offsetY = (Math.random() - 0.5) * size * 0.3;
    ctx.globalAlpha = opacity * (0.4 + Math.random() * 0.5);
    ctx.lineWidth   = size * (0.15 + Math.random() * 0.25);
    ctx.moveTo(points[0].x + offsetX, points[0].y + offsetY);

    for (let i = 1; i < points.length - 1; i++) {
      const rx  = (Math.random() - 0.5) * 1.5;
      const ry  = (Math.random() - 0.5) * 1.5;
      const midX = (points[i].x + points[i + 1].x) / 2 + rx;
      const midY = (points[i].y + points[i + 1].y) / 2 + ry;
      ctx.quadraticCurveTo(points[i].x + rx, points[i].y + ry, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x + offsetX, last.y + offsetY);
    ctx.stroke();
  }
}

export function applyPressureCurve(raw, curve = 'medium') {
  const curves = {
    soft:   (p) => Math.pow(p, 0.5),
    medium: (p) => p,
    firm:   (p) => Math.pow(p, 2),
  };
  return Math.max(0.01, Math.min(1, (curves[curve] ?? curves.medium)(raw)));
}

// Iterative flood fill — avoids stack overflow on large areas
export function floodFill(canvas, startX, startY, fillColor) {
  const ctx  = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w    = canvas.width;
  const h    = canvas.height;

  const idx    = (x, y) => (y * w + x) * 4;
  const si     = idx(startX, startY);
  const target = [data[si], data[si+1], data[si+2], data[si+3]];

  const fill = hexToRgba(fillColor);
  if (colorsMatch(target, fill)) return;

  const stack = [[startX, startY]];
  let iterations = 0;
  const MAX = w * h;

  while (stack.length && iterations < MAX) {
    iterations++;
    const [x, y] = stack.pop();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const i = idx(x, y);
    const px = [data[i], data[i+1], data[i+2], data[i+3]];
    if (!colorsMatch(px, target)) continue;
    data[i]   = fill[0];
    data[i+1] = fill[1];
    data[i+2] = fill[2];
    data[i+3] = fill[3];
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imgData, 0, 0);
}

function colorsMatch(a, b, tolerance = 30) {
  return Math.abs(a[0]-b[0]) < tolerance &&
         Math.abs(a[1]-b[1]) < tolerance &&
         Math.abs(a[2]-b[2]) < tolerance &&
         Math.abs(a[3]-b[3]) < tolerance;
}

function hexToRgba(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return [r, g, b, 255];
}
