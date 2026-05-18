import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useCanvas } from '../../hooks/useCanvas';

const ZoomControls = React.memo(({ canvasRef }) => {
  const { zoom } = useCanvasStore();
  const { zoomIn, zoomOut, resetZoom } = useCanvas(canvasRef);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2
      flex items-center gap-1 bg-[#1a1a2e] rounded-xl shadow-md
      border border-[#2d2d4e] px-2 py-1.5 z-50">

      <button onClick={zoomOut}
        className="w-7 h-7 rounded-lg hover:bg-[#1e1e3a]
          flex items-center justify-center text-gray-400 hover:text-gray-200">
        <Minus size={14} />
      </button>

      <span onClick={resetZoom}
        className="cursor-pointer hover:text-indigo-400
          transition-colors min-w-[42px] text-center text-xs
          font-medium text-gray-300">
        {Math.round(zoom * 100)}%
      </span>

      <button onClick={zoomIn}
        className="w-7 h-7 rounded-lg hover:bg-[#1e1e3a]
          flex items-center justify-center text-gray-400 hover:text-gray-200">
        <Plus size={14} />
      </button>
    </div>
  );
});

export default ZoomControls;
