import { create } from 'zustand';

export const useHistoryStore = create((set, get) => ({
  past:   [],
  future: [],

  pushSnapshot: (imageData) => set((s) => ({
    past:   [...s.past.slice(-49), imageData],
    future: [],
  })),

  undo: (ctx, canvas) => {
    const { past, future } = get();
    if (past.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const prev = past[past.length - 1];
    ctx.putImageData(prev, 0, 0);
    set({ past: past.slice(0, -1), future: [current, ...future] });
  },

  redo: (ctx, canvas) => {
    const { past, future } = get();
    if (future.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.putImageData(future[0], 0, 0);
    set({ past: [...past, current], future: future.slice(1) });
  },

  clear: (ctx, canvas) => {
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    set((s) => ({ past: [...s.past.slice(-49), current], future: [] }));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  reset: () => set({ past: [], future: [] }),
}));
