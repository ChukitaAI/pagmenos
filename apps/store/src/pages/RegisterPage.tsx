import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useStoreAuth } from '@/stores/auth';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
const isDemoAllowed = !hasSupabaseConfig && import.meta.env.DEV;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user, register } = useStoreAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect
  if (user) {
    return <Navigate to="/conta" replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Preencha todos os campos.'); return; }
    if (password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }

    if (!hasSupabaseConfig) {
      if (isDemoAllowed) {
        toast.error('Cadastro indisponível no Modo Demo. Use a opção "Entrar como Cliente Demo" no Login.');
        navigate('/login');
      } else {
        toast.error('Não foi possível conectar ao serviço de autenticação.');
      }
      return;
    }

    setLoading(true);
    const { error } = await register(name, email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Conta criada com sucesso!');
    navigate('/conta', { replace: true });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text mb-6 inline-flex" aria-label="Voltar">
        <ArrowLeft size={24} />
      </button>

      <h1 className="text-2xl font-bold text-text mb-2">Criar conta</h1>
      <p className="text-text-secondary text-sm mb-8">Cadastre-se para acompanhar seus pedidos.</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            required
            className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
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
            minLength={6}
            className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-brand-500 text-white font-semibold rounded-xl py-3.5 hover:bg-brand-600 transition-colors disabled:opacity-60">
          {loading ? 'Criando conta...' : 'Cadastrar'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-text-secondary">
        Já tem uma conta? <Link to="/login" className="text-brand-600 font-medium">Entrar</Link>
      </div>
    </div>
  );
}
