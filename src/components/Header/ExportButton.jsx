import React, { useState } from 'react';
import { Download, ChevronDown, Image, FileText } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export default function ExportButton({ onExportPNG }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // In a real app we would wire these up. For now we use the main exportPNG prop
  const exportPNG = () => { onExportPNG(); setIsOpen(false); };
  const exportJPEG = () => { onExportPNG(); setIsOpen(false); };
  const exportPDF = () => { onExportPNG(); setIsOpen(false); };

  const { boardMode } = useCanvasStore();
  const isWhiteboard = boardMode === 'whiteboard';

  return (
    <div className="relative">
      <button onClick={toggleDropdown}
        className={`flex items-center gap-2 h-8 px-3 rounded-lg text-sm font-medium border
          ${isWhiteboard 
            ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
            : 'border-[#2d2d4e] text-gray-200 hover:bg-[#1e1e3a]'}`}>
        <Download size={14} />
        Export
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-10 rounded-xl shadow-lg py-1 w-40 z-50 border
          ${isWhiteboard ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4e]'}`}>
          <button onClick={exportPNG}
            className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2
              ${isWhiteboard ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-200 hover:bg-[#1e1e3a]'}`}>
            <Image size={14} />
            Export PNG
          </button>
          <button onClick={exportJPEG}
            className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2
              ${isWhiteboard ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-200 hover:bg-[#1e1e3a]'}`}>
            <Image size={14} />
            Export JPEG
          </button>
          <button onClick={exportPDF}
            className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2
              ${isWhiteboard ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-200 hover:bg-[#1e1e3a]'}`}>
            <FileText size={14} />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
