import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useDrawing } from '../../hooks/useDrawing';
import { useCanvasStore } from '../../store/canvasStore';
import { useShortcuts } from '../../hooks/useShortcuts';
import { TOOLS } from '../../utils/constants';
import { floodFill } from '../../utils/drawingUtils';
import { useHistoryStore } from '../../store/historyStore';

// ── Matte noise texture (SVG turbulence, rendered once as a data URL) ──
// Blackboard: subtle light grain over dark background
// Whiteboard: subtle warm grain over white/off-white background
const MATTE_NOISE_URL = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="256" height="256" filter="url(#n)" opacity="1"/>
</svg>
`)}`;

export default function BlackboardCanvas({ onSave, onExport, canvasRef, topBarHeight = 44, bottomBarHeight = 62 }) {
  const { activeTool, boardColor, zoom, boardMode, brushSize } = useCanvasStore();
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useDrawing(canvasRef);
  const [textInput, setTextInput] = useState(null);
  const textareaRef = useRef(null);

  useShortcuts(canvasRef, onSave, onExport);

  // Resize canvas to fill available space
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const imageData = (canvas.width > 0 && canvas.height > 0)
        ? ctx.getImageData(0, 0, canvas.width, canvas.height)
        : null;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight - topBarHeight - bottomBarHeight;
      if (imageData) ctx.putImageData(imageData, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [topBarHeight, bottomBarHeight]);

  // Tab away finalises stroke
  useEffect(() => {
    const handler = () => { if (document.hidden) handlePointerUp(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [handlePointerUp]);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (activeTool === TOOLS.FILL) {
      const rect  = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top)  * scaleY);
      const { color } = useCanvasStore.getState();
      const ctx  = canvas.getContext('2d');
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      useHistoryStore.getState().pushSnapshot(snap);
      floodFill(canvas, x, y, color);
    }

    if (activeTool === TOOLS.TEXT) {
      const rect = canvas.getBoundingClientRect();
      setTextInput({ x: e.clientX - rect.left, y: e.clientY - rect.top, value: '' });
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [activeTool]);

  const commitText = useCallback(() => {
    if (!textInput?.value.trim()) { setTextInput(null); return; }
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const { color, brushSize, opacity } = useCanvasStore.getState();
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const snap   = ctx.getImageData(0, 0, canvas.width, canvas.height);
    useHistoryStore.getState().pushSnapshot(snap);
    ctx.save();
    ctx.globalAlpha  = opacity;
    ctx.fillStyle    = color;
    ctx.font         = `${brushSize}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    textInput.value.split('\n').forEach((line, i) => {
      ctx.fillText(line, textInput.x * scaleX, (textInput.y * scaleY) + i * (brushSize + 4));
    });
    ctx.restore();
    setTextInput(null);
  }, [textInput]);

  const isWhiteboard = boardMode === 'whiteboard';

  // ── Custom cursors ─────────────────────────────────────────────
  const cursor = useMemo(() => {
    // ── Eraser: transparent circle sized to brush ──────────────
    if (activeTool === TOOLS.ERASER) {
      const size   = Math.max(8, Math.min(brushSize, 96));
      const r      = size / 2;
      const border = isWhiteboard ? 'rgba(60,60,60,0.75)' : 'rgba(210,210,210,0.8)';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <circle cx="${r}" cy="${r}" r="${r - 1.5}"
          fill="rgba(128,128,128,0.06)"
          stroke="${border}"
          stroke-width="1.5"
          stroke-dasharray="4 2"/>
      </svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${r} ${r}, cell`;
    }

    // ── Dot cursor for all freehand / shape drawing tools ──────
    if ([
      TOOLS.PEN, TOOLS.PENCIL, TOOLS.MARKER, TOOLS.CHALK,
      TOOLS.LINE, TOOLS.RECTANGLE, TOOLS.CIRCLE, TOOLS.LASER,
    ].includes(activeTool)) {
      const dotFill    = isWhiteboard ? 'rgba(20,20,20,0.85)'  : 'rgba(255,255,255,0.9)';
      const dotStroke  = isWhiteboard ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <circle cx="6" cy="6" r="2.5" fill="${dotFill}" stroke="${dotStroke}" stroke-width="1"/>
      </svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 6 6, crosshair`;
    }

    // ── Special tools ──────────────────────────────────────────
    if (activeTool === TOOLS.FILL) return 'copy';
    if (activeTool === TOOLS.TEXT) return 'text';
    return 'default';
  }, [activeTool, brushSize, isWhiteboard]);

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

      {/* ── Canvas ──────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        style={{
          background:      boardColor,
          cursor,
          touchAction:     'none',
          display:         'block',
          width:           '100%',
          height:          '100%',
          transform:       `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      />

      {/* ── Matte texture overlay (pointer-events: none) ──────── */}
      {/* Sits above canvas but never intercepts input */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          // SVG grain noise blended at low opacity
          backgroundImage: `url("${MATTE_NOISE_URL}")`,
          backgroundRepeat: 'repeat',
          backgroundSize:   '256px 256px',
          // Blackboard: light grain over dark; Whiteboard: dark grain over light
          opacity:    isWhiteboard ? 0.028 : 0.045,
          mixBlendMode: isWhiteboard ? 'multiply' : 'screen',
          zIndex:     1,
        }}
      />

      {/* ── Subtle vignette for depth ─────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          background:    isWhiteboard
            // Whiteboard: very gentle warm shadow at edges
            ? 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(180,160,140,0.07) 100%)'
            // Blackboard: deepen corners slightly
            : 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)',
          zIndex: 2,
        }}
      />

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
          onBlur={commitText}
          style={{
            position:   'absolute',
            left:       textInput.x,
            top:        textInput.y,
            zIndex:     10,
            background: 'rgba(0,0,0,0.01)',
            border:     '1px dashed rgba(99,102,241,0.6)',
            color:      useCanvasStore.getState().color,
            fontSize:   `${useCanvasStore.getState().brushSize}px`,
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
