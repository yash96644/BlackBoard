import React from 'react';
import { Plus } from 'lucide-react';
import { useBoardStore } from '../../store/boardStore';
import { useHistoryStore } from '../../store/historyStore';
import { useShallow } from 'zustand/react/shallow';
import { useCanvasStore } from '../../store/canvasStore';

const PageTabs = React.memo(({ canvasRef }) => {
  const { activePage, pages, addPage, setActivePage, saveCurrentPage } = useBoardStore(
    useShallow(s => ({
      activePage: s.activePage,
      pages: s.pages,
      addPage: s.addPage,
      setActivePage: s.setActivePage,
      saveCurrentPage: s.saveCurrentPage
    }))
  );

  const handleAddPage = () => {
    saveCurrentPage(canvasRef);
    addPage();
    useHistoryStore.getState().reset();
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 0);
  };

  const { boardMode } = useCanvasStore();
  const isWhiteboard = boardMode === 'whiteboard';

  return (
    <div className={`absolute left-20 bottom-4 rounded-xl shadow-sm p-1.5 flex items-center gap-1 z-40 border
      ${isWhiteboard ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4e]'}`}>

      {pages.map((page) => {
        const isActive = activePage === page.id;
        return (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id, canvasRef)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
              ${isActive
                ? (isWhiteboard ? 'bg-indigo-50 text-indigo-700' : 'bg-[rgba(99,102,241,0.15)] text-[#818cf8]')
                : (isWhiteboard ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-[#1e1e3a] hover:text-gray-200')}
            `}
          >
            {page.name}
          </button>
        );
      })}

      <div className={`w-px h-5 mx-1 ${isWhiteboard ? 'bg-gray-200' : 'bg-[#2d2d4e]'}`} />

      <button
        onClick={handleAddPage}
        title="Add new board"
        className={`p-1.5 rounded-lg flex items-center justify-center transition-colors
          ${isWhiteboard ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-400 hover:bg-[#1e1e3a] hover:text-white'}`}
      >
        <Plus size={18} />
      </button>
    </div>
  );
});

export default PageTabs;
