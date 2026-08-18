import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStoreAuth } from '@/stores/auth';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsDemo, isDemoMode } = useStoreAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Is this DEV env?
  const isDev = import.meta.env.DEV;
  // Does it have Supabase configured?
  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  
  const showDemoLogin = isDev || !hasSupabaseConfig;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('Neste momento o login está em desenvolvimento. Use o Modo Demo.');
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    toast.success('Logado como Cliente Demo');
    const from = location.state?.from?.pathname || '/conta';
    navigate(from, { replace: true });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text mb-6 inline-flex" aria-label="Voltar">
        <ArrowLeft size={24} />
      </button>

      <h1 className="text-2xl font-bold text-text mb-2">Entrar</h1>
      <p className="text-text-secondary text-sm mb-8">Acesse sua conta para ver seus pedidos.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        
        <div className="flex justify-end">
          <Link to="#" className="text-sm text-brand-600 font-medium">Esqueceu a senha?</Link>
        </div>

        <button type="submit" className="w-full bg-brand-500 text-white font-semibold rounded-xl py-3.5 hover:bg-brand-600 transition-colors">
          Entrar
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-text-secondary">
        Não tem uma conta? <Link to="/cadastro" className="text-brand-600 font-medium">Cadastre-se</Link>
      </div>

      {showDemoLogin && (
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-center relative">
            <span className="bg-background px-3 text-xs font-semibold text-text-muted uppercase tracking-wider absolute -top-3 left-1/2 -translate-x-1/2">
              Modo de Demonstração
            </span>
          </div>
          <button
            onClick={handleDemoLogin}
            className="mt-6 w-full bg-text text-white font-semibold rounded-xl py-3.5 hover:bg-text/90 transition-colors text-sm flex justify-center items-center gap-2"
          >
            Entrar como Cliente Demo
          </button>
        </div>
      )}
    </div>
  );
}
