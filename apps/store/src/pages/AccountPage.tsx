import { Link, useNavigate } from 'react-router-dom';
import { useStoreAuth } from '@/stores/auth';
import { User, LogOut, Package, Shield } from 'lucide-react';

export default function AccountPage() {
  const { user, role, logout } = useStoreAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4 text-brand-500">
          <User size={32} />
        </div>
        <h1 className="text-xl font-bold text-text mb-2">Sua Conta</h1>
        <p className="text-sm text-text-secondary mb-6">Entre ou cadastre-se para acompanhar seus pedidos.</p>
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

  const displayName = user.name?.split(' ')[0] || (user.email ? user.email.split('@')[0] : 'Cliente');
  const initial = user.name?.charAt(0) || user.email?.charAt(0) || 'C';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-5">
        <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0 uppercase">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-text">Olá, {displayName}</h1>
          <p className="text-sm text-text-secondary truncate">{user.email}</p>
        </div>
      </div>

      {/* Purchase history link — primary CTA */}
      <Link to="/historico" className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-5 hover:border-brand-500 transition-colors group">
        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
          <Package size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-text">Compras anteriores</h2>
          <p className="text-sm text-text-secondary">Veja o histórico dos seus pedidos</p>
        </div>
        <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </Link>

      {role === 'admin' && (
        <Link to="/admin" className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-5 hover:border-brand-500 transition-colors group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <Shield size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-text">Painel administrativo</h2>
            <p className="text-sm text-text-secondary">Gerencie produtos e categorias</p>
          </div>
          <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      )}

      {/* Logout */}
      <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full bg-danger-light text-danger font-semibold rounded-xl py-3.5 hover:bg-danger/20 transition-colors text-sm">
        <LogOut size={18} /> Sair da conta
      </button>
    </div>
  );
}
