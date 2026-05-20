import { useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useHistoryStore } from '../store/historyStore';
import { useBoardStore } from '../store/boardStore';
import { drawShapePreview } from '../utils/drawingUtils';
import { drawFreehandStroke } from '../utils/strokeCommit';
import { TOOLS } from '../utils/constants';
import {
  shouldAddPoint,
  captureCanvasTransform,
  pointFromEvent,
  drawLiveSegment,
  drawLiveDot,
  eraseOnCommitted,
  eraseDotOnCommitted,
} from '../utils/liveStroke';

const FREEHAND_TOOLS = [TOOLS.PEN, TOOLS.PENCIL, TOOLS.MARKER, TOOLS.LASER];
const SHAPE_TOOLS = [TOOLS.LINE, TOOLS.RECTANGLE, TOOLS.CIRCLE];

export function useDrawing(committedRef, activeRef) {
  const isDrawing = useRef(false);
  const points = useRef([]);
  const startPoint = useRef(null);
  const transform = useRef(null);
  const lastLivePoint = useRef(null);
  const toolRef = useRef(TOOLS.PEN);
  const styleRef = useRef({ color: '#fff', brushSize: 4, opacity: 1, pressureEnabled: true });

  const { pushSnapshot } = useHistoryStore();

  const getCommittedCtx = () => committedRef.current?.getContext('2d');
  const getActiveCtx = () => activeRef.current?.getContext('2d');

  const syncStyleFromStore = () => {
    const s = useCanvasStore.getState();
    toolRef.current = s.activeTool;
    styleRef.current = {
      color: s.activeTool === TOOLS.LASER ? '#EF4444' : s.color,
      brushSize: s.brushSize,
      opacity: s.opacity,
      pressureEnabled: s.pressureEnabled,
    };
  };

  const clearActiveLayer = () => {
    const active = activeRef.current;
    const ctx = getActiveCtx();
    if (!active || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, active.width, active.height);
    ctx.restore();
  };

  // Vector-based snapshot scheduling runs instantly and synchronously.

  const handlePointerDown = useCallback((e) => {
    const canvas = activeRef.current;
    const committed = committedRef.current;
    if (!canvas || !committed) return;

    canvas.setPointerCapture(e.pointerId);

    if (e.pointerType === 'pen' && e.buttons === 32) {
      useCanvasStore.getState().setActiveTool(TOOLS.ERASER);
    }

    syncStyleFromStore();
    const tool = toolRef.current;

    isDrawing.current = true;
    transform.current = captureCanvasTransform(canvas);

    const pressure =
      e.pointerType === 'pen' ? Math.max(0.01, e.pressure || 0.5) : 0.5;
    const pt = pointFromEvent(transform.current, e, pressure);
    points.current = [pt];
    startPoint.current = { x: pt[0], y: pt[1] };
    lastLivePoint.current = pt;

    clearActiveLayer();

    const activeCtx = getActiveCtx();
    if (!activeCtx) return;

    const dpr = window.devicePixelRatio || 1;
    const { zoom, panOffset } = useCanvasStore.getState();
    activeCtx.save();
    activeCtx.setTransform(zoom * dpr, 0, 0, zoom * dpr, panOffset.x * dpr, panOffset.y * dpr);

    if (FREEHAND_TOOLS.includes(tool)) {
      const { color, brushSize, opacity } = styleRef.current;
      drawLiveDot(activeCtx, pt, tool, color, brushSize, opacity);
    }
    activeCtx.restore();
  }, [committedRef, activeRef]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current) return;
    e.preventDefault();

    const canvas = activeRef.current;
    const activeCtx = getActiveCtx();
    const committedCtx = getCommittedCtx();
    if (!canvas || !activeCtx || !transform.current) return;

    const tool = toolRef.current;
    const { color, brushSize, opacity } = styleRef.current;

    const dpr = window.devicePixelRatio || 1;
    const { zoom, panOffset } = useCanvasStore.getState();
    activeCtx.save();
    activeCtx.setTransform(zoom * dpr, 0, 0, zoom * dpr, panOffset.x * dpr, panOffset.y * dpr);
    if (committedCtx) {
      committedCtx.save();
      committedCtx.setTransform(zoom * dpr, 0, 0, zoom * dpr, panOffset.x * dpr, panOffset.y * dpr);
    }

    const coalesced = e.getCoalescedEvents?.() ?? [e];

    for (const ev of coalesced) {
      const pressure =
        ev.pointerType === 'pen' ? Math.max(0.01, ev.pressure || 0.5) : 0.5;
      const pt = pointFromEvent(transform.current, ev, pressure);

      if (!shouldAddPoint(points.current[points.current.length - 1], pt[0], pt[1])) {
        continue;
      }

      points.current.push(pt);

      if (SHAPE_TOOLS.includes(tool)) {
        clearActiveLayer();
        const last = points.current[points.current.length - 1];
        drawShapePreview(
          activeCtx,
          tool,
          startPoint.current,
          { x: last[0], y: last[1] },
          color,
          brushSize,
          opacity
        );
        continue;
      }

      if (tool === TOOLS.ERASER) {
        const prev = lastLivePoint.current;
        if (prev && committedCtx) {
          eraseOnCommitted(committedCtx, prev, pt, brushSize);
        }
        lastLivePoint.current = pt;
        continue;
      }

      if (FREEHAND_TOOLS.includes(tool)) {
        const prev = lastLivePoint.current;
        if (prev) {
          drawLiveSegment(activeCtx, prev, pt, tool, color, brushSize, opacity);
        }
        lastLivePoint.current = pt;
      }
    }

    activeCtx.restore();
    if (committedCtx) {
      committedCtx.restore();
    }
  }, [activeRef, committedRef]);

  const commitStroke = useCallback(() => {
    const committed = committedRef.current;
    const active = activeRef.current;
    const committedCtx = getCommittedCtx();
    const activeCtx = getActiveCtx();
    if (!committed || !active || !committedCtx || !activeCtx) return;

    const tool = toolRef.current;
    const { color, brushSize, opacity, pressureEnabled } = styleRef.current;

    const dpr = window.devicePixelRatio || 1;
    const { zoom, panOffset } = useCanvasStore.getState();
    committedCtx.save();
    committedCtx.setTransform(zoom * dpr, 0, 0, zoom * dpr, panOffset.x * dpr, panOffset.y * dpr);

    let newStroke = null;

    if (tool === TOOLS.ERASER) {
      // Tap-only erase (no move events)
      if (points.current.length === 1) {
        eraseDotOnCommitted(committedCtx, points.current[0], brushSize);
      }
      if (points.current.length > 0) {
        newStroke = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          tool,
          points: [...points.current],
          color: 'rgba(0,0,0,1)',
          brushSize,
          opacity: 1.0,
          pressureEnabled: false,
        };
      }
    } else if (FREEHAND_TOOLS.includes(tool) && points.current.length > 0) {
      clearActiveLayer();
      drawFreehandStroke(
        committedCtx,
        tool,
        points.current,
        color,
        brushSize,
        opacity,
        pressureEnabled,
        true
      );
      newStroke = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        tool,
        points: [...points.current],
        color,
        brushSize,
        opacity,
        pressureEnabled,
      };
    } else if (SHAPE_TOOLS.includes(tool) && points.current.length >= 1) {
      clearActiveLayer();
      const last = points.current[points.current.length - 1];
      drawShapePreview(
        committedCtx,
        tool,
        startPoint.current,
        { x: last[0], y: last[1] },
        color,
        brushSize,
        opacity
      );
      newStroke = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        tool,
        startPoint: { ...startPoint.current },
        endPoint: { x: last[0], y: last[1] },
        color,
        brushSize,
        opacity,
      };
    } else {
      clearActiveLayer();
    }

    committedCtx.restore();

    if (newStroke) {
      const activePage = useBoardStore.getState().activePage;
      const currentPageData = useBoardStore.getState().pages.find(p => p.id === activePage)?.data || [];
      const updatedStrokes = Array.isArray(currentPageData) ? [...currentPageData, newStroke] : [newStroke];

      // Save vector data to store
      useBoardStore.getState().savePageData(activePage, updatedStrokes);
      pushSnapshot(updatedStrokes);
    }

    points.current = [];
    lastLivePoint.current = null;
    transform.current = null;
  }, [committedRef, activeRef, pushSnapshot]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    commitStroke();
  }, [commitStroke]);

  const handlePointerLeave = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    commitStroke();
  }, [commitStroke]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
  };
}
