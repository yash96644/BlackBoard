import { create } from 'zustand';
import { TOOLS, TOOL_DEFAULTS } from '../utils/constants';

// Board mode presets
const MODES = {
  blackboard: { boardColor: '#000000', color: '#FFFFFF' },
  whiteboard: { boardColor: '#f7f4ef', color: '#1a1a1a' }, // warm matte paper
};

export const useCanvasStore = create((set) => ({
  activeTool:      TOOLS.PEN,
  color:           '#FFFFFF',
  brushSize:       5,
  opacity:         1.0,
  pressureCurve:   'medium',
  pressureEnabled: true,
  boardColor:      '#000000',   // pure black default
  zoom:            1.0,
  boardMode:       'blackboard', // 'blackboard' | 'whiteboard'

  setActiveTool: (tool) => set((s) => ({
    activeTool: tool,
    brushSize:  TOOL_DEFAULTS[tool]?.size   ?? s.brushSize,
    opacity:    TOOL_DEFAULTS[tool]?.opacity ?? s.opacity,
  })),
  setColor:           (color)   => set({ color }),
  setBrushSize:       (size)    => set({ brushSize: size }),
  setOpacity:         (opacity) => set({ opacity }),
  setPressureCurve:   (curve)   => set({ pressureCurve: curve }),
  setPressureEnabled: (val)     => set({ pressureEnabled: val }),
  setZoom:            (zoom)    => set({ zoom }),
  setBoardColor:      (color)   => set({ boardColor: color }),

  // Toggle between blackboard and whiteboard — swaps bg + ink color
  toggleBoardMode: () => set((s) => {
    const next = s.boardMode === 'blackboard' ? 'whiteboard' : 'blackboard';
    return { boardMode: next, ...MODES[next] };
  }),
}));
