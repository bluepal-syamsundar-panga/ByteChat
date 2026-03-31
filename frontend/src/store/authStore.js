import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hasValidAccessToken } from '../utils/authToken';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: hasValidAccessToken(accessToken),
        }),
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken: accessToken ?? state.accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          isAuthenticated: hasValidAccessToken(accessToken ?? state.accessToken),
        })),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'bytechat-auth',
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (!hasValidAccessToken(state.accessToken)) {
          state.logout();
        }

        state.setHasHydrated(true);
      },
    },
  ),
);

export default useAuthStore;
