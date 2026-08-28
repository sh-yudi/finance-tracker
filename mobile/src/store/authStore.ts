import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../api/client';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = 'finance_tracker_token';
const USER_KEY = 'finance_tracker_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      setAuthToken(res.token);
      await AsyncStorage.multiSet([
        [TOKEN_KEY, res.token],
        [USER_KEY, JSON.stringify(res.user)],
      ]);
      set({ user: res.user, token: res.token, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, name },
        auth: false,
      });
      setAuthToken(res.token);
      await AsyncStorage.multiSet([
        [TOKEN_KEY, res.token],
        [USER_KEY, JSON.stringify(res.user)],
      ]);
      set({ user: res.user, token: res.token, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  logout: async () => {
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({ user: null, token: null });
  },

  hydrate: async () => {
    const [token, userRaw] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    if (token[1] && userRaw[1]) {
      const user = JSON.parse(userRaw[1]) as User;
      setAuthToken(token[1]);
      set({ user, token: token[1] });
    }
  },
}));
