import { useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useHistoryStore } from '../store/historyStore';
import { getCanvasPoint } from '../utils/drawingUtils';
import { TOOLS, TOOL_DEFAULTS, PRESSURE_CURVES } from '../utils/constants';

// ─── Incremental bezier segment (O(1) per event) ──────────────
// Draws only the latest quadratic curve segment, not all points.
// Maintains smooth continuity by using midpoints as anchors.
function drawSegment(ctx, pts) {
  const n = pts.length;
  if (n < 2) return;
  ctx.beginPath();
  if (n === 2) {
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
  } else {
    const i = n - 2;
    // Start from midpoint between [i-1] and [i] for smooth join
    const fromX = (pts[i - 1].x + pts[i].x) / 2;
    const fromY = (pts[i - 1].y + pts[i].y) / 2;
    // End at midpoint between [i] and [i+1]
    const toX = (pts[i].x + pts[i + 1].x) / 2;
    const toY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, toX, toY);
  }
  ctx.stroke();
}

// Chalk: only draw the latest segment with random jitter (O(1))
function drawChalkSegment(ctx, pts, size) {
  const n = pts.length;
  if (n < 2) return;
  const strands = 3;
  for (let s = 0; s < strands; s++) {
    ctx.globalAlpha = ctx.globalAlpha * (0.5 + Math.random() * 0.5);
    ctx.lineWidth   = size * (0.15 + Math.random() * 0.3);
    const i = n - 2;
    const rx1 = (Math.random() - 0.5) * size * 0.25;
    const ry1 = (Math.random() - 0.5) * size * 0.25;
    const fromX = (pts[Math.max(0, i - 1)].x + pts[i].x) / 2 + rx1;
    const fromY = (pts[Math.max(0, i - 1)].y + pts[i].y) / 2 + ry1;
    const toX   = (pts[i].x + pts[n - 1].x) / 2;
    const toY   = (pts[i].y + pts[n - 1].y) / 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(pts[i].x + rx1, pts[i].y + ry1, toX, toY);
    ctx.stroke();
  }
}

