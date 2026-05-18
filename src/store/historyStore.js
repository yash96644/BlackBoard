import { create } from 'zustand';

export const useHistoryStore = create((set, get) => ({
  past:   [],
  future: [],

  pushSnapshot: (imageData) => set((s) => ({
    past:   [...s.past.slice(-49), imageData],
    future: [],
  })),

  undo: (committedRef) => {
    const { past, future } = get();
    if (past.length === 0) return;

    const committed = committedRef?.current;
    if (!committed) return;

    const ctx     = committed.getContext('2d');
    const current = ctx.getImageData(
      0, 0, committed.width, committed.height
    );
    const prev    = past[past.length - 1];

    ctx.putImageData(prev, 0, 0);
    set({
      past:   past.slice(0, -1),
      future: [current, ...future],
    });
  },

  redo: (committedRef) => {
    const { past, future } = get();
    if (future.length === 0) return;

    const committed = committedRef?.current;
    if (!committed) return;

    const ctx     = committed.getContext('2d');
    const current = ctx.getImageData(
      0, 0, committed.width, committed.height
    );

    ctx.putImageData(future[0], 0, 0);
    set({
      past:   [...past, current],
      future: future.slice(1),
    });
  },

  clear: (committedRef) => {
    const committed = committedRef?.current;
    if (!committed) return;

    const ctx     = committed.getContext('2d');
    const current = ctx.getImageData(
      0, 0, committed.width, committed.height
    );

    set((s) => ({
      past:   [...s.past.slice(-49), current],
      future: [],
    }));
    ctx.clearRect(0, 0, committed.width, committed.height);
  },

  reset: () => set({ past: [], future: [] }),
  resetAll: () => set({ past: [], future: [] }),
}));
