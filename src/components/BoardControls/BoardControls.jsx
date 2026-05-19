import React from 'react';
import { Undo2, Redo2, Trash2, Save } from 'lucide-react';
import { useHistoryStore } from '../../store/historyStore';
import { useCanvasStore } from '../../store/canvasStore';

const BoardControls = React.memo(({ onSave, canvasRef }) => {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const boardMode = useCanvasStore((s) => s.boardMode);
  const isWhiteboard = boardMode === 'whiteboard';

  const handleUndo = () => undo(canvasRef);
  const handleRedo = () => redo(canvasRef);

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Fix: Only clear the canvas pixels. 
    // Do NOT fill with boardColor or draw the grid manually.
    // The background color and grid are handled cleanly by the CSS wrapper in BlackboardCanvas.jsx.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    useHistoryStore.getState().pushSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  return (
    <div className={`absolute top-4 right-4 flex items-center gap-2 z-40`}>
      {/* Undo / Redo */}
      <div className={`flex items-center rounded-xl shadow-sm border p-1 gap-0.5
        ${isWhiteboard ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4e]'}`}>
        <button onClick={handleUndo}
          className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent
            ${isWhiteboard ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e1e3a]'}`}
          disabled={!canUndo}>
          <Undo2 size={15} />
        </button>
        <button onClick={handleRedo}
          className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent
            ${isWhiteboard ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e1e3a]'}`}
          disabled={!canRedo}>
          <Redo2 size={15} />
        </button>
      </div>

      {/* Clear board */}
      <button onClick={clearBoard}
        className={`w-9 h-9 rounded-xl shadow-sm border flex items-center justify-center transition-colors
          ${isWhiteboard 
            ? 'bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500' 
            : 'bg-[#1a1a2e] border-[#2d2d4e] text-gray-400 hover:bg-[#3f2a2a] hover:border-red-900 hover:text-red-400'}`}>
        <Trash2 size={15} />
      </button>

      {/* Save */}
      <button onClick={onSave}
        className={`w-9 h-9 rounded-xl shadow-sm border flex items-center justify-center
          ${isWhiteboard 
            ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100' 
            : 'bg-[#1a1a2e] border-[#2d2d4e] text-gray-400 hover:text-gray-200 hover:bg-[#1e1e3a]'}`}>
        <Save size={15} />
      </button>
    </div>
  );
});

export default BoardControls;
