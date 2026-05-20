import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { PRESET_COLORS, BRUSH_PRESETS } from '../../utils/constants';

export default function ColorBrushPanel({ onClose }) {
  const { color, setColor, brushSize, setBrushSize, opacity, setOpacity, boardMode } = useCanvasStore();
  const isWhiteboard = boardMode === 'whiteboard';

  return (
    <div className={`absolute left-[64px] bottom-20 rounded-xl shadow-lg p-4 w-[220px] z-[100] border
      ${isWhiteboard ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4e]'}`}>

      {/* SECTION 1 — Colors */}
      <div className="mb-4">
        <label className={`block text-xs mb-2 ${isWhiteboard ? 'text-gray-500' : 'text-gray-400'}`}>Color</label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map(c => (
            <div
              key={c}
              onClick={() => {
                setColor(c);
                onClose?.();
              }}
              className={`w-7 h-7 rounded-full cursor-pointer hover:scale-110 transition-transform
                ring-2 ring-offset-1 ring-transparent
                ${isWhiteboard 
                  ? (color === c ? 'ring-indigo-500' : '') 
                  : `ring-offset-[#1a1a2e] ${color === c ? 'ring-[#818cf8]' : ''}`}`}
              style={{ backgroundColor: c, border: `1px solid rgba(${isWhiteboard ? '0,0,0,0.1' : '255,255,255,0.1'})` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          />
          <input
            type="text"
            value={color.toUpperCase()}
            onChange={(e) => setColor(e.target.value)}
            className={`flex-1 text-sm border rounded px-2 py-1
              ${isWhiteboard ? 'border-gray-200' : 'bg-[#0f0f1a] border-[#2d2d4e] text-gray-200'}`}
          />
        </div>
      </div>

      {/* SECTION 2 — Brush Size */}
      <div className="mb-4">
        <label className={`block text-xs mb-2 ${isWhiteboard ? 'text-gray-500' : 'text-gray-400'}`}>Size</label>
        <input
          type="range"
          min="1"
          max="80"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          className={`w-full mb-2 ${isWhiteboard ? 'accent-indigo-600' : 'accent-indigo-500'}`}
        />
        <div className="flex justify-between items-center mt-2">
          {BRUSH_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setBrushSize(preset.size)}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
                ${isWhiteboard
                  ? `hover:bg-gray-100 ${brushSize === preset.size ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`
                  : `hover:bg-[#1e1e3a] ${brushSize === preset.size ? 'bg-[rgba(99,102,241,0.15)] text-[#818cf8]' : 'text-gray-400'}`}`}
              title={preset.label}
            >
              <div
                className="bg-current rounded-full"
                style={{ width: Math.min(16, preset.size), height: Math.min(16, preset.size) }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3 — Opacity */}
      <div>
        <label className={`block text-xs mb-2 ${isWhiteboard ? 'text-gray-500' : 'text-gray-400'}`}>Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(parseInt(e.target.value, 10) / 100)}
            className={`w-full ${isWhiteboard ? 'accent-indigo-600' : 'accent-indigo-500'}`}
          />
          <span className={`text-xs min-w-[32px] text-right ${isWhiteboard ? 'text-gray-500' : 'text-gray-400'}`}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
