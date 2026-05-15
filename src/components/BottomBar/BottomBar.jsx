import { useState, useRef } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useHistoryStore } from '../../store/historyStore';
import {
  Undo2, Redo2, Trash2, Plus, X,
  FileDown, Save, ChevronDown,
} from 'lucide-react';
import { exportAsPNG, exportAsJPEG, exportAsPDF } from '../../utils/exportUtils';
import { saveBoard } from '../../utils/storageUtils';

export default function BottomBar({ canvasRef, showToast }) {
  const { pages, activePage, addPage, deletePage, savePageData, setActivePage } = useBoardStore();
  const { undo, redo, clear } = useHistoryStore();
  const [showExport, setShowExport] = useState(false);

  const getCtxCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    return { canvas, ctx };
  };

  const handleUndo  = () => { const { canvas, ctx } = getCtxCanvas(); if (ctx && canvas) undo(ctx, canvas); };
  const handleRedo  = () => { const { canvas, ctx } = getCtxCanvas(); if (ctx && canvas) redo(ctx, canvas); };
  const handleClear = () => { const { canvas, ctx } = getCtxCanvas(); if (ctx && canvas) clear(ctx, canvas); };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Save current page image data
    const dataUrl = canvas.toDataURL();
    savePageData(activePage, dataUrl);
    const result = saveBoard(useBoardStore.getState().pages);
    if (result === 'quota') {
      showToast('⚠️ Storage full — cannot save');
    } else if (result) {
      showToast('✅ Saved to localStorage');
    } else {
      showToast('❌ Save failed');
    }
  };

  const handleExport = (type) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setShowExport(false);
    if (type === 'png')  exportAsPNG(canvas);
    if (type === 'jpeg') exportAsJPEG(canvas);
    if (type === 'pdf')  exportAsPDF(canvas);
    showToast(`📥 Exported as ${type.toUpperCase()}`);
  };

  const handleSwitchPage = (id) => {
    // Save current canvas to current page
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      savePageData(activePage, dataUrl);
    }
    setActivePage(id);

    // Load the new page's data
    const page = useBoardStore.getState().pages.find((p) => p.id === id);
    if (canvas && page?.data) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = page.data;
    } else if (canvas) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    useHistoryStore.getState().reset();
  };

  const handleAddPage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      savePageData(activePage, dataUrl);
    }
    addPage();
    if (canvas) {
      setTimeout(() => {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        useHistoryStore.getState().reset();
      }, 10);
    }
  };

  return (
    <div
      style={{
        height: 44,
        background: 'rgba(17,24,39,0.97)',
        borderTop: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
        flexShrink: 0,
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {/* Undo / Redo / Clear */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button id="btn-undo" className="tool-btn has-tooltip" data-tip="Undo (Ctrl+Z)" onClick={handleUndo}>
          <Undo2 size={15} />
        </button>
        <button id="btn-redo" className="tool-btn has-tooltip" data-tip="Redo (Ctrl+Shift+Z)" onClick={handleRedo}>
          <Redo2 size={15} />
        </button>
        <button
          id="btn-clear"
          className="tool-btn has-tooltip"
          data-tip="Clear board (Ctrl+Del)"
          onClick={handleClear}
          style={{ color: '#ef4444' }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Pages */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, overflowX: 'auto' }}>
        {pages.map((page) => (
          <div
            key={page.id}
            className={`page-thumb ${page.id === activePage ? 'active' : ''}`}
            onClick={() => page.id !== activePage && handleSwitchPage(page.id)}
          >
            <span style={{ fontSize: 11 }}>📄</span>
            <span>{page.name}</span>
            {pages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (page.id === activePage) {
                    const other = pages.find((p) => p.id !== page.id);
                    if (other) handleSwitchPage(other.id);
                  }
                  setTimeout(() => deletePage(page.id), page.id === activePage ? 50 : 0);
                }}
                style={{
                  background: 'none', border: 'none', color: '#6b7280',
                  cursor: 'pointer', padding: 1, lineHeight: 1,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        <button
          id="btn-add-page"
          onClick={handleAddPage}
          className="has-tooltip"
          data-tip="Add new board"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 5, cursor: 'pointer',
            background: 'rgba(55,65,81,0.5)', border: '1px dashed #4b5563',
            color: '#6b7280', flexShrink: 0,
          }}
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Save */}
      <button
        id="btn-save"
        className="has-tooltip"
        data-tip="Save (Ctrl+S)"
        onClick={handleSave}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
          color: '#a5b4fc', fontSize: 12, flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        <Save size={13} />
        <span>Save</span>
      </button>

      {/* Export dropdown */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          id="btn-export"
          onClick={() => setShowExport((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)',
            color: '#6ee7b7', fontSize: 12,
            transition: 'all 0.15s',
          }}
        >
          <FileDown size={13} />
          <span>Export</span>
          <ChevronDown size={11} style={{ transform: showExport ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
        </button>

        {showExport && (
          <div className="dropdown-menu" style={{ bottom: 40, right: 0 }}>
            {[
              { type: 'png',  label: 'Export as PNG' },
              { type: 'jpeg', label: 'Export as JPEG' },
              { type: 'pdf',  label: 'Export as PDF' },
            ].map(({ type, label }) => (
              <div key={type} className="dropdown-item" onClick={() => handleExport(type)}>
                <FileDown size={13} />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
