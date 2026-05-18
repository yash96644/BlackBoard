import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/LoginPage';
import { loadBoard } from '../utils/storageUtils';
import { useBoardStore } from '../store/boardStore';

function FullScreenSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw',
      background: '#111827',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '4px solid rgba(99,102,241,0.2)',
        borderTop: '4px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthGuard({ children }) {
  const { user, loading, init } = useAuthStore();

  useEffect(() => {
    // Initialize auth session
    init();

    // Handle deep link from Electron OAuth callback
    if (window.electronAPI?.onDeepLink) {
      window.electronAPI.onDeepLink(async (url) => {
        // url looks like: blackboard://auth/callback#access_token=xxx
        // Extract the hash portion and give it to Supabase
        try {
          const hashPart = url.split('#')[1];
          if (hashPart) {
            // Supabase can parse the hash fragment to get the session
            const params = new URLSearchParams(hashPart);
            const accessToken  = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              const { data, error } =
                await supabase.auth.setSession({
                  access_token:  accessToken,
                  refresh_token: refreshToken,
                });

              if (data.session) {
                useAuthStore.setState({
                  user: data.session.user,
                  guestMode: false,
                });
              }
            }
          }
        } catch (err) {
          console.error('Deep link auth error:', err);
        }
      });

      return () => {
        window.electronAPI.removeDeepLinkListener?.();
      };
    }
  }, []);

  useEffect(() => {
    if (user) {
      const saved = loadBoard(user.id);
      if (saved && saved.pages?.length) {
        useBoardStore.getState().loadPages(saved.pages);
      } else {
        useBoardStore.getState().resetAll(); // fresh board for new user
      }
    }
  }, [user?.id]);

  if (loading) return <FullScreenSpinner />;
  if (!user)   return <LoginPage />;
  return children;
}
