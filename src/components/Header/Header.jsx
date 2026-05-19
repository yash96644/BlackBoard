import React from 'react';
import { Layers, Download } from 'lucide-react';
import ExportButton from './ExportButton';
import UserAvatar from './UserAvatar';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';

const Header = React.memo(({ onExportPNG, canvasRef }) => {
  const { boardMode, setBoardMode } = useCanvasStore(
    useShallow((s) => ({ boardMode: s.boardMode, setBoardMode: s.setBoardMode }))
  );

  const handleToggleMode = (mode) => {
    if (boardMode === mode) return;
    setBoardMode(mode);
  };

  const isWhiteboard = boardMode === 'whiteboard';

  return (
    <header className={`h-12 border-b shadow-sm flex items-center justify-between px-4 shrink-0 z-50
      ${isWhiteboard ? 'bg-white border-gray-200' : 'bg-[#0f0f1a] border-[#2d2d4e]'}`}>

      {/* Left: Logo + Name */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg
          flex items-center justify-center">
          <Layers size={16} className="text-white" />
        </div>
        <span className={`font-bold text-[15px] ${isWhiteboard ? 'text-gray-900' : 'text-gray-200'}`}>
          Blackboard
        </span>
      </div>

      {/* Center: Board Mode Toggle */}
      <div className={`flex items-center rounded-xl p-1 border
        ${isWhiteboard ? 'bg-gray-100 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4e]'}`}>

        <button
          onClick={() => handleToggleMode('blackboard')}
          className={`
            flex items-center gap-2 px-3 h-7 rounded-lg
            text-xs font-medium transition-all duration-200
            ${boardMode === 'blackboard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e1e3a]'
            }
          `}>
          <span className="w-3 h-3 rounded-sm bg-current opacity-80 inline-block" />
          Blackboard
        </button>

        <button
          onClick={() => handleToggleMode('whiteboard')}
          className={`
            flex items-center gap-2 px-3 h-7 rounded-lg
            text-xs font-medium transition-all duration-200
            ${boardMode === 'whiteboard'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e1e3a]'
            }
          `}>
          <span className="w-3 h-3 rounded-sm border border-current inline-block" />
          Whiteboard
        </button>

      </div>

      {/* Right: Actions + Avatar */}
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/yash96644/BlackBoard/releases/download/v-1.0.0/Blackboard.Setup.1.0.0.exe"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-[#12121a]/80 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white text-xs font-semibold rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-[1px] hover:bg-[#1a1a24]/90 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
          aria-label="Download Desktop App"
        >
          <Download size={14} />
          <span>Desktop</span>
        </a>
        <ExportButton onExportPNG={onExportPNG} />
        <UserAvatar />
      </div>
    </header>
  );
});

export default Header;
