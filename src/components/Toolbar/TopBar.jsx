import { useCanvasStore } from '../../store/canvasStore';
import UserMenu from './UserMenu';

export default function TopBar({ onToggleMode, macPadding = false }) {
  const { zoom, setZoom, boardMode } = useCanvasStore();
  const isWhiteboard = boardMode === 'whiteboard';

  return (
    <div style={{
      height: 44,
      background: 'rgba(8, 8, 12, 0.98)',
      borderBottom: '1px solid #111827',
      display: 'flex', alignItems: 'center',
      padding: macPadding ? '0 14px 0 80px' : '0 14px', gap: 10,
      flexShrink: 0, zIndex: 50,
      userSelect: 'none',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, boxShadow: '0 0 10px rgba(99,102,241,0.5)',
        }}>🖊️</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', letterSpacing: 0.3 }}>
          Blackboard
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* ── Blackboard / Whiteboard toggle pill ─────────────────── */}
      <button
        id="board-mode-toggle"
        onClick={onToggleMode}
        title={isWhiteboard ? 'Switch to Blackboard' : 'Switch to Whiteboard'}
        style={{
          display: 'flex', alignItems: 'center',
          borderRadius: 22, overflow: 'hidden',
          cursor: 'pointer', border: 'none',
          flexShrink: 0, padding: 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          padding: '6px 14px', fontSize: 12, fontWeight: 500,
          background: !isWhiteboard ? '#6366f1' : '#1f2937',
          color: !isWhiteboard ? '#ffffff' : '#4b5563',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.22s ease',
          letterSpacing: 0.2,
        }}>
          <span style={{ fontSize: 11 }}>⬛</span>
          Blackboard
        </div>
        <div style={{
          padding: '6px 14px', fontSize: 12, fontWeight: 500,
          background: isWhiteboard ? '#6366f1' : '#111827',
          color: isWhiteboard ? '#ffffff' : '#4b5563',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.22s ease',
          letterSpacing: 0.2,
        }}>
          <span style={{ fontSize: 11 }}>⬜</span>
          Whiteboard
        </div>
      </button>

      <div style={{ width: 1, height: 20, background: '#1f2937' }} />

      {/* Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} style={zBtn}>−</button>
        <span style={{ fontSize: 11, color: '#6b7280', minWidth: 38, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} style={zBtn}>+</button>
        {zoom !== 1 && (
          <button onClick={() => setZoom(1)} title="Reset zoom" style={{ ...zBtn, fontSize: 10 }}>↺</button>
        )}
      </div>

      <div style={{ width: 1, height: 20, background: '#1f2937' }} />

      {/* User avatar + dropdown */}
      <UserMenu />
    </div>
  );
}

const zBtn = {
  width: 22, height: 22, borderRadius: 5, cursor: 'pointer',
  background: 'rgba(55,65,81,0.5)', border: '1px solid #1f2937',
  color: '#6b7280', fontSize: 13, lineHeight: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
