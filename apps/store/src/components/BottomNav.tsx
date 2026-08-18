import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/stores/cart';

export default function BottomNav() {
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const navItems = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/buscar', icon: Search, label: 'Buscar' },
    { to: '/carrinho', icon: ShoppingCart, label: 'Carrinho', badge: itemCount },
    { to: '/conta', icon: User, label: 'Conta' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border safe-bottom" role="navigation" aria-label="Menu principal">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all touch-target relative ${isActive ? 'text-brand-700 bg-brand-50' : 'text-text-secondary hover:bg-surface-hover'}`} aria-label={item.label}>
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? 'text-brand-600' : ''} />
                  {item.badge ? (<span className="absolute -top-1.5 -right-2.5 bg-brand-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm">{item.badge > 99 ? '99+' : item.badge}</span>) : null}
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
