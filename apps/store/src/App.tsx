import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useStoreAuth } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const HomePage = lazy(() => import('@/pages/HomePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const CategoryPage = lazy(() => import('@/pages/CategoryPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { initialize, initialized } = useStoreAuth();
  
  useEffect(() => {
    initialize();
    
    // Clear legacy cart items if connecting to Supabase for the first time
    if (hasSupabaseConfig) {
      const state = useCartStore.getState();
      if (state.items.some(i => !i.productId.includes('-'))) {
        state.clearCart();
      }
    }
  }, [initialize]);
  
  if (!initialized) return <PageLoader />;
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="buscar" element={<SearchPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="produto/:slug" element={<ProductPage />} />
          <Route path="carrinho" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="conta" element={<AccountPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="cadastro" element={<RegisterPage />} />
          <Route path="historico" element={<HistoryPage />} />
          <Route path="privacidade" element={<PrivacyPage />} />
          <Route path="termos" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
