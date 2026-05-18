import { useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useHistoryStore } from '../store/historyStore';
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
      color: s.color,
      brushSize: s.brushSize,
      opacity: s.opacity,
      pressureEnabled: s.pressureEnabled,
    };
  };

  const clearActiveLayer = () => {
    const active = activeRef.current;
    const ctx = getActiveCtx();
    if (!active || !ctx) return;
    ctx.clearRect(0, 0, active.width, active.height);
  };

  const scheduleHistorySnapshot = (committedCtx, committed) => {
    const capture = () => {
      try {
        pushSnapshot(
          committedCtx.getImageData(0, 0, committed.width, committed.height)
        );
      } catch {
        /* ignore */
      }
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(capture, { timeout: 120 });
    } else {
      setTimeout(capture, 0);
    }
  };

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

    if (FREEHAND_TOOLS.includes(tool)) {
      const { color, brushSize, opacity } = styleRef.current;
      drawLiveDot(activeCtx, pt, tool, color, brushSize, opacity);
    }
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
  }, [activeRef, committedRef]);

  const commitStroke = useCallback(() => {
    const committed = committedRef.current;
    const active = activeRef.current;
    const committedCtx = getCommittedCtx();
    const activeCtx = getActiveCtx();
    if (!committed || !active || !committedCtx || !activeCtx) return;

    const tool = toolRef.current;
    const { color, brushSize, opacity, pressureEnabled } = styleRef.current;

    if (tool === TOOLS.ERASER) {
      // Tap-only erase (no move events)
      if (points.current.length === 1) {
        eraseDotOnCommitted(committedCtx, points.current[0], brushSize);
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
    } else {
      clearActiveLayer();
    }

    scheduleHistorySnapshot(committedCtx, committed);

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
