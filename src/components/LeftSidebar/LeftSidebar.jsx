import React, { useState } from 'react';
import { PenLine, Pencil, Highlighter, Eraser, Minus, Square, Circle, Type, Zap, MousePointer2, PenTool, MonitorPlay, Wand2 } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { TOOLS } from '../../utils/constants';
import ColorBrushPanel from './ColorBrushPanel';
import { useShallow } from 'zustand/react/shallow';

const ToolButton = React.memo(({ icon: Icon, tool, label, shortcut }) => {
  const { activeTool, setActiveTool, boardMode } = useCanvasStore(
    useShallow(s => ({ activeTool: s.activeTool, setActiveTool: s.setActiveTool, boardMode: s.boardMode }))
  );
  const isActive = activeTool === tool;
  const isWhiteboard = boardMode === 'whiteboard';

  return (
    <button
      onClick={() => setActiveTool(tool)}
      title={`${label} (${shortcut})`}
      className={`
        w-10 h-10 rounded-xl mx-auto flex flex-col
        items-center justify-center gap-0.5 transition-colors duration-150
        ${isWhiteboard ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-[#1e1e3a]'}
        ${isActive 
          ? (isWhiteboard ? 'bg-indigo-50 text-indigo-600' : 'bg-[rgba(99,102,241,0.15)] text-[#818cf8]') 
          : ''}
      `}
    >
      <Icon size={20} color={tool === TOOLS.LASER ? '#EF4444' : undefined} />
    </button>
  );
});

const Divider = ({ isWhiteboard }) => (
  <div className={`w-8 h-px mx-auto my-1 ${isWhiteboard ? 'bg-gray-200' : 'bg-[#2d2d4e]'}`} />
);

const LeftSidebar = React.memo(() => {
  const [showColorPanel, setShowColorPanel] = useState(false);
  const { color, brushSize, boardMode } = useCanvasStore(
    useShallow(s => ({ color: s.color, brushSize: s.brushSize, boardMode: s.boardMode }))
  );
  
  const isWhiteboard = boardMode === 'whiteboard';

  return (
    <div className={`relative w-14 shadow-sm py-3 flex flex-col h-full z-40 border-r
      ${isWhiteboard ? 'bg-white border-gray-200' : 'bg-[#0f0f1a] border-[#2d2d4e]'}`}>
      
      {/* Tools List */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {/* <ToolButton icon={MousePointer2} tool={TOOLS.SELECT} label="Select" shortcut="V" /> */}
        <ToolButton icon={Pencil} tool={TOOLS.PENCIL} label="Pencil" shortcut="P" />
        <ToolButton icon={PenTool} tool={TOOLS.PEN} label="Pen" shortcut="Shift+P" />
        <ToolButton icon={Highlighter} tool={TOOLS.MARKER} label="Marker" shortcut="B" />
        <ToolButton icon={Eraser} tool={TOOLS.ERASER} label="Eraser" shortcut="E" />
        
        <Divider isWhiteboard={isWhiteboard} />
        
        <ToolButton icon={Type} tool={TOOLS.TEXT} label="Text" shortcut="T" />
        <ToolButton icon={Minus} tool={TOOLS.LINE} label="Line" shortcut="L" />
        <ToolButton icon={Square} tool={TOOLS.RECTANGLE} label="Rectangle" shortcut="R" />
        <ToolButton icon={Circle} tool={TOOLS.CIRCLE} label="Circle" shortcut="C" />

        <Divider isWhiteboard={isWhiteboard} />
        
        <ToolButton icon={Wand2} tool={TOOLS.LASER} label="Laser Pointer" shortcut="K" />
      </div>

      {/* Bottom Panel Toggle */}
      <div className={`mt-auto flex flex-col items-center gap-3 pt-4 border-t
        ${isWhiteboard ? 'border-gray-100' : 'border-[#2d2d4e]'}`}>
        <button
          onClick={() => setShowColorPanel(!showColorPanel)}
          title="Color & Brush Settings"
          className={`w-10 h-10 flex flex-col items-center justify-center gap-1 rounded-xl
            ${isWhiteboard ? 'hover:bg-gray-100' : 'hover:bg-[#1e1e3a]'}`}
        >
          {/* Color dot */}
          <div
            className={`w-5 h-5 rounded-full border
              ${isWhiteboard ? 'border-gray-300' : 'border-[#2d2d4e]'}`}
            style={{ backgroundColor: color }}
          />
          {/* Size indicator text */}
          <span className={`text-[10px] font-medium leading-none
            ${isWhiteboard ? 'text-gray-500' : 'text-gray-400'}`}>
            {brushSize}px
          </span>
        </button>
      </div>

      {/* Floating Panel */}
      {showColorPanel && <ColorBrushPanel />}
    </div>
  );
});

export default LeftSidebar;
