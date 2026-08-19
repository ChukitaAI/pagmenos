import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  initialized: boolean;
  isDemoMode: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  initialized: false,
  isDemoMode: false,

  initialize: async () => {
    if (!hasSupabaseConfig && import.meta.env.DEV) {
      // In demo mode without supabase, we might already be "logged in" via a local flag
      // But we keep it simple: require them to click "demo login" each time they refresh for now,
      // or we can just auto-initialize to demo mode if DEV
      set({ loading: false, initialized: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let role = null;
      if (session?.user) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
        role = data?.role || null;
      }

      set({ session, user: session?.user ?? null, role, loading: false, initialized: true });

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        let newRole = null;
        if (newSession?.user) {
          const { data } = await supabase.from('user_roles').select('role').eq('user_id', newSession.user.id).single();
          newRole = data?.role || null;
        }
        set({ session: newSession, user: newSession?.user ?? null, role: newRole, loading: false });
      });
    } catch (e) {
      set({ loading: false, initialized: true });
    }
  },

  loginAsDemo: () => {
    set({
      user: { id: 'admin-demo', email: 'admin@demo.com' } as User,
      role: 'admin',
      isDemoMode: true,
      initialized: true,
      loading: false,
    });
  },

  signOut: async () => {
    if (useAuthStore.getState().isDemoMode) {
      set({ user: null, role: null, isDemoMode: false });
      return;
    }
    await supabase.auth.signOut();
    set({ session: null, user: null, role: null });
  },
}));
