import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import Layout from '@/components/Layout';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const MFASetupPage = lazy(() => import('@/pages/MFASetupPage'));
const MFAVerifyPage = lazy(() => import('@/pages/MFAVerifyPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const PromotionsPage = lazy(() => import('@/pages/PromotionsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, role, initialized } = useAuthStore();
  const location = useLocation();
  if (!initialized) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!role || role !== 'admin') return <div className="p-8 text-center"><p className="text-danger font-medium">Acesso negado. Conta sem privilégios administrativos.</p></div>;
  return children;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mfa/setup" element={<RequireAuth><MFASetupPage /></RequireAuth>} />
        <Route path="/mfa/verify" element={<RequireAuth><MFAVerifyPage /></RequireAuth>} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="promocoes" element={<PromotionsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
