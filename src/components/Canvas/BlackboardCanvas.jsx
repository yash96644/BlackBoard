import { useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo } from 'react';
import { useDrawing } from '../../hooks/useDrawing';
import { useCanvasStore } from '../../store/canvasStore';
import { useShortcuts } from '../../hooks/useShortcuts';
import { TOOLS } from '../../utils/constants';
import { useHistoryStore } from '../../store/historyStore';
import { useShallow } from 'zustand/react/shallow';
import { useCanvas } from '../../hooks/useCanvas';
import { CANVAS_SIZE, ensureCanvasSize } from '../../utils/canvasLifecycle';
import { captureCanvasTransform, pointFromEvent } from '../../utils/liveStroke';

export default function BlackboardCanvas({ onSave, onExport, canvasRef }) {
  const committedRef = canvasRef || useRef(null);
  const activeRef = useRef(null);
  const containerRef = useRef(null);
  const { activeTool, color, brushSize, boardColor, zoom } = useCanvasStore(
    useShallow((s) => ({
      activeTool: s.activeTool,
      color:      s.color,
      brushSize:  s.brushSize,
      boardColor: s.boardColor,
      zoom:       s.zoom,
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

  // Initialise backing store once; never reset width/height on re-render
  useLayoutEffect(() => {
    const committed = committedRef.current;
    const active = activeRef.current;
    if (!committed || !active) return;

    ensureCanvasSize(committed, CANVAS_SIZE, CANVAS_SIZE);
    ensureCanvasSize(active, CANVAS_SIZE, CANVAS_SIZE);
    applyTransform();
  }, [applyTransform]);

  // Tab away finalises stroke
  useEffect(() => {
    const handler = () => { if (document.hidden) handlePointerUp(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [handlePointerUp]);

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

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    textInput.value.split('\n').forEach((line, i) => {
      ctx.fillText(line, textInput.x, textInput.y + i * lineHeight);
    });
    ctx.restore();
    setTextInput(null);

    useHistoryStore.getState().pushSnapshot(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
  }, [textInput, color, brushSize]);

  // ── Custom cursors ─────────────────────────────────────────────
  const cursor = useMemo(() => {
    if (activeTool === TOOLS.ERASER) return 'none'; // Will draw custom overlay circle
    if ([TOOLS.PEN, TOOLS.PENCIL, TOOLS.MARKER, TOOLS.LINE, TOOLS.RECTANGLE, TOOLS.CIRCLE, TOOLS.LASER].includes(activeTool)) {
      const dotColor = activeTool === TOOLS.LASER ? '#EF4444' : color;
      const strokeColor = boardColor === '#FFFFFF' ? '#000000' : '#FFFFFF';
      const dotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2" fill="${encodeURIComponent(dotColor)}" stroke="${encodeURIComponent(strokeColor)}" stroke-width="1"/></svg>`;
      return `url('data:image/svg+xml;utf8,${dotSvg}') 5 5, crosshair`;
    }
    if (activeTool === TOOLS.TEXT) return 'text';
    return 'default';
  }, [activeTool, color, boardColor]);

  // ── Eraser Overlay ─────────────────────────────────────────────
  const [eraserPos, setEraserPos] = useState({ x: -9999, y: -9999 });
  const isEraser = activeTool === TOOLS.ERASER;
  useEffect(() => {
    if (!isEraser) return;
    const handleMove = (e) => setEraserPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, [isEraser]);

  const containerStyle = useMemo(() => ({
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    backgroundColor: boardColor,
  }), [boardColor]);

  const showGrid = boardColor === '#FFFFFF';

  const canvasCssSize = `${CANVAS_SIZE}px`;

  return (
    <div ref={containerRef} style={containerStyle}>
      {showGrid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(#f3f4f6 1px, transparent 1px), linear-gradient(90deg, #f3f4f6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* ── COMMITTED Canvas ──────────────────────────────────────────── */}
      <canvas
        ref={committedRef}
        style={{
          touchAction:     'none',
          willChange:      'transform',
          display:         'block',
          width:           canvasCssSize,
          height:          canvasCssSize,
          transformOrigin: '0 0',
          pointerEvents:   'none',
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
          width:           canvasCssSize,
          height:          canvasCssSize,
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
          style={{
            position: 'fixed',
            left: eraserPos.x,
            top: eraserPos.y,
            width: brushSize * zoom,
            height: brushSize * zoom,
            borderRadius: '50%',
            border: '1.5px dashed rgba(255,255,255,0.7)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            transform: 'translate(-50%, -50%)',
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
