import { create } from 'zustand';

export const useBoardStore = create((set, get) => ({
  // id:1 is always the blackboard page, whiteboardPageId is created on first toggle
  pages:            [{ id: 1, name: 'Blackboard', data: null }],
  activePage:       1,
  blackboardPageId: 1,
  whiteboardPageId: null,

  addPage: () => set((s) => {
    const id = Date.now();
    return {
      pages:      [...s.pages, { id, name: `Board ${s.pages.length + 1}`, data: null }],
      activePage: id,
    };
  }),

  // Create the dedicated whiteboard page (called once on first toggle to whiteboard)
  createWhiteboardPage: () => set((s) => {
    if (s.whiteboardPageId) return s; // already exists
    const id = Date.now();
    return {
      pages:            [...s.pages, { id, name: 'Whiteboard', data: null }],
      activePage:       id,
      whiteboardPageId: id,
    };
  }),

  deletePage: (id) => set((s) => {
    if (s.pages.length === 1) return s;
    const pages = s.pages.filter((p) => p.id !== id);
    // Don't let deletion wipe out the dedicated mode pages
    const safeBbId = pages.find(p => p.id === s.blackboardPageId)?.id ?? pages[0].id;
    return {
      pages,
      activePage:       pages[pages.length - 1].id,
      blackboardPageId: safeBbId,
      whiteboardPageId: pages.find(p => p.id === s.whiteboardPageId)?.id ?? null,
    };
  }),

  savePageData: (id, data) => set((s) => ({
    pages: s.pages.map((p) => p.id === id ? { ...p, data } : p),
  })),

  setActivePage: (id) => set({ activePage: id }),

  setPages: (pages) => set({ pages }),
}));
