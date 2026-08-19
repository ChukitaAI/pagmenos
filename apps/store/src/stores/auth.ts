import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
const isDemoAllowed = !hasSupabaseConfig && import.meta.env.DEV;

export interface DemoUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: (User & { name?: string | null }) | DemoUser | null;
  role: 'admin' | 'customer' | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isDemoMode: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
}

export const useStoreAuth = create<AuthState>()((set) => ({
  user: null,
  role: null,
  session: null,
  loading: true,
  initialized: false,
  isDemoMode: false,

  initialize: async () => {
    if (!hasSupabaseConfig) {
      if (isDemoAllowed) {
        const demo = localStorage.getItem('demo_user');
        if (demo) {
          set({ user: JSON.parse(demo), isDemoMode: true, loading: false, initialized: true });
        } else {
          set({ loading: false, initialized: true });
        }
      } else {
        set({ loading: false, initialized: true });
      }
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let profileName: string | null = null;
      let role: 'admin' | 'customer' | null = null;
      if (session?.user) {
        const [profileRes, roleRes] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', session.user.id).single(),
          supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
        ]);
        profileName = profileRes.data?.full_name || session.user.email || null;
        role = roleRes.data?.role || 'customer';
      }

      set({ 
        session, 
        user: session?.user ? { ...session.user, name: profileName } as any : null, 
        role,
        loading: false, 
        initialized: true 
      });

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        let newName: string | null = null;
        let newRole: 'admin' | 'customer' | null = null;
        if (newSession?.user) {
          const [profileRes, roleRes] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', newSession.user.id).single(),
            supabase.from('user_roles').select('role').eq('user_id', newSession.user.id).single()
          ]);
          newName = profileRes.data?.full_name || newSession.user.email || null;
          newRole = roleRes.data?.role || 'customer';
        }
        set({ 
          session: newSession, 
          user: newSession?.user ? { ...newSession.user, name: newName } as any : null, 
          role: newRole,
          loading: false 
        });
      });
    } catch (e) {
      set({ loading: false, initialized: true });
    }
  },

  login: async (email: string, password: string) => {
    if (!hasSupabaseConfig) {
      return { error: 'Não foi possível conectar ao serviço de autenticação.' };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: 'E-mail ou senha inválidos.' };
        }
        return { error: 'Não foi possível entrar. Tente novamente.' };
      }
      return { error: null };
    } catch {
      return { error: 'Não foi possível entrar. Tente novamente.' };
    }
  },

  register: async (name: string, email: string, password: string) => {
    if (!hasSupabaseConfig) {
      return { error: 'Não foi possível conectar ao serviço de autenticação.' };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'Este e-mail já está cadastrado.' };
        }
        return { error: 'Não foi possível criar sua conta. Tente novamente.' };
      }
      return { error: null };
    } catch {
      return { error: 'Não foi possível criar sua conta. Tente novamente.' };
    }
  },

  resetPassword: async (email: string) => {
    if (!hasSupabaseConfig) {
      return { error: 'Não foi possível conectar ao serviço de autenticação.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return { error: 'Não foi possível enviar o e-mail de recuperação.' };
      }
      return { error: null };
    } catch {
      return { error: 'Não foi possível enviar o e-mail de recuperação.' };
    }
  },

  loginAsDemo: () => {
    if (!isDemoAllowed) return;
    const demo = { id: 'demo-client', name: 'Cliente Demo', email: 'cliente@demo.com' };
    localStorage.setItem('demo_user', JSON.stringify(demo));
    set({ user: demo, role: 'customer', isDemoMode: true });
  },

  logout: async () => {
    if (useStoreAuth.getState().isDemoMode) {
      localStorage.removeItem('demo_user');
      set({ user: null, isDemoMode: false });
      return;
    }
    await supabase.auth.signOut();
    set({ session: null, user: null, role: null });
  },
}));
