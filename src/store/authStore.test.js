import { describe, it, expect, beforeEach } from 'vitest';
import {
  LOCAL_GUEST_USER,
  isGuestUser,
  useAuthStore,
} from './authStore';

describe('authStore logout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: LOCAL_GUEST_USER,
      guestMode: true,
      loading: false,
      authError: null,
    });
  });

  it('isGuestUser identifies local guest', () => {
    expect(isGuestUser(LOCAL_GUEST_USER)).toBe(true);
    expect(isGuestUser({ id: 'real-user-id' })).toBe(false);
  });

  it('signOut clears guest and returns to logged-out state', async () => {
    await useAuthStore.getState().signOut();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.guestMode).toBe(false);
  });

  it('continueAsGuest sets guestMode explicitly', () => {
    useAuthStore.setState({ user: null, guestMode: false });
    useAuthStore.getState().continueAsGuest();
    const state = useAuthStore.getState();
    expect(state.user).toEqual(LOCAL_GUEST_USER);
    expect(state.guestMode).toBe(true);
  });
});
