import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import Layout from '@/components/Layout';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const PromotionsPage = lazy(() => import('@/pages/PromotionsPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, role, initialized } = useAuthStore();
  const location = useLocation();
  if (!initialized) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!role || role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md bg-surface p-8 rounded-3xl border border-border text-center">
        <div className="w-16 h-16 bg-danger-light text-danger rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
        <h1 className="text-xl font-bold text-text mb-2">Acesso negado</h1>
        <p className="text-sm text-text-secondary mb-6">Você não possui permissão para acessar o painel administrativo.</p>
        <button onClick={() => { useAuthStore.getState().signOut(); }} className="text-sm text-brand-600 font-medium hover:underline">Sair e tentar outra conta</button>
      </div>
    </div>
  );
  return children;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="ofertas" element={<PromotionsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
