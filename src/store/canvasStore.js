import { create } from 'zustand';
import { TOOLS, TOOL_DEFAULTS } from '../utils/constants';

export const useCanvasStore = create((set) => ({
  activeTool:      TOOLS.PEN,
  color:           '#FFFFFF',
  brushSize:       4,
  opacity:         1.0,
  pressureCurve:   'medium',
  pressureEnabled: true,
  boardColor:      '#1a1a2e',
  zoom:            1.0,
  boardMode:       'blackboard',

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
  setZoom:            (zoom)    => set({ zoom: Math.max(0.1, Math.min(5.0, zoom)) }),
  setBoardColor:      (color)   => set({ boardColor: color }),
  setBoardMode:       (mode)    => set({
    boardMode: mode,
    boardColor: mode === 'blackboard' ? '#1a1a2e' : '#FFFFFF',
    color: mode === 'blackboard' ? '#FFFFFF' : '#000000',
  }),
}));
