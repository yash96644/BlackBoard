import { useCanvasStore } from '../../store/canvasStore';
import { BRUSH_PRESETS } from '../../utils/constants';

export default function BrushSlider() {
  const { brushSize, setBrushSize } = useCanvasStore();

  return (
    <div className="flex items-center gap-2">
      {/* Quick presets */}
      <div className="flex gap-1">
        {BRUSH_PRESETS.map(({ label, size }) => (
          <button
            key={label}
            onClick={() => setBrushSize(size)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              borderRadius: 4,
              cursor: 'pointer',
              background: brushSize === size ? 'rgba(99,102,241,0.3)' : 'rgba(55,65,81,0.5)',
              color: brushSize === size ? '#a5b4fc' : '#9ca3af',
              border: `1px solid ${brushSize === size ? '#6366f1' : 'transparent'}`,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-2" style={{ minWidth: 90 }}>
        <input
          id="brush-size-slider"
          type="range"
          min={1}
          max={80}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          style={{ width: 70 }}
        />
        {/* Visual preview dot */}
        <div
          style={{
            width:        Math.max(4, Math.min(brushSize, 24)),
            height:       Math.max(4, Math.min(brushSize, 24)),
            borderRadius: '50%',
            background:   '#6366f1',
            flexShrink:   0,
            transition:   'all 0.15s',
          }}
        />
      </div>
    </div>
  );
}
