import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('Neste momento o cadastro está em desenvolvimento. Use o Modo Demo no Login.');
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text mb-6 inline-flex" aria-label="Voltar">
        <ArrowLeft size={24} />
      </button>

      <h1 className="text-2xl font-bold text-text mb-2">Criar conta</h1>
      <p className="text-text-secondary text-sm mb-8">Cadastre-se para aproveitar ofertas exclusivas.</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <input type="text" placeholder="Nome completo" className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface" />
        </div>
        <div>
          <input type="email" placeholder="E-mail" className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface" />
        </div>
        <div>
          <input type="password" placeholder="Senha" className="w-full border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface" />
        </div>

        <button type="submit" className="w-full bg-brand-500 text-white font-semibold rounded-xl py-3.5 hover:bg-brand-600 transition-colors">
          Cadastrar
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-text-secondary">
        Já tem uma conta? <Link to="/login" className="text-brand-600 font-medium">Entrar</Link>
      </div>
    </div>
  );
}
