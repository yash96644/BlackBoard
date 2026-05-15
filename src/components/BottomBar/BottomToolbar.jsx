import { useRef, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useHistoryStore } from '../../store/historyStore';
import { useBoardStore } from '../../store/boardStore';
import { TOOLS, CHALK_COLORS, BRUSH_PRESETS } from '../../utils/constants';
import { exportAsPNG, exportAsJPEG, exportAsPDF } from '../../utils/exportUtils';
import { saveBoard } from '../../utils/storageUtils';
import {
  Pen, Pencil, Highlighter, Sparkles, Eraser,
  Minus, Square, Circle, Type, PaintBucket, Zap,
  Undo2, Redo2, Trash2, Plus, X,
  FileDown, Save, ChevronDown, ChevronUp,
} from 'lucide-react';

const TOOL_LIST = [
  { id: TOOLS.PEN,       icon: Pen,         label: 'Pen (P)'       },
  { id: TOOLS.PENCIL,    icon: Pencil,       label: 'Pencil'        },
  { id: TOOLS.MARKER,    icon: Highlighter,  label: 'Marker (B)'    },
  { id: TOOLS.CHALK,     icon: Sparkles,     label: 'Chalk'         },
  { id: TOOLS.ERASER,    icon: Eraser,       label: 'Eraser (E)'    },
  { id: TOOLS.LINE,      icon: Minus,        label: 'Line (L)'      },
  { id: TOOLS.RECTANGLE, icon: Square,       label: 'Rectangle (R)' },
  { id: TOOLS.CIRCLE,    icon: Circle,       label: 'Circle (C)'    },
  { id: TOOLS.TEXT,      icon: Type,         label: 'Text (T)'      },
  { id: TOOLS.FILL,      icon: PaintBucket,  label: 'Fill (F)'      },
  { id: TOOLS.LASER,     icon: Zap,          label: 'Laser'         },
];