export function useDrawing(canvasRef) {
  const isDrawing   = useRef(false);
  const points      = useRef([]);
  const startPoint  = useRef(null);
  const snapshotRef = useRef(null);
  const laserTimer  = useRef(null);
  const primaryId   = useRef(null);
  const ctxRef      = useRef(null);

  // rAF batching
  const rafId         = useRef(null);
  const pendingEvents = useRef([]);

  // ─── Pointer Down ─────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    if (primaryId.current !== null && e.pointerId !== primaryId.current) return;

    e.preventDefault();
    primaryId.current = e.pointerId;
    canvas.setPointerCapture(e.pointerId);

    // Stylus eraser end
    if (e.pointerType === 'pen' && e.buttons === 32) {
      useCanvasStore.getState().setActiveTool(TOOLS.ERASER);
    }

    // Cache ctx once per stroke
    ctxRef.current = canvas.getContext('2d');
    const ctx = ctxRef.current;

    isDrawing.current  = true;
    const pt = getCanvasPoint(canvas, e);
    points.current     = [{ ...pt, pressure: Math.max(0.1, e.pressure || 1) }];
    startPoint.current = pt;
    pendingEvents.current = [];

    // Snapshot BEFORE this stroke (for undo)
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Set persistent ctx state for this stroke
    const activeTool = useCanvasStore.getState().activeTool;
    ctx.save();
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
    ctx.globalCompositeOperation = TOOL_DEFAULTS[activeTool]?.composite ?? 'source-over';
  }, []);

  // ─── Flush pending events (called inside rAF) ─────────────────
  const flush = useCallback(() => {
    rafId.current = null;
    const events  = pendingEvents.current;
    pendingEvents.current = [];
    if (!isDrawing.current || events.length === 0) return;

    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (!canvas || !ctx) return;

    const tool   = useCanvasStore.getState().activeTool;
    const col    = useCanvasStore.getState().color;
    const size   = useCanvasStore.getState().brushSize;
    const alpha  = useCanvasStore.getState().opacity;
    const pOn    = useCanvasStore.getState().pressureEnabled;
    const pCurve = useCanvasStore.getState().pressureCurve;

    for (const ev of events) {
      const pt       = getCanvasPoint(canvas, ev);
      const rawPres  = ev.pointerType === 'pen' ? Math.max(0.1, ev.pressure || 0.5) : 1.0;
      const pressure = pOn ? (PRESSURE_CURVES[pCurve]?.(rawPres) ?? rawPres) : 1.0;
      points.current.push({ ...pt, pressure });

      const dynSize  = size * (pOn ? (0.2 + pressure * 0.8) : 1);
      const dynAlpha = alpha * (pOn && tool !== TOOLS.ERASER ? (0.5 + pressure * 0.5) : 1);

      if ([TOOLS.LINE, TOOLS.RECTANGLE, TOOLS.CIRCLE].includes(tool)) {
        // Shape preview: restore snapshot + redraw (unavoidable for live preview)
        ctx.putImageData(snapshotRef.current, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        drawShapePreview(ctx, tool, startPoint.current, pt, col, size, alpha, ev.shiftKey);
        ctx.restore();
      } else if (tool === TOOLS.CHALK) {
        ctx.strokeStyle = col;
        ctx.lineWidth   = dynSize;
        ctx.globalAlpha = dynAlpha;
        ctx.globalCompositeOperation = 'source-over';
        drawChalkSegment(ctx, points.current, dynSize);
      } else if (tool === TOOLS.LASER) {
        ctx.strokeStyle = '#ff2222';
        ctx.lineWidth   = size;
        ctx.globalAlpha = 0.88;
        ctx.shadowBlur  = 14;
        ctx.shadowColor = '#ff6666';
        ctx.globalCompositeOperation = 'source-over';
        drawSegment(ctx, points.current);
        ctx.shadowBlur  = 0;
      } else {
        // Pen / Pencil / Marker / Eraser — O(1) incremental segment
        ctx.strokeStyle = tool === TOOLS.ERASER ? 'rgba(0,0,0,1)' : col;
        ctx.lineWidth   = dynSize;
        ctx.globalAlpha = dynAlpha;
        ctx.globalCompositeOperation = TOOL_DEFAULTS[tool]?.composite ?? 'source-over';
        drawSegment(ctx, points.current);
      }
    }
  }, []);

  // ─── Pointer Move ─────────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current) return;
    if (e.pointerId !== primaryId.current) return;
    e.preventDefault();

    // Collect coalesced events into pending queue
    const coalesced = e.getCoalescedEvents?.() ?? [e];
    for (const ev of coalesced) pendingEvents.current.push(ev);

    // Schedule a single rAF flush (deduplicated)
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(flush);
    }
  }, [flush]);

  // ─── Pointer Up ──────────────────────────────────────────────
  const handlePointerUp = useCallback((e) => {
    if (!isDrawing.current) return;
    if (e && e.pointerId !== primaryId.current) return;

    // Cancel any pending rAF and flush immediately
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
      flush();
    }

    isDrawing.current = false;
    primaryId.current = null;
    points.current    = [];

    const ctx    = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.restore();

    // Push BEFORE-stroke snapshot to undo history
    useHistoryStore.getState().pushSnapshot(snapshotRef.current);

    // Laser fade-out
    const tool = useCanvasStore.getState().activeTool;
    if (tool === TOOLS.LASER) {
      clearTimeout(laserTimer.current);
      laserTimer.current = setTimeout(() => {
        const c2 = canvasRef.current;
        const cx = c2?.getContext('2d');
        if (cx && snapshotRef.current) cx.putImageData(snapshotRef.current, 0, 0);
      }, 1200);
    }
  }, [flush]);

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

// ─── Shape preview (full redraw — only for shape tools) ───────
function drawShapePreview(ctx, tool, start, end, color, size, opacity, shiftKey) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = size;
  ctx.globalAlpha = opacity;
  ctx.lineCap     = 'round';

  if (tool === TOOLS.LINE) {
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
  } else if (tool === TOOLS.RECTANGLE) {
    let w = end.x - start.x, h = end.y - start.y;
    if (shiftKey) {
      const s = Math.sign(w) * Math.min(Math.abs(w), Math.abs(h));
      w = s; h = Math.sign(h) * Math.abs(s);
    }
    ctx.rect(start.x, start.y, w, h);
  } else if (tool === TOOLS.CIRCLE) {
    let rx = (end.x - start.x) / 2, ry = (end.y - start.y) / 2;
    if (shiftKey) {
      const r = Math.min(Math.abs(rx), Math.abs(ry));
      rx = Math.sign(rx) * r; ry = Math.sign(ry) * r;
    }
    ctx.ellipse(start.x + rx, start.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
  }
  ctx.stroke();
}
