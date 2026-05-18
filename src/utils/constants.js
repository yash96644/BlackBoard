export const TOOLS = {
  PENCIL:    'pencil',
  PEN:       'pen',
  MARKER:    'marker',
  ERASER:    'eraser',
  LINE:      'line',
  RECTANGLE: 'rectangle',
  CIRCLE:    'circle',
  TEXT:      'text',
  LASER:     'laser',
};

export const DEFAULT_COLOR = '#FFFFFF';

export const TOOL_COLORS = {
  pencil: '#374151',
  pen:    '#000000',
  marker: '#3B82F6',
  laser:  '#EF4444',
};

export const PRESET_COLORS = [
  '#FFFFFF', '#FFFF66', '#66FFFF', '#FF6B6B',
  '#98FB98', '#FFB347', '#DDA0DD', '#87CEEB',
  '#FF69B4', '#ADFF2F', '#FFA500', '#E0BBE4',
  '#FF4500', '#00CED1', '#FFD700', '#7B68EE',
];

export const BRUSH_PRESETS = [
  { label: '1px',  size: 1  },
  { label: '4px',  size: 4  },
  { label: '8px',  size: 8  },
  { label: '16px', size: 16 },
  { label: '32px', size: 32 },
  { label: '64px', size: 64 },
];

export const PRESSURE_CURVES = {
  soft:   (p) => Math.pow(p, 0.5),
  medium: (p) => Math.pow(p, 1.0),
  firm:   (p) => Math.pow(p, 2.0),
};

export const TOOL_DEFAULTS = {
  pencil:    { size: 3,  opacity: 0.82, composite: 'source-over' },
  pen:       { size: 4,  opacity: 1.0,  composite: 'source-over' },
  marker:    { size: 20, opacity: 0.5,  composite: 'source-over' },
  eraser:    { size: 20, opacity: 1.0,  composite: 'destination-out' },
  line:      { size: 3,  opacity: 1.0,  composite: 'source-over' },
  rectangle: { size: 3,  opacity: 1.0,  composite: 'source-over' },
  circle:    { size: 3,  opacity: 1.0,  composite: 'source-over' },
  text:      { size: 24, opacity: 1.0,  composite: 'source-over' },
  laser:     { size: 5,  opacity: 0.95, composite: 'source-over', color: '#EF4444' },
};
