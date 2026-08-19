import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
const isDemoAllowed = !hasSupabaseConfig && import.meta.env.DEV;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!hasSupabaseConfig) {
      if (isDemoAllowed) {
        toast.error('Login disponível apenas em modo de demonstração no ambiente local sem Supabase.');
      } else {
        toast.error('Não foi possível conectar ao serviço de autenticação.');
      }
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
      toast.error('E-mail ou senha incorretos.'); 
      setLoading(false); 
      return; 
    }

    // Check if user has admin role
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).single();
    
    if (!roleData || roleData.role !== 'admin') {
      await supabase.auth.signOut();
      toast.error('Você não possui permissão para acessar o painel administrativo.');
      setLoading(false);
      return;
    }

    const from = (location.state as any)?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-3xl border border-border shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#1FA36B"/>
              <circle cx="16" cy="16" r="7" stroke="#fff" strokeWidth="1.5"/>
              <path d="M14 13h4M14 16h4M14 19h2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Acesso Restrito</h1>
          <p className="text-sm text-text-secondary mt-1">Painel administrativo da Pagmenos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-500 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60">
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        {isDemoAllowed && (
          <div className="mt-10 pt-8 border-t border-border">
            <div className="text-center relative">
              <span className="bg-surface px-3 text-xs font-semibold text-text-muted uppercase tracking-wider absolute -top-3 left-1/2 -translate-x-1/2">
                Desenvolvimento
              </span>
            </div>
            <button 
              type="button"
              onClick={() => {
                import('@/stores/auth').then(({ useAuthStore }) => {
                  useAuthStore.getState().loginAsDemo();
                  toast.success('Logado como Admin Demo');
                  const from = (location.state as any)?.from?.pathname || '/';
                  navigate(from, { replace: true });
                });
              }}
              className="mt-6 w-full bg-text text-white py-3.5 rounded-xl font-semibold hover:bg-text/90 transition-colors"
            >
              Acessar painel de demonstração
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
