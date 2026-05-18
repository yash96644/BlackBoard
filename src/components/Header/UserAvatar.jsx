import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore, isGuestUser } from '../../store/authStore';
import { useCanvasStore } from '../../store/canvasStore';

export default function UserAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, guestMode } = useAuthStore();
  const isGuest = guestMode || isGuestUser(user);
  const boardMode = useCanvasStore((s) => s.boardMode);
  const isWhiteboard = boardMode === 'whiteboard';

  const toggleMenu = () => setIsOpen(!isOpen);

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full border-2 border-indigo-600
          overflow-hidden hover:opacity-80 transition-opacity">
        {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
          <img src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="User" />
        ) : (
          <div className="w-full h-full bg-indigo-100 flex
            items-center justify-center text-indigo-700 font-bold text-xs">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-10 rounded-xl shadow-lg py-2 w-48 z-50 border
          ${isWhiteboard ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4e]'}`}>

          <div className={`px-4 py-2 border-b ${isWhiteboard ? 'border-gray-100' : 'border-[#2d2d4e]'}`}>
            <p className={`text-sm font-medium truncate ${isWhiteboard ? 'text-gray-900' : 'text-white'}`}>
              {isGuest ? 'Guest' : (user.user_metadata?.full_name || 'User')}
            </p>
            <p className={`text-xs truncate ${isWhiteboard ? 'text-gray-500' : 'text-gray-400'}`}>
              {isGuest ? 'Not signed in' : user.email}
            </p>
          </div>

          <button
            onClick={async () => {
              await signOut();
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 mt-1
              ${isWhiteboard ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-[#1e1e3a]'}`}
          >
            <LogOut size={14} />
            {isGuest ? 'Return to sign in' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
