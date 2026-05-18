import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

// ── Broken image fallback hook ────────────────────────────────────────────────
function useImageValid(src) {
  const [valid, setValid] = useState(!!src);
  useEffect(() => {
    if (!src) { setValid(false); return; }
    const img = new Image();
    img.onload  = () => setValid(true);
    img.onerror = () => setValid(false);
    img.src = src;
  }, [src]);
  return valid;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 28 }) {
  const avatarUrl  = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const imageValid = useImageValid(avatarUrl);
  const name       = user?.user_metadata?.full_name ?? user?.email ?? '?';
  const initials   = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  // Hash name to a consistent hue for initials circle colour
  let hue = 0;
  for (let i = 0; i < name.length; i++) hue = (hue + name.charCodeAt(i) * 37) % 360;

  if (avatarUrl && imageValid) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '2px solid rgba(99,102,241,0.5)',
          display: 'block',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue}, 65%, 45%)`,
      border: '2px solid rgba(255,255,255,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, color: '#fff',
      flexShrink: 0, userSelect: 'none',
    }}>
      {initials || '?'}
    </div>
  );
}

// ── UserMenu ──────────────────────────────────────────────────────────────────
export default function UserMenu() {
  const { user, signOut } = useAuthStore();
  const [open,   setOpen]   = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setOpen(false);
  };

  if (!user) return null;

  const name  = user.user_metadata?.full_name ?? user.email ?? 'User';
  const email = user.email ?? '';

  // Truncate long name
  const displayName = name.length > 22 ? name.slice(0, 20) + '…' : name;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>

      {/* Avatar trigger button */}
      <button
        id="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        title={name}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, display: 'flex', alignItems: 'center',
          borderRadius: '50%', outline: 'none',
          transition: 'transform 0.15s ease',
          transform: open ? 'scale(1.08)' : 'scale(1)',
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        <Avatar user={user} size={30} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: 'rgba(17,24,39,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '8px',
            minWidth: 220,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            zIndex: 200,
            animation: 'dropIn 0.15s ease',
          }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)  scale(1); }
            }
          `}</style>

          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 4,
          }}>
            <Avatar user={user} size={36} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#f9fafb',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 150,
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: 11, color: '#6b7280',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 150,
              }}>
                {email}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />

          {/* Sign out */}
          <button
            id="user-menu-signout"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '9px 12px',
              background: 'none', border: 'none',
              borderRadius: 8, cursor: signingOut ? 'not-allowed' : 'pointer',
              color: '#f87171', fontSize: 13, fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.14s',
              opacity: signingOut ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  );
}
