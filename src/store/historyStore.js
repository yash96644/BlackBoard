import { create } from 'zustand';
import { redrawCanvas } from '../utils/strokeCommit';
import { useBoardStore } from './boardStore';

export const useHistoryStore = create((set, get) => ({
  past:   [],
  future: [],

  pushSnapshot: (strokes) => set((s) => ({
    past:   [...s.past.slice(-49), strokes],
    future: [],
  })),

  undo: (committedRef) => {
    const { past, future } = get();
    if (past.length === 0) return;

    const committed = committedRef?.current;
    if (!committed) return;

    const activePage = useBoardStore.getState().activePage;
    const currentStrokes = useBoardStore.getState().pages.find(p => p.id === activePage)?.data || [];
    
    const nextPast = past.slice(0, -1);
    const restoredStrokes = nextPast.length > 0 ? nextPast[nextPast.length - 1] : [];

    // Redraw using optimized vector-based renderer
    redrawCanvas(committed, restoredStrokes);

    // Sync state with boardStore
    useBoardStore.getState().savePageData(activePage, restoredStrokes);

    set({
      past:   nextPast,
      future: [currentStrokes, ...future],
    });
  },

  redo: (committedRef) => {
    const { past, future } = get();
    if (future.length === 0) return;

    const committed = committedRef?.current;
    if (!committed) return;

    const activePage = useBoardStore.getState().activePage;
    const currentStrokes = useBoardStore.getState().pages.find(p => p.id === activePage)?.data || [];
    const nextStrokes = future[0];

    // Redraw using optimized vector-based renderer
    redrawCanvas(committed, nextStrokes);

    // Sync state with boardStore
    useBoardStore.getState().savePageData(activePage, nextStrokes);

    set({
      past:   [...past, currentStrokes],
      future: future.slice(1),
    });
  },

  clear: (committedRef) => {
    const committed = committedRef?.current;
    if (!committed) return;

    const activePage = useBoardStore.getState().activePage;
    const currentStrokes = useBoardStore.getState().pages.find(p => p.id === activePage)?.data || [];

    const ctx = committed.getContext('2d');
    ctx.clearRect(0, 0, committed.width, committed.height);

    // Sync empty array to boardStore
    useBoardStore.getState().savePageData(activePage, []);

    set((s) => ({
      past:   [...s.past.slice(-49), currentStrokes],
      future: [],
    }));
  },

  reset: () => set({ past: [], future: [] }),
  resetAll: () => set({ past: [], future: [] }),
}));
