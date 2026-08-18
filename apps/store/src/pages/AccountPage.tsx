import { Link, useNavigate } from 'react-router-dom';
import { useStoreAuth } from '@/stores/auth';
import { User, LogOut, Package, MapPin } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useStoreAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4 text-brand-500">
          <User size={32} />
        </div>
        <h1 className="text-xl font-bold text-text mb-2">Sua Conta</h1>
        <p className="text-sm text-text-secondary mb-6">Entre ou cadastre-se para acompanhar seus pedidos e salvar seus dados.</p>
        <Link to="/login" className="block w-full bg-brand-500 text-white font-semibold rounded-xl py-3.5 mb-3 hover:bg-brand-600 transition-colors">
          Entrar ou Cadastrar
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4">
        <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
          {user.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-text">Olá, {user.name?.split(' ')[0] || 'Cliente'}</h1>
          <p className="text-text-secondary mt-1">Gerencie seus pedidos, endereços e dados pessoais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/historico" className="bg-surface border border-border rounded-2xl p-6 hover:border-brand-500 transition-colors group">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
          <h2 className="text-lg font-bold text-text mb-1">Meus pedidos</h2>
          <p className="text-text-secondary text-sm">Acompanhe suas compras passadas</p>
        </Link>

        <div className="bg-surface border border-border rounded-2xl p-6 opacity-60 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-surface-hover text-xs font-semibold px-2.5 py-1 rounded-md">Em breve</div>
          <div className="w-12 h-12 bg-surface-hover text-text-muted rounded-full flex items-center justify-center mb-4">
            <MapPin size={24} />
          </div>
          <h2 className="text-lg font-bold text-text mb-1">Endereços</h2>
          <p className="text-text-secondary text-sm">Gerencie seus locais de entrega</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 mt-6">
        <h2 className="text-lg font-bold text-text mb-4">Dados da conta</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary">Nome completo</p>
            <p className="font-medium text-text">{user.name || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">E-mail</p>
            <p className="font-medium text-text">{user.email}</p>
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full bg-danger-light text-danger font-semibold rounded-xl py-3.5 hover:bg-danger/20 transition-colors text-sm">
        <LogOut size={18} /> Sair da conta
      </button>
    </div>
  );
}
