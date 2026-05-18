import { useCanvasStore } from '../../store/canvasStore';
import { TOOLS } from '../../utils/constants';
import {
  Pen, Pencil, Highlighter, Eraser, Minus,
  Square, Circle, Type,
  Zap,
} from 'lucide-react';

const TOOL_LIST = [
  { id: TOOLS.PEN,       icon: Pen,               label: 'Pen (P)',       shortcut: 'P' },
  { id: TOOLS.PENCIL,    icon: Pencil,             label: 'Pencil',        shortcut: '' },
  { id: TOOLS.MARKER,    icon: Highlighter,        label: 'Marker (B)',    shortcut: 'B' },
  { id: TOOLS.ERASER,    icon: Eraser,             label: 'Eraser (E)',    shortcut: 'E' },
  { id: TOOLS.LINE,      icon: Minus,              label: 'Line (L)',      shortcut: 'L' },
  { id: TOOLS.RECTANGLE, icon: Square,             label: 'Rectangle (R)', shortcut: 'R' },
  { id: TOOLS.CIRCLE,    icon: Circle,             label: 'Circle (C)',    shortcut: 'C' },
  { id: TOOLS.TEXT,      icon: Type,               label: 'Text (T)',      shortcut: 'T' },
  { id: TOOLS.LASER,     icon: Zap,                label: 'Laser Pointer — marks stay until erased', shortcut: '' },
];

export default function ToolSelector() {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <div className="flex items-center gap-1">
      {TOOL_LIST.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          id={`tool-${id}`}
          className={`tool-btn has-tooltip`}
          data-tip={label}
          onClick={() => setActiveTool(id)}
          aria-label={label}
          style={activeTool === id ? {
            background: 'rgba(99,102,241,0.25)',
            color: '#6366f1',
            borderColor: '#6366f1',
            boxShadow: '0 0 12px rgba(99,102,241,0.3)',
          } : {}}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
