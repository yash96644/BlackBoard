import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useDrawing } from '../../hooks/useDrawing';
import { useCanvasStore } from '../../store/canvasStore';
import { useShortcuts } from '../../hooks/useShortcuts';
import { TOOLS } from '../../utils/constants';
import { useHistoryStore } from '../../store/historyStore';
import { useBoardStore } from '../../store/boardStore';
import { useShallow } from 'zustand/react/shallow';
import { useCanvas } from '../../hooks/useCanvas';
import { ensureCanvasSize } from '../../utils/canvasLifecycle';
import { captureCanvasTransform, pointFromEvent } from '../../utils/liveStroke';
import { redrawCanvas } from '../../utils/strokeCommit';

export default function BlackboardCanvas({ onSave, onExport, canvasRef }) {
  const committedRef = canvasRef || useRef(null);
  const activeRef = useRef(null);
  const containerRef = useRef(null);
  const eraserRef = useRef(null);

  const { activeTool, color, brushSize, boardColor, zoom, boardMode } = useCanvasStore(
    useShallow((s) => ({
      activeTool: s.activeTool,
      color:      s.color,
      brushSize:  s.brushSize,
      boardColor: s.boardColor,
      zoom:       s.zoom,
      boardMode:  s.boardMode,
    }))
  );

  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave } = useDrawing(committedRef, activeRef);
  const { zoomIn, zoomOut, resetZoom, panOffset, applyTransform } = useCanvas(
    committedRef,
    activeRef,
    containerRef
  );

  const [textInput, setTextInput] = useState(null);
  const textareaRef = useRef(null);

  useShortcuts(committedRef, activeRef, onSave, onExport);

  // Dynamic viewport observer for canvas dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;

      const committed = committedRef.current;
      const active = activeRef.current;
      if (committed && active) {
        const changedCommitted = ensureCanvasSize(committed, width, height);
        const changedActive = ensureCanvasSize(active, width, height);

        if (changedCommitted || changedActive) {
          applyTransform();
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [applyTransform]);

  // Tab away finalises stroke
  useEffect(() => {
    const handler = () => { if (document.hidden) handlePointerUp(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [handlePointerUp]);

  // Redraw when board mode or background color toggles
  useEffect(() => {
    const canvas = committedRef.current;
    if (!canvas) return;
    const activePage = useBoardStore.getState().activePage;
    const strokes = useBoardStore.getState().pages.find(p => p.id === activePage)?.data || [];
    redrawCanvas(canvas, strokes);
  }, [boardMode, boardColor]);

  const handleClick = useCallback((e) => {
    const canvas = activeRef.current;
    const committed = committedRef.current;
    if (!canvas || !committed) return;

    if (activeTool === TOOLS.TEXT) {
      const t = captureCanvasTransform(canvas);
      const [x, y] = pointFromEvent(t, e, 0.5);
      const container = canvas.parentElement;
      const containerRect = container?.getBoundingClientRect();
      setTextInput({
        x,
        y,
        screenX: containerRect ? e.clientX - containerRect.left : e.clientX - t.left,
        screenY: containerRect ? e.clientY - containerRect.top : e.clientY - t.top,
        value: '',
      });
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [activeTool]);

  const commitText = useCallback(() => {
    if (!textInput?.value.trim()) {
      setTextInput(null);
      return;
    }
    const canvas = committedRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const { opacity } = useCanvasStore.getState();
    const fontSize = brushSize * 4;
    const lineHeight = fontSize + 4;

    const dpr = window.devicePixelRatio || 1;
    const { zoom: activeZoom, panOffset: activePan } = useCanvasStore.getState();

    ctx.save();
    ctx.setTransform(activeZoom * dpr, 0, 0, activeZoom * dpr, activePan.x * dpr, activePan.y * dpr);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    textInput.value.split('\n').forEach((line, i) => {
      ctx.fillText(line, textInput.x, textInput.y + i * lineHeight);
    });
    ctx.restore();

    const newStroke = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      tool: TOOLS.TEXT,
      x: textInput.x,
      y: textInput.y,
      value: textInput.value,
      color,
      brushSize,
      opacity,
    };

    const activePage = useBoardStore.getState().activePage;
    const currentPageData = useBoardStore.getState().pages.find(p => p.id === activePage)?.data || [];
    const updatedStrokes = Array.isArray(currentPageData) ? [...currentPageData, newStroke] : [newStroke];

    // Save vector data to store
    useBoardStore.getState().savePageData(activePage, updatedStrokes);
    useHistoryStore.getState().pushSnapshot(updatedStrokes);

    setTextInput(null);
  }, [textInput, color, brushSize]);

  // ── Custom cursors ─────────────────────────────────────────────
  const cursor = useMemo(() => {
    if (activeTool === TOOLS.ERASER) return 'none'; // Will draw custom overlay circle
    if ([TOOLS.PEN, TOOLS.PENCIL, TOOLS.MARKER, TOOLS.LINE, TOOLS.RECTANGLE, TOOLS.CIRCLE, TOOLS.LASER].includes(activeTool)) {
      const dotColor = activeTool === TOOLS.LASER ? '#EF4444' : color;
      const strokeColor = boardColor !== '#1a1a2e' ? '#000000' : '#FFFFFF';
      const dotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2" fill="${encodeURIComponent(dotColor)}" stroke="${encodeURIComponent(strokeColor)}" stroke-width="1"/></svg>`;
      return `url('data:image/svg+xml;utf8,${dotSvg}') 5 5, crosshair`;
    }
    if (activeTool === TOOLS.TEXT) return 'text';
    return 'default';
  }, [activeTool, color, boardColor]);

  // ── Eraser Overlay (Bypasses React rendering) ──────────────────
  const isEraser = activeTool === TOOLS.ERASER;
  useEffect(() => {
    if (!isEraser) return;
    const handleMove = (e) => {
      const el = eraserRef.current;
      if (el) {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, [isEraser]);

  const containerStyle = useMemo(() => ({
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    backgroundColor: boardColor,
  }), [boardColor]);

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* ── COMMITTED Canvas ──────────────────────────────────────────── */}
      <canvas
        ref={committedRef}
        style={{
          touchAction:     'none',
          willChange:      'transform',
          display:         'block',
          width:           '100%',
          height:          '100%',
          transformOrigin: '0 0',
          pointerEvents:   'none',
          position:        'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* ── ACTIVE Canvas ──────────────────────────────────────────── */}
      <canvas
        ref={activeRef}
        style={{
          cursor,
          touchAction:     'none',
          willChange:      'transform',
          display:         'block',
          width:           '100%',
          height:          '100%',
          transformOrigin: '0 0',
          position:        'absolute',
          top: 0,
          left: 0,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />

      {/* ── Eraser Custom Cursor Overlay ─────────────────────── */}
      {isEraser && (
        <div
          ref={eraserRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: brushSize * zoom,
            height: brushSize * zoom,
            borderRadius: '50%',
            border: '1.5px dashed rgba(255,255,255,0.7)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            transform: 'translate3d(-9999px, -9999px, 0) translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}

      {/* ── Text input overlay ────────────────────────────────── */}
      {textInput && (
        <textarea
          ref={textareaRef}
          value={textInput.value}
          onChange={(e) => setTextInput(p => ({ ...p, value: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setTextInput(null);
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); }
          }}
          onBlur={() => setTimeout(() => commitText(), 0)}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position:   'absolute',
            left:       textInput.screenX,
            top:        textInput.screenY,
            zIndex:     10,
            backgroundColor: 'transparent',
            border:     '1px dashed rgba(99,102,241,0.6)',
            color:      color,
            fontSize:   `${brushSize * 4}px`,
            fontFamily: 'Inter, sans-serif',
            outline:    'none',
            resize:     'none',
            minWidth:   120,
            minHeight:  32,
            padding:    4,
            caretColor: 'auto',
          }}
          autoFocus
        />
      )}
    </div>
  );
}

