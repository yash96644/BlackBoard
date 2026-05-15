export const TOOLS = {
  PENCIL:    'pencil',
  PEN:       'pen',
  MARKER:    'marker',
  CHALK:     'chalk',
  ERASER:    'eraser',
  LINE:      'line',
  RECTANGLE: 'rectangle',
  CIRCLE:    'circle',
  TEXT:      'text',
  FILL:      'fill',
  LASER:     'laser',
};

export const CHALK_COLORS = [
  '#FFFFFF', '#FFFF66', '#66FFFF', '#FF6B6B',
  '#98FB98', '#FFB347', '#DDA0DD', '#87CEEB',
  '#FF69B4', '#ADFF2F', '#FFA500', '#E0BBE4',
  '#FF4500', '#00CED1', '#FFD700', '#7B68EE',
];

export const BRUSH_PRESETS = [
  { label: 'XS',  size: 1  },
  { label: 'S',   size: 4  },
  { label: 'M',   size: 10 },
  { label: 'L',   size: 22 },
  { label: 'XL',  size: 45 },
  { label: 'XXL', size: 80 },
];

export const PRESSURE_CURVES = {
  soft:   (p) => Math.pow(p, 0.5),
  medium: (p) => Math.pow(p, 1.0),
  firm:   (p) => Math.pow(p, 2.0),
};

export const TOOL_DEFAULTS = {
  pencil:    { size: 3,  opacity: 0.85, composite: 'source-over' },
  pen:       { size: 5,  opacity: 1.0,  composite: 'source-over' },
  marker:    { size: 20, opacity: 0.5,  composite: 'source-over' },
  chalk:     { size: 8,  opacity: 0.9,  composite: 'source-over' },
  eraser:    { size: 20, opacity: 1.0,  composite: 'destination-out' },
  line:      { size: 3,  opacity: 1.0,  composite: 'source-over' },
  rectangle: { size: 3,  opacity: 1.0,  composite: 'source-over' },
  circle:    { size: 3,  opacity: 1.0,  composite: 'source-over' },
  text:      { size: 24, opacity: 1.0,  composite: 'source-over' },
  fill:      { size: 1,  opacity: 1.0,  composite: 'source-over' },
  laser:     { size: 6,  opacity: 1.0,  composite: 'source-over' },
};
