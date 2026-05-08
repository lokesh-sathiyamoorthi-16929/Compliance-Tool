import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth';
import { configureApiClient } from '../api/client';
import { isDemoMode } from '../config/env';
import type { User } from '../api/auth';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'unauthenticated',
        });
      },
      login: async (username, password) => {
        set({ status: 'loading' });
        const result = await authApi.login({ username, password });
        set({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          status: 'authenticated',
        });
      },
      changePassword: async (currentPassword, newPassword) => {
        await authApi.changePassword({ currentPassword, newPassword });
        const user = await authApi.me();
        set({ user });
      },
      logout: async () => {
        const { accessToken } = get();
        try {
          if (accessToken && !isDemoMode()) {
            await authApi.logout();
          }
        } finally {
          get().clearAuth();
        }
      },
      hydrate: async () => {
        if (isDemoMode()) {
          set({ status: 'unauthenticated' });
          return;
        }

        const { accessToken, refreshToken } = get();

        if (!accessToken || !refreshToken) {
          set({ status: 'unauthenticated' });
          return;
        }

        set({ status: 'loading' });
        try {
          const user = await authApi.me();
          set({ user, status: 'authenticated' });
        } catch {
          get().clearAuth();
        }
      },
    }),
    {
      name: 'complianceiq_auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

configureApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (accessToken, refreshToken) => useAuthStore.getState().setTokens(accessToken, refreshToken),
  logout: () => useAuthStore.getState().logout(),
});
