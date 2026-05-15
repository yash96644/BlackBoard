import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { CHALK_COLORS } from '../../utils/constants';

const MAX_HISTORY = 8;

export default function ColorPicker() {
  const { color, setColor } = useCanvasStore();
  const [colorHistory, setColorHistory] = useState([]);
  const [showPalette, setShowPalette] = useState(false);

  const applyColor = (c) => {
    setColor(c);
    setColorHistory((prev) => {
      const filtered = prev.filter((x) => x !== c);
      return [c, ...filtered].slice(0, MAX_HISTORY);
    });
    setShowPalette(false);
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Current color swatch + click to open palette */}
      <button
        id="color-current"
        onClick={() => setShowPalette((v) => !v)}
        className="has-tooltip"
        data-tip="Color palette"
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: color,
          border: '2px solid rgba(255,255,255,0.3)',
          cursor: 'pointer',
          boxShadow: `0 0 8px ${color}44`,
          transition: 'box-shadow 0.2s',
          flexShrink: 0,
        }}
      />

      {/* Native color input for custom hex */}
      <label className="has-tooltip" data-tip="Custom color">
        <input
          id="color-custom-input"
          type="color"
          value={color}
          onChange={(e) => applyColor(e.target.value)}
          style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
        />
        <div
          style={{
            width: 20, height: 20, borderRadius: 4,
            background: 'linear-gradient(135deg, #ff6b6b, #6366f1, #66ffff)',
            cursor: 'pointer', border: '1px solid #374151',
            flexShrink: 0,
          }}
          onClick={(e) => e.currentTarget.previousElementSibling?.click?.() || e.currentTarget.parentElement.querySelector('input')?.click()}
        />
      </label>

      {/* Recent colors */}
      {colorHistory.slice(0, 5).map((c, i) => (
        <button
          key={i}
          className="color-swatch"
          style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }}
          onClick={() => applyColor(c)}
          aria-label={`Recent color ${c}`}
        />
      ))}

      {/* Color palette popup */}
      {showPalette && (
        <div
          style={{
            position: 'absolute',
            top: 44, left: 0,
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 10,
            padding: 10,
            zIndex: 300,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, marginTop: 0 }}>Chalk Colors</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
            {CHALK_COLORS.map((c) => (
              <div
                key={c}
                className="color-swatch"
                style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }}
                onClick={() => applyColor(c)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
