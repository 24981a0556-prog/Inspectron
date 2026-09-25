import { create } from 'zustand';
import { User, UserRole } from '../types';
import { apiClient } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  quickLogin: (role: UserRole) => Promise<boolean>;
  initAuth: () => Promise<void>;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  BUSINESS_USER: { email: 'business@abcretail.demo', pass: 'Business@1234' },
  LMO: { email: 'lmo.rajesh@legal.demo', pass: 'Lmo@1234' },
  GATC: { email: 'officer@gatc.demo', pass: 'Officer@1234' },
  ADMIN: { email: 'admin@inspectra.demo', pass: 'Admin@1234' },
  SUPERVISOR: { email: 'supervisor@legal.demo', pass: 'Supervisor@1234' }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('inspectra_token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { access_token, user_id, full_name, role, organization_id } = res.data;

      localStorage.setItem('inspectra_token', access_token);
      const userObj: User = {
        id: user_id,
        email,
        full_name,
        role: role as UserRole,
        organization_id,
        is_active: true
      };
      set({ user: userObj, token: access_token, isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  quickLogin: async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) return false;
    return get().login(creds.email, creds.pass);
  },

  logout: () => {
    localStorage.removeItem('inspectra_token');
    set({ user: null, token: null });
  },

  initAuth: async () => {
    const token = localStorage.getItem('inspectra_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const res = await apiClient.get('/auth/me');
      set({ user: res.data, isLoading: false });
    } catch (err) {
      localStorage.removeItem('inspectra_token');
      set({ user: null, token: null, isLoading: false });
    }
  }
}));
