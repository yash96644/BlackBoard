import { useEffect } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useCanvasStore } from '../store/canvasStore';
import { TOOLS } from '../utils/constants';

export function useShortcuts(canvasRef, onSave, onExport) {
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
        const canvas = canvasRef.current;
        if (canvas) undo(canvas.getContext('2d'), canvas);
      }
      if (cmd && key === 'z' && e.shiftKey) {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (canvas) redo(canvas.getContext('2d'), canvas);
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
        const canvas = canvasRef.current;
        if (canvas) clear(canvas.getContext('2d'), canvas);
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
        if (key === 'f') setActiveTool(TOOLS.FILL);
        if (key === '[') setBrushSize(Math.max(1,  brushSize - 2));
        if (key === ']') setBrushSize(Math.min(80, brushSize + 2));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canvasRef, undo, redo, clear, setActiveTool, setBrushSize, brushSize, onSave, onExport]);
}
