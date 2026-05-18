import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useHistoryStore } from './historyStore';
import { useBoardStore } from './boardStore';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

const REDIRECT_URL = isElectron
  ? 'blackboard://auth/callback'
  : window.location.origin;

/** Local guest user — only used after explicit "Continue without signing in". */
export const LOCAL_GUEST_USER = {
  id: 'local-guest',
  email: 'guest@local',
  user_metadata: { full_name: 'Guest' },
};

export function isGuestUser(user) {
  return user?.id === LOCAL_GUEST_USER.id;
}

const AUTH_TIMEOUT_MS = 8000;
let authListenerAttached = false;

export const useAuthStore = create((set, get) => ({
  user: null,
  guestMode: false,
  loading: true,
  error: null,
  authLoading: false,
  authError: null,

  clearAuthError: () => set({ authError: null }),
  setUser: (user) => set({ user, guestMode: isGuestUser(user) }),

  /** Explicit opt-in only — never auto-assigned on startup or sign-out. */
  continueAsGuest: () => {
    set({
      user: LOCAL_GUEST_USER,
      guestMode: true,
      loading: false,
      authError: null,
    });
  },

  init: async () => {
    set({ loading: true });
    try {
      if (!supabase) {
        set({ user: null, guestMode: false });
        return;
      }

      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), AUTH_TIMEOUT_MS)
        ),
      ]);

      const session = sessionResult?.data?.session;
      set({
        user: session?.user ?? null,
        guestMode: false,
      });

      if (!authListenerAttached) {
        authListenerAttached = true;
        supabase.auth.onAuthStateChange((_event, nextSession) => {
          // Always respect sign-out → login page (never bounce to guest)
          set({
            user: nextSession?.user ?? null,
            guestMode: false,
          });
        });
      }
    } catch (err) {
      console.warn('[Blackboard] Auth init:', err?.message ?? err);
      set({
        user: null,
        guestMode: false,
        error: 'Could not connect to sign-in service. You can continue as guest or try again.',
      });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    if (!supabase) {
      set({ authError: 'Sign-in is not configured for this build.' });
      return;
    }
    try {
      set({ authError: null, authLoading: true });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URL,
          skipBrowserRedirect: !!isElectron,
        },
      });
      if (error) throw error;
      if (data?.url) {
        if (isElectron && window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url);
        } else {
          window.open(data.url, '_blank');
        }
      }
    } catch {
      set({ authError: 'Google login failed. Please try again.' });
    } finally {
      set({ authLoading: false });
    }
  },

  signInWithGithub: async () => {
    if (!supabase) {
      set({ authError: 'Sign-in is not configured for this build.' });
      return;
    }
    try {
      set({ authError: null, authLoading: true });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: REDIRECT_URL,
          skipBrowserRedirect: !!isElectron,
        },
      });
      if (error) throw error;
      if (data?.url) {
        if (isElectron && window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url);
        } else {
          window.open(data.url, '_blank');
        }
      }
    } catch {
      set({ authError: 'GitHub login failed. Please try again.' });
    } finally {
      set({ authLoading: false });
    }
  },

  signInWithApple: async () => {
    if (!supabase) {
      set({ authError: 'Sign-in is not configured for this build.' });
      return;
    }
    try {
      set({ authError: null, authLoading: true });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: REDIRECT_URL,
          skipBrowserRedirect: !!isElectron,
        },
      });
      if (error) throw error;
      if (data?.url) {
        if (isElectron && window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url);
        } else {
          window.open(data.url, '_blank');
        }
      }
    } catch {
      set({ authError: 'Apple login failed. Please try again.' });
    } finally {
      set({ authLoading: false });
    }
  },

  signOut: async () => {
    const wasGuest = get().guestMode || isGuestUser(get().user);

    if (supabase && !wasGuest) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (err) {
        console.warn('[Blackboard] signOut:', err);
      }
    }

    set({
      user: null,
      guestMode: false,
      authError: null,
    });

    useHistoryStore.getState().resetAll();
    useBoardStore.getState().resetAll();
  },

  clearError: () => set({ error: null }),
}));
