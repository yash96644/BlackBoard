import React from 'react';
import { Layers, Download } from 'lucide-react';
import ExportButton from './ExportButton';
import UserAvatar from './UserAvatar';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';

const WindowsIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 88 88"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203-.033-29.766zm35.67 33.529l.016 34.456-35.67-4.814v-29.84l35.654.198zM87.33 0l.004 41.523-46.685.195-.016-35.91L87.33 0zM40.633 46.101l46.697.23V88l-46.697-6.52v-35.38z" />
  </svg>
);

const AppleIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.1.95 2.16.89 2.82-.04z"/>
  </svg>
);

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
      <div className="flex items-center gap-2">
        {/* Windows Download */}
        <a
          href="https://github.com/yash96644/BlackBoard/releases/download/v-1.0.0/Blackboard.Setup.1.0.0.exe"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#12121a]/80 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white text-xs font-semibold rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-[1px] hover:bg-[#1a1a24]/90 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
          aria-label="Download Windows App"
        >
          <WindowsIcon className="w-3 h-3 text-sky-400" />
          <span>Win</span>
        </a>

        {/* macOS Download */}
        <a
          href="https://github.com/yash96644/BlackBoard/releases/download/v-1.0.0/Blackboard-1.0.0.dmg"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#12121a]/80 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white text-xs font-semibold rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-[1px] hover:bg-[#1a1a24]/90 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
          aria-label="Download macOS App"
        >
          <AppleIcon className="w-3 h-3 text-gray-300" />
          <span>Mac</span>
        </a>
        
        <ExportButton onExportPNG={onExportPNG} />
        <UserAvatar />
      </div>
    </header>
  );
});

export default Header;
