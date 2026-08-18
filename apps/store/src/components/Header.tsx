import { Link } from 'react-router-dom';
import { Search, User, ShoppingCart } from 'lucide-react';
import { useStoreSettings } from '@/hooks/queries';
import { useCartStore } from '@/stores/cart';
import { useStoreAuth } from '@/stores/auth';

export default function Header() {
  const { data: settings } = useStoreSettings();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { user } = useStoreAuth();

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="font-bold text-xl text-text whitespace-nowrap">
            {settings?.store_name ? (
              settings.store_name.replace(/menos/i, (m) => `<span class="text-brand-500">${m}</span>`)
            ).split('<span').length > 1 ? (
              <span dangerouslySetInnerHTML={{ __html: settings.store_name.replace(/menos/i, (m) => `<span class="text-brand-500">${m}</span>`) }} />
            ) : (
              <>Pag<span className="text-brand-500">menos</span></>
            ) : (
              <>Pag<span className="text-brand-500">menos</span></>
            )}
          </Link>

          {/* Mobile Search/User Icons - Now just User since Search is below */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link to="/conta" className="p-2 -mr-2 text-text-secondary hover:text-text flex items-center gap-1.5 bg-background rounded-full px-3 border border-border">
              <User size={16} />
              <span className="text-xs font-semibold">Conta</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <Link to="/buscar" className="flex lg:hidden items-center gap-2 bg-background border border-border rounded-xl px-3 py-2.5 text-text-secondary hover:bg-surface-hover transition-colors">
          <Search size={18} className="text-text-muted" />
          <span className="text-sm">Buscar medicamentos...</span>
        </Link>

        {/* Desktop Search */}
        <Link to="/buscar" className="hidden lg:flex flex-1 max-w-xl items-center gap-2 bg-background border border-border rounded-xl px-4 py-2.5 text-text-secondary hover:bg-surface-hover transition-colors">
          <Search size={18} className="text-text-muted" />
          <span className="text-sm">Buscar medicamentos ou produtos...</span>
        </Link>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-6">
          <Link to="/conta" className="flex items-center gap-2 text-text-secondary hover:text-brand-600 transition-colors">
            <User size={22} />
            <span className="text-sm font-medium truncate max-w-[150px]">{user?.name ? user.name.split(' ')[0] : (user?.email || 'Entrar')}</span>
          </Link>
          <Link to="/carrinho" className="flex items-center gap-2 text-text-secondary hover:text-brand-600 transition-colors relative">
            <ShoppingCart size={22} />
            <span className="text-sm font-medium">Carrinho</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -left-2 bg-brand-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
