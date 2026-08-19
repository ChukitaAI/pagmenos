import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useStoreAuth } from '@/stores/auth';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
const isDemoAllowed = !hasSupabaseConfig && import.meta.env.DEV;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loginAsDemo, resetPassword } = useStoreAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  // Already logged in — redirect
  if (user) {
    const fallbackFrom = (location.state as any)?.from?.pathname || '/conta';
    const from = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : fallbackFrom;
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha e-mail e senha.'); return; }

    if (!hasSupabaseConfig && isDemoAllowed) {
      toast.error('Login disponível apenas em modo de demonstração no ambiente local sem Supabase.');
      return;
    }

    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Login realizado com sucesso!');
    const fallbackFrom = (location.state as any)?.from?.pathname || '/conta';
    const from = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : fallbackFrom;
    navigate(from, { replace: true });
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.error('Preencha o campo de e-mail para recuperar a senha.'); return; }
    const { error } = await resetPassword(email);
    if (error) { toast.error(error); return; }
    toast.success('E-mail de recuperação enviado. Verifique sua caixa de entrada.');
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    toast.success('Logado como Cliente Demo');
    const fallbackFrom = (location.state as any)?.from?.pathname || '/conta';
    const from = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : fallbackFrom;
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
            required
            className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
            className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        
        <div className="flex justify-end">
          <button type="button" onClick={handleForgotPassword} className="text-sm text-brand-600 font-medium hover:underline">Esqueceu a senha?</button>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-brand-500 text-white font-semibold rounded-xl py-3.5 hover:bg-brand-600 transition-colors disabled:opacity-60">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-text-secondary">
        Não tem uma conta? <Link to="/cadastro" className="text-brand-600 font-medium">Cadastre-se</Link>
      </div>

      {isDemoAllowed && (
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
