import { useRef, useCallback, useEffect } from 'react';
import BlackboardCanvas from './components/Canvas/BlackboardCanvas';
import { useBoardStore } from './store/boardStore';
import { useAuthStore } from './store/authStore';
import { useCanvasStore } from './store/canvasStore';
import TitleBar from './components/TitleBar/TitleBar';
import Header from './components/Header/Header';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import ZoomControls from './components/ZoomControls/ZoomControls';
import BoardControls from './components/BoardControls/BoardControls';
import PageTabs from './components/PageTabs/PageTabs';
import { loadBoard } from './utils/storageUtils';
import { exportAsPNG } from './utils/exportUtils';

export default function App() {
  const canvasRef = useRef(null);

  // ── Startup: restore saved board ────────────────────────────
  useEffect(() => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const saved = loadBoard(user.id);
    if (!saved) {
      useBoardStore.getState().resetAll();
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    try {
      const { setPages, setActivePage } = useBoardStore.getState();
      if (saved.pages?.length) {
        setPages(saved.pages);
        const firstPage = saved.pages[0];
        
        // Wait for canvas to mount and initialize active page vector drawing
        const tryRestore = (attempts = 0) => {
          const canvas = canvasRef.current;
          if (!canvas || canvas.width === 0) {
            if (attempts < 20) setTimeout(() => tryRestore(attempts + 1), 100);
            return;
          }
          setActivePage(firstPage.id, canvasRef);
        };
        tryRestore();
      }
    } catch { /* corrupt data */ }
  }, []);

  // ── Save ────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const userId = useAuthStore.getState().user?.id;
    import('./utils/storageUtils').then(({ saveBoard }) => {
      const result = saveBoard(useBoardStore.getState().pages, userId);
      const showToast = useCanvasStore.getState().showToast;
      if (result === 'quota') {
        showToast('⚠️ Storage full — cannot save');
      } else if (result) {
        showToast('✅ Board saved successfully');
      } else {
        showToast('❌ Save failed');
      }
    });
  }, []);

  // ── Export ──────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) { exportAsPNG(canvas); }
  }, []);

  const boardMode = useCanvasStore((s) => s.boardMode);
  const toast = useCanvasStore((s) => s.toast);
  const toastKey = useCanvasStore((s) => s.toastKey);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${boardMode === 'whiteboard' ? 'bg-[#F9F9FB]' : 'bg-[#0f0f1a]'} select-none`}>
      <TitleBar />
      
      {/* TOP HEADER BAR */}
      <Header onExportPNG={handleExport} canvasRef={canvasRef} />

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* LEFT SIDEBAR — tools */}
        <LeftSidebar />

        {/* CANVAS — fills everything */}
        <div className="flex-1 relative overflow-hidden">
          <BlackboardCanvas
            canvasRef={canvasRef}
            onSave={handleSave}
            onExport={handleExport}
          />

          {/* BOTTOM CENTER — zoom controls */}
          {/* <ZoomControls canvasRef={canvasRef} /> */}

          {/* TOP RIGHT — page/board controls */}
          <BoardControls onSave={handleSave} canvasRef={canvasRef} />

          {/* BOTTOM LEFT - page tabs */}
          <PageTabs canvasRef={canvasRef} />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div key={toastKey} className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}
