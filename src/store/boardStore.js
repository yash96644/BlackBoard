import { create } from 'zustand';
import { redrawCanvas } from '../utils/strokeCommit';

export const useBoardStore = create((set, get) => ({
  pages: [{ id: 1, name: 'Blackboard', data: [] }], // Default page data is an empty stroke list
  activePage: 1,

  // In vector-based history, page.data is already kept updated in real-time.
  saveCurrentPage: (canvasRef) => {
    // No-op: Completely eliminates getImageData page switch stalls.
  },

  // Call this AFTER switching to restore new page canvas
  loadPageData: (canvasRef, pageId) => {
    const { pages } = get();
    const page = pages.find((p) => p.id === pageId);
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (page?.data) {
      if (Array.isArray(page.data)) {
        // Redraw vector strokes
        redrawCanvas(canvas, page.data);
      } else if (typeof page.data === 'string') {
        // Support backward compatibility with base64 data URLs
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = page.data;
      } else {
        // Support backward compatibility with old ImageData snapshots
        ctx.putImageData(page.data, 0, 0);
      }
    }
  },

  setActivePage: (id, canvasRef) => {
    const store = get();
    // 1. Save current page first
    store.saveCurrentPage(canvasRef);
    // 2. Switch active page
    set({ activePage: id });
    // 3. Load new page content
    setTimeout(() => store.loadPageData(canvasRef, id), 0);
  },

  addPage: () => set((s) => {
    const id = Date.now().toString();
    return {
      pages: [
        ...s.pages,
        { id, name: `Board ${s.pages.length + 1}`, data: [] }
      ],
      activePage: id,
    };
  }),

  deletePage: (id) => set((s) => {
    if (s.pages.length === 1) return s;
    const pages = s.pages.filter((p) => p.id !== id);
    return {
      pages,
      activePage: pages[pages.length - 1].id,
    };
  }),

  savePageData: (id, data) => set((s) => ({
    pages: s.pages.map((p) => p.id === id ? { ...p, data } : p),
  })),

  setPages: (pages) => set({ pages }),

  resetAll: () => set({
    pages: [{ id: 1, name: 'Blackboard', data: [] }],
    activePage: 1,
  }),
  
  loadPages: (pages) => set({ pages, activePage: pages[0].id }),
}));
