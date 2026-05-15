import { useCanvasStore } from '../../store/canvasStore';

export default function OpacitySlider() {
  const { opacity, setOpacity } = useCanvasStore();

  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
        Opacity
      </span>
      <input
        id="opacity-slider"
        type="range"
        min={0}
        max={100}
        value={Math.round(opacity * 100)}
        onChange={(e) => setOpacity(Number(e.target.value) / 100)}
        style={{ width: 70 }}
      />
      <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 28, textAlign: 'right' }}>
        {Math.round(opacity * 100)}%
      </span>
    </div>
  );
}
