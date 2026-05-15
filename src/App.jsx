import { useRef, useState, useCallback, useEffect } from 'react';
import TopBar from './components/Toolbar/TopBar';
import BlackboardCanvas from './components/Canvas/BlackboardCanvas';
import BottomToolbar from './components/BottomBar/BottomToolbar';
import { useBoardStore } from './store/boardStore';
import { useCanvasStore } from './store/canvasStore';
import { useHistoryStore } from './store/historyStore';
import { loadBoard } from './utils/storageUtils';
import { exportAsPNG } from './utils/exportUtils';

// Helper: load a page's saved image onto the canvas
function loadPageOntoCanvas(canvas, pageData) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!pageData) return;
  const img = new Image();
  img.onload = () => ctx.drawImage(img, 0, 0);
  img.src = pageData;
}

export default function App() {
  const canvasRef  = useRef(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Startup: restore saved board ────────────────────────────
  useEffect(() => {
    const saved = loadBoard();
    if (!saved) return;
    try {
      const { setPages, setActivePage } = useBoardStore.getState();
      if (saved.pages?.length) {
        setPages(saved.pages);
        const firstPage = saved.pages[0];
        setActivePage(firstPage.id);
        if (firstPage.data) {
          const tryRestore = (attempts = 0) => {
            const canvas = canvasRef.current;
            if (!canvas || canvas.width === 0) {
              if (attempts < 20) setTimeout(() => tryRestore(attempts + 1), 100);
              return;
            }
            loadPageOntoCanvas(canvas, firstPage.data);
          };
          tryRestore();
        }
      }
    } catch { /* corrupt data */ }
  }, []);

  // ── Blackboard ↔ Whiteboard toggle ──────────────────────────
  // Each mode has its own dedicated page. Switching saves the current
  // canvas to the current page, then loads (or creates) the target page.
  const handleToggleMode = useCallback(() => {
    const canvas = canvasRef.current;
    const { boardMode, toggleBoardMode } = useCanvasStore.getState();
    const store = useBoardStore.getState();

    // 1. Save current canvas content to the current page
    if (canvas) {
      store.savePageData(store.activePage, canvas.toDataURL());
    }

    const nextMode = boardMode === 'blackboard' ? 'whiteboard' : 'blackboard';

    if (nextMode === 'whiteboard') {
      // 2a. Get or create the dedicated whiteboard page
      let wbId = store.whiteboardPageId;
      const wbPageExists = wbId && store.pages.find(p => p.id === wbId);

      if (!wbPageExists) {
        // First time — create a fresh whiteboard page
        useBoardStore.getState().createWhiteboardPage();
        wbId = useBoardStore.getState().whiteboardPageId;
        // Canvas is already blank — nothing to load
      } else {
        // Page exists — switch and restore its content
        useBoardStore.getState().setActivePage(wbId);
        const wbPage = useBoardStore.getState().pages.find(p => p.id === wbId);
        if (canvas) loadPageOntoCanvas(canvas, wbPage?.data ?? null);
      }
    } else {
      // 2b. Switch back to the blackboard page
      const bbId = store.blackboardPageId;
      useBoardStore.getState().setActivePage(bbId);
      const bbPage = useBoardStore.getState().pages.find(p => p.id === bbId);
      if (canvas) loadPageOntoCanvas(canvas, bbPage?.data ?? null);
    }

    // 3. Flip the mode (updates boardColor + ink color in canvasStore)
    toggleBoardMode();
    // 4. Reset undo/redo history for the new board
    useHistoryStore.getState().reset();
  }, []);

  // ── Save ────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { savePageData, activePage } = useBoardStore.getState();
    savePageData(activePage, canvas.toDataURL());
    import('./utils/storageUtils').then(({ saveBoard }) => {
      const result = saveBoard(useBoardStore.getState().pages);
      if (result === 'quota') showToast('⚠️ Storage full');
      else if (result) showToast('✅ Saved');
    });
  }, [showToast]);

  // ── Export ──────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) { exportAsPNG(canvas); showToast('📥 Exported as PNG'); }
  }, [showToast]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TopBar onToggleMode={handleToggleMode} />

      <BlackboardCanvas
        canvasRef={canvasRef}
        onSave={handleSave}
        onExport={handleExport}
        topBarHeight={44}
        bottomBarHeight={62}
      />

      <BottomToolbar canvasRef={canvasRef} showToast={showToast} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
