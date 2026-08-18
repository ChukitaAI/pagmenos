import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export interface DemoUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: (User & { name?: string | null }) | DemoUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isDemoMode: boolean;
  initialize: () => Promise<void>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
}

export const useStoreAuth = create<AuthState>()((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  isDemoMode: false,

  initialize: async () => {
    if (!hasSupabaseConfig) {
      const demo = localStorage.getItem('demo_user');
      if (demo) {
        set({ user: JSON.parse(demo), isDemoMode: true, loading: false, initialized: true });
      } else {
        set({ loading: false, initialized: true });
      }
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let profileName = null;
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        profileName = data?.full_name || session.user.email;
      }

      set({ 
        session, 
        user: session?.user ? { ...session.user, name: profileName } as any : null, 
        loading: false, 
        initialized: true 
      });

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        let newName = null;
        if (newSession?.user) {
          const { data } = await supabase.from('profiles').select('full_name').eq('id', newSession.user.id).single();
          newName = data?.full_name || newSession.user.email;
        }
        set({ 
          session: newSession, 
          user: newSession?.user ? { ...newSession.user, name: newName } as any : null, 
          loading: false 
        });
      });
    } catch (e) {
      set({ loading: false, initialized: true });
    }
  },

  loginAsDemo: () => {
    const demo = { id: 'demo-client', name: 'Cliente Demo', email: 'cliente@demo.com' };
    if (!hasSupabaseConfig) {
      localStorage.setItem('demo_user', JSON.stringify(demo));
    }
    set({ user: demo, isDemoMode: true });
  },

  logout: async () => {
    if (useStoreAuth.getState().isDemoMode) {
      localStorage.removeItem('demo_user');
      set({ user: null, isDemoMode: false });
      return;
    }
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
