import { useState } from 'react';
import ToolSelector from './ToolSelector';
import ColorPicker from './ColorPicker';
import BrushSlider from './BrushSlider';
import OpacitySlider from './OpacitySlider';
import { useCanvasStore } from '../../store/canvasStore';
import { Settings, Tablet } from 'lucide-react';

export default function Toolbar() {
  const {
    pressureEnabled, setPressureEnabled,
    pressureCurve, setPressureCurve,
    boardColor, setBoardColor,
    zoom, setZoom,
  } = useCanvasStore();

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div
      className="toolbar-glass"
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* App logo / title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, boxShadow: '0 0 12px rgba(99,102,241,0.4)',
        }}>🖊️</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', whiteSpace: 'nowrap' }}>
          Blackboard
        </span>
      </div>

      <div className="toolbar-divider" />

      {/* Tool selector */}
      <ToolSelector />

      <div className="toolbar-divider" />

      {/* Color picker */}
      <ColorPicker />

      <div className="toolbar-divider" />

      {/* Brush size */}
      <BrushSlider />

      <div className="toolbar-divider" />

      {/* Opacity */}
      <OpacitySlider />

      <div className="toolbar-divider" />

      {/* Pressure toggle */}
      <button
        id="pressure-toggle"
        className="has-tooltip"
        data-tip={pressureEnabled ? 'Pressure: ON' : 'Pressure: OFF'}
        onClick={() => setPressureEnabled(!pressureEnabled)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
          background: pressureEnabled ? 'rgba(99,102,241,0.2)' : 'rgba(55,65,81,0.4)',
          border: `1px solid ${pressureEnabled ? '#6366f1' : 'transparent'}`,
          color: pressureEnabled ? '#a5b4fc' : '#6b7280',
          fontSize: 11, whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        <Tablet size={13} />
        <span>Pressure</span>
      </button>

      {/* Pressure curve */}
      {pressureEnabled && (
        <select
          id="pressure-curve-select"
          value={pressureCurve}
          onChange={(e) => setPressureCurve(e.target.value)}
          style={{
            background: '#1f2937', border: '1px solid #374151',
            color: '#d1d5db', borderRadius: 6, padding: '3px 6px',
            fontSize: 11, cursor: 'pointer',
          }}
        >
          <option value="soft">Soft</option>
          <option value="medium">Medium</option>
          <option value="firm">Firm</option>
        </select>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Zoom */}
      <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
        <button
          onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
          style={{ ...btnStyle }}>−</button>
        <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 36, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(4, zoom + 0.25))}
          style={{ ...btnStyle }}>+</button>
      </div>

      {/* Settings */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          id="settings-btn"
          className="tool-btn has-tooltip"
          data-tip="Settings"
          onClick={() => setShowSettings((v) => !v)}
          style={showSettings ? { background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' } : {}}
        >
          <Settings size={16} />
        </button>

        {showSettings && (
          <div
            className="dropdown-menu"
            style={{ right: 0, top: 44 }}
          >
            <div style={{ padding: '4px 12px 8px', borderBottom: '1px solid #374151', marginBottom: 4 }}>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px' }}>Board Color</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['#1a1a2e', '#0f0f0f', '#0d1b2a', '#1a2f1a', '#2a1a1a'].map((c) => (
                  <div
                    key={c}
                    onClick={() => setBoardColor(c)}
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: c, cursor: 'pointer',
                      border: `2px solid ${boardColor === c ? '#6366f1' : '#374151'}`,
                    }}
                  />
                ))}
                <label>
                  <input
                    type="color"
                    value={boardColor}
                    onChange={(e) => setBoardColor(e.target.value)}
                    style={{ width: 20, height: 20, cursor: 'pointer', borderRadius: 4, border: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  width: 24, height: 24,
  borderRadius: 4, cursor: 'pointer',
  background: 'rgba(55,65,81,0.5)',
  border: '1px solid #374151',
  color: '#9ca3af', fontSize: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
};