export default function BottomToolbar({ canvasRef, showToast }) {
  const {
    activeTool, setActiveTool,
    color, setColor,
    brushSize, setBrushSize,
    opacity, setOpacity,
    pressureEnabled, setPressureEnabled,
    pressureCurve, setPressureCurve,
  } = useCanvasStore();

  const { undo, redo, clear } = useHistoryStore();
  const { pages, activePage, addPage, deletePage, savePageData, setActivePage } = useBoardStore();

  // Panels
  const [showColors, setShowColors]   = useState(false);
  const [showBrush, setShowBrush]     = useState(false);
  const [showExport, setShowExport]   = useState(false);
  const [colorHistory, setColorHistory] = useState([]);

  // Ref to hidden color input
  const colorInputRef = useRef(null);

  // ─── Color ───────────────────────────────────────────────────
  const applyColor = (c) => {
    setColor(c);
    setColorHistory((prev) => [c, ...prev.filter((x) => x !== c)].slice(0, 8));
    setShowColors(false);
  };

  const openNativePicker = () => {
    colorInputRef.current?.click();
  };

  // ─── Canvas helpers ──────────────────────────────────────────
  const ctx  = () => canvasRef.current?.getContext('2d');
  const cnvs = () => canvasRef.current;

  const handleUndo  = () => { const c = cnvs(); if (c) undo(ctx(), c); };
  const handleRedo  = () => { const c = cnvs(); if (c) redo(ctx(), c); };
  const handleClear = () => { const c = cnvs(); if (c) clear(ctx(), c); };

  // ─── Save ────────────────────────────────────────────────────
  const handleSave = () => {
    const canvas = cnvs();
    if (!canvas) return;
    savePageData(activePage, canvas.toDataURL());
    const result = saveBoard(useBoardStore.getState().pages);
    if (result === 'quota') showToast('⚠️ Storage full');
    else if (result) showToast('✅ Saved');
    else showToast('❌ Save failed');
  };

  // ─── Export ──────────────────────────────────────────────────
  const handleExport = (type) => {
    const canvas = cnvs();
    if (!canvas) return;
    setShowExport(false);
    if (type === 'png')  exportAsPNG(canvas);
    if (type === 'jpeg') exportAsJPEG(canvas);
    if (type === 'pdf')  exportAsPDF(canvas);
    showToast(`📥 Exported as ${type.toUpperCase()}`);
  };

  // ─── Pages ───────────────────────────────────────────────────
  const handleSwitchPage = (id) => {
    if (id === activePage) return;
    const canvas = cnvs();
    if (canvas) savePageData(activePage, canvas.toDataURL());
    setActivePage(id);
    const page = useBoardStore.getState().pages.find((p) => p.id === id);
    if (canvas) {
      const c = canvas.getContext('2d');
      c.clearRect(0, 0, canvas.width, canvas.height);
      if (page?.data) {
        const img = new Image();
        img.onload = () => c.drawImage(img, 0, 0);
        img.src = page.data;
      }
    }
    useHistoryStore.getState().reset();
  };

  const handleAddPage = () => {
    const canvas = cnvs();
    if (canvas) savePageData(activePage, canvas.toDataURL());
    addPage();
    setTimeout(() => {
      const c = cnvs();
      if (c) { c.getContext('2d').clearRect(0, 0, c.width, c.height); useHistoryStore.getState().reset(); }
    }, 10);
  };

  const handleDeletePage = (e, id) => {
    e.stopPropagation();
    if (pages.length === 1) return;
    if (id === activePage) {
      const other = pages.find((p) => p.id !== id);
      if (other) handleSwitchPage(other.id);
    }
    setTimeout(() => deletePage(id), id === activePage ? 60 : 0);
  };

  return (
    <>
      {/* ── Color palette popup (floats above toolbar) ─────────── */}
      {showColors && (
        <>
          <div
            onClick={() => setShowColors(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          />
          <div style={{
            position: 'fixed', bottom: 70, left: '50%',
            transform: 'translateX(-50%)',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: 14,
            padding: 14,
            zIndex: 200,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
            minWidth: 280,
          }}>
            {/* Chalk palette grid */}
            <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
              Chalk Colors
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 7, marginBottom: 12 }}>
              {CHALK_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => applyColor(c)}
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: c, cursor: 'pointer',
                    border: `2px solid ${color === c ? 'white' : 'transparent'}`,
                    boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                    transition: 'all 0.12s',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* Color history row */}
            {colorHistory.length > 0 && (
              <>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Recent
                </p>
                <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
                  {colorHistory.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => applyColor(c)}
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: c, cursor: 'pointer',
                        border: `2px solid ${color === c ? 'white' : '#374151'}`,
                        transition: 'all 0.12s',
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Custom color + current */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: color, flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: `0 0 10px ${color}66`,
                }}
              />
              <button
                onClick={openNativePicker}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #ff6b6b33, #6366f133, #66ffff33)',
                  border: '1px solid #374151', color: '#d1d5db', fontSize: 12,
                  transition: 'all 0.15s',
                }}
              >
                🎨 Custom color…
              </button>
              {/* Actual hidden input */}
              <input
                ref={colorInputRef}
                type="color"
                value={color}
                onChange={(e) => applyColor(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Brush / pressure popup ─────────────────────────────── */}
      {showBrush && (
        <>
          <div onClick={() => setShowBrush(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div style={{
            position: 'fixed', bottom: 70, left: '50%',
            transform: 'translateX(-50%)',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: 14,
            padding: 16,
            zIndex: 200,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
            minWidth: 280,
          }}>
            {/* Size presets */}
            <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Brush Size</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {BRUSH_PRESETS.map(({ label, size }) => (
                <button key={label} onClick={() => setBrushSize(size)} style={{
                  flex: 1, padding: '5px 0', fontSize: 11, borderRadius: 6,
                  background: brushSize === size ? 'rgba(99,102,241,0.3)' : 'rgba(55,65,81,0.5)',
                  border: `1px solid ${brushSize === size ? '#6366f1' : 'transparent'}`,
                  color: brushSize === size ? '#a5b4fc' : '#9ca3af', cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>

            {/* Size slider + dot preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <input
                type="range" min={1} max={80} value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{
                width: Math.max(6, Math.min(brushSize * 0.5, 28)),
                height: Math.max(6, Math.min(brushSize * 0.5, 28)),
                borderRadius: '50%', background: color,
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0, transition: 'all 0.15s',
              }} />
              <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 24 }}>{brushSize}px</span>
            </div>

            {/* Opacity */}
            <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Opacity</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <input
                type="range" min={0} max={100} value={Math.round(opacity * 100)}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 32 }}>{Math.round(opacity * 100)}%</span>
            </div>

            {/* Pressure */}
            <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Tablet Pressure</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setPressureEnabled(!pressureEnabled)} style={{
                padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
                background: pressureEnabled ? 'rgba(99,102,241,0.2)' : 'rgba(55,65,81,0.4)',
                border: `1px solid ${pressureEnabled ? '#6366f1' : '#374151'}`,
                color: pressureEnabled ? '#a5b4fc' : '#6b7280',
              }}>
                {pressureEnabled ? '🖊 ON' : '🖊 OFF'}
              </button>
              {pressureEnabled && (
                <select value={pressureCurve} onChange={(e) => setPressureCurve(e.target.value)} style={{
                  background: '#1f2937', border: '1px solid #374151',
                  color: '#d1d5db', borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer',
                }}>
                  <option value="soft">Soft</option>
                  <option value="medium">Medium</option>
                  <option value="firm">Firm</option>
                </select>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Export popup ───────────────────────────────────────── */}
      {showExport && (
        <>
          <div onClick={() => setShowExport(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div style={{
            position: 'fixed', bottom: 70, right: 12,
            background: '#111827', border: '1px solid #374151',
            borderRadius: 10, padding: 4, zIndex: 200,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.6)', minWidth: 160,
          }}>
            {[
              { type: 'png',  label: '🖼 Export PNG'  },
              { type: 'jpeg', label: '📷 Export JPEG' },
              { type: 'pdf',  label: '📄 Export PDF'  },
            ].map(({ type, label }) => (
              <div key={type} className="dropdown-item" onClick={() => handleExport(type)}>
                {label}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          MAIN BOTTOM TOOLBAR
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        height: 62,
        background: 'rgba(13, 17, 28, 0.98)',
        borderTop: '1px solid #1f2937',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 6,
        flexShrink: 0,
        zIndex: 50,
        userSelect: 'none',
        backdropFilter: 'blur(12px)',
      }}>

        {/* ── Undo / Redo / Clear ─────────────────────────── */}
        <div style={groupStyle}>
          <ToolBtn id="btn-undo"  tip="Undo (Ctrl+Z)"          onClick={handleUndo}  ><Undo2  size={15} /></ToolBtn>
          <ToolBtn id="btn-redo"  tip="Redo (Ctrl+Shift+Z)"    onClick={handleRedo}  ><Redo2  size={15} /></ToolBtn>
          <ToolBtn id="btn-clear" tip="Clear board"             onClick={handleClear} style={{ color: '#f87171' }}><Trash2 size={15} /></ToolBtn>
        </div>

        <Sep />

        {/* ── Drawing tools ───────────────────────────────── */}
        <div style={groupStyle}>
          {TOOL_LIST.map(({ id, icon: Icon, label }) => (
            <ToolBtn
              key={id}
              id={`tool-${id}`}
              tip={label}
              onClick={() => setActiveTool(id)}
              active={activeTool === id}
            >
              <Icon size={15} />
            </ToolBtn>
          ))}
        </div>

        <Sep />

        {/* ── Color swatch → opens palette ────────────────── */}
        <button
          id="color-btn"
          onClick={() => { setShowColors((v) => !v); setShowBrush(false); }}
          title="Colors"
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: color, cursor: 'pointer', flexShrink: 0,
            border: `3px solid ${showColors ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
            boxShadow: `0 0 10px ${color}66, ${showColors ? '0 0 0 2px #6366f1' : 'none'}`,
            transition: 'all 0.2s',
          }}
        />

        <Sep />

        {/* ── Brush size quick display + popup ────────────── */}
        <button
          id="brush-btn"
          onClick={() => { setShowBrush((v) => !v); setShowColors(false); }}
          title="Brush & Opacity"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
            background: showBrush ? 'rgba(99,102,241,0.2)' : 'rgba(55,65,81,0.4)',
            border: `1px solid ${showBrush ? '#6366f1' : '#374151'}`,
            color: showBrush ? '#a5b4fc' : '#9ca3af',
            fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          <div style={{
            width: Math.max(5, Math.min(brushSize * 0.35, 18)),
            height: Math.max(5, Math.min(brushSize * 0.35, 18)),
            borderRadius: '50%', background: 'currentColor',
            flexShrink: 0, transition: 'all 0.15s',
          }} />
          <span>{brushSize}px · {Math.round(opacity * 100)}%</span>
          {showBrush ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </button>

        {/* ── Spacer ──────────────────────────────────────── */}
        <div style={{ flex: 1 }} />

        {/* ── Pages ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', maxWidth: 280, flexShrink: 0 }}>
          {pages.map((page) => (
            <div
              key={page.id}
              className={`page-thumb ${page.id === activePage ? 'active' : ''}`}
              onClick={() => handleSwitchPage(page.id)}
            >
              <span style={{ fontSize: 10 }}>📄</span>
              <span style={{ fontSize: 11 }}>{page.name}</span>
              {pages.length > 1 && (
                <button
                  onClick={(e) => handleDeletePage(e, page.id)}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 1, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                >
                  <X size={9} />
                </button>
              )}
            </div>
          ))}
          <button
            id="btn-add-page"
            onClick={handleAddPage}
            title="New board"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 5, cursor: 'pointer',
              background: 'rgba(55,65,81,0.5)', border: '1px dashed #4b5563',
              color: '#6b7280', flexShrink: 0,
            }}
          >
            <Plus size={12} />
          </button>
        </div>

        <Sep />

        {/* ── Save ────────────────────────────────────────── */}
        <button
          id="btn-save"
          onClick={handleSave}
          title="Save (Ctrl+S)"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
            color: '#a5b4fc', fontSize: 12, flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          <Save size={13} />
          Save
        </button>

        {/* ── Export ──────────────────────────────────────── */}
        <button
          id="btn-export"
          onClick={() => { setShowExport((v) => !v); }}
          title="Export"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)',
            color: '#6ee7b7', fontSize: 12, flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          <FileDown size={13} />
          Export
          <ChevronDown size={11} style={{ transform: showExport ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
        </button>
      </div>
    </>
  );
}

/* ── Reusable sub-components ─────────────────────────────────── */

function Sep() {
  return <div style={{ width: 1, height: 28, background: '#1f2937', flexShrink: 0, margin: '0 2px' }} />;
}

function ToolBtn({ id, tip, onClick, active, children, style = {} }) {
  return (
    <button
      id={id}
      onClick={onClick}
      title={tip}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 7, cursor: 'pointer',
        flexShrink: 0, transition: 'all 0.13s',
        background:   active ? 'rgba(99,102,241,0.25)' : 'transparent',
        color:        active ? '#818cf8'               : '#6b7280',
        border:       active ? '1px solid #6366f1'    : '1px solid transparent',
        boxShadow:    active ? '0 0 10px rgba(99,102,241,0.35)' : 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!active) { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#d1d5db'; }
      }}
      onMouseLeave={(e) => {
        if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }
      }}
    >
      {children}
    </button>
  );
}

const groupStyle = {
  display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
};
