import { useEffect } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useCanvasStore } from '../store/canvasStore';
import { TOOLS } from '../utils/constants';

export function useShortcuts(committedRef, activeRef, onSave, onExport) {
  const { undo, redo, clear } = useHistoryStore();
  const { setActiveTool, setBrushSize, brushSize } = useCanvasStore();

  useEffect(() => {
    const handler = (e) => {
      // Don't fire shortcuts when typing in inputs
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const cmd = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (cmd && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo(committedRef);
      }
      if (cmd && key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo(committedRef);
      }
      if (cmd && key === 's') {
        e.preventDefault();
        onSave?.();
      }
      if (cmd && key === 'e') {
        e.preventDefault();
        onExport?.();
      }
      if ((key === 'delete' || key === 'backspace') && cmd) {
        e.preventDefault();
        clear(committedRef);
      }
      if (cmd && (key === '=' || key === '+')) {
        e.preventDefault();
        const { zoom } = useCanvasStore.getState();
        useCanvasStore.getState().setZoom(Math.min(5.0, zoom + 0.1));
      }
      if (cmd && key === '-') {
        e.preventDefault();
        const { zoom } = useCanvasStore.getState();
        useCanvasStore.getState().setZoom(Math.max(0.25, zoom - 0.1));
      }
      if (cmd && key === '0') {
        e.preventDefault();
        useCanvasStore.getState().setZoom(1.0);
      }
      // Tool shortcuts (no cmd modifier)
      if (!cmd) {
        if (key === 'p') setActiveTool(TOOLS.PEN);
        if (key === 'e') setActiveTool(TOOLS.ERASER);
        if (key === 'b') setActiveTool(TOOLS.MARKER);
        if (key === 'l') setActiveTool(TOOLS.LINE);
        if (key === 'r') setActiveTool(TOOLS.RECTANGLE);
        if (key === 'c') setActiveTool(TOOLS.CIRCLE);
        if (key === 't') setActiveTool(TOOLS.TEXT);
        if (key === '[') setBrushSize(Math.max(1,  brushSize - 2));
        if (key === ']') setBrushSize(Math.min(80, brushSize + 2));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [committedRef, undo, redo, clear, setActiveTool, setBrushSize, brushSize, onSave, onExport]);
}
