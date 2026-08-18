import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { LayoutDashboard, Package, Tag, Settings, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, role, signOut } = useAuthStore();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/produtos', icon: Package, label: 'Produtos' },
    { to: '/promocoes', icon: Tag, label: 'Promoções' },
    { to: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-surface border-r border-border flex-col hidden md:flex">
        <div className="p-6 border-b border-border">
          <span className="text-2xl font-bold text-text">Pag<span className="text-brand-500">menos</span></span>
          <span className="text-xs font-semibold tracking-wider text-text-muted uppercase ml-2">Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'text-text-secondary hover:bg-surface-hover hover:text-text'}`}>
              <item.icon size={20} />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-text truncate">{user?.email}</p>
            <p className="text-xs text-text-muted capitalize">{role}</p>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light rounded-xl transition-colors">
            <LogOut size={18} />Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-6 md:p-8 max-w-6xl mx-auto"><Outlet /></div></main>
    </div>
  );
}
