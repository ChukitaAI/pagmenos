import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { LayoutDashboard, Package, Tag, Grid3X3, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/ofertas', icon: Tag, label: 'Ofertas' },
  { to: '/categorias', icon: Grid3X3, label: 'Categorias' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function Layout() {
  const { user, role, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex-col hidden md:flex shrink-0">
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

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border sticky top-0 z-40">
        <span className="text-xl font-bold text-text">Pag<span className="text-brand-500">menos</span> <span className="text-xs font-semibold text-text-muted uppercase ml-1">Admin</span></span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-text-secondary hover:text-text">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile slide menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 bg-surface border-r border-border flex flex-col h-full animate-in slide-in-from-left">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <span className="text-xl font-bold text-text">Pag<span className="text-brand-500">menos</span></span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-text-secondary"><X size={20} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'text-text-secondary hover:bg-surface-hover hover:text-text'}`}>
                  <item.icon size={20} />{item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <p className="text-sm font-semibold text-text truncate px-2 mb-3">{user?.email}</p>
              <button onClick={signOut} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light rounded-xl transition-colors">
                <LogOut size={18} />Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.slice(0, 5).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-all ${isActive ? 'text-brand-600' : 'text-text-secondary'}`}>
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label.length > 8 ? item.label.slice(0, 7) + '.' : item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
