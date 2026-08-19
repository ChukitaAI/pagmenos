import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStoreAuth } from '@/stores/auth';
import { toast } from 'sonner';

export default function AdminGuard() {
  const { user, role, loading, initialized } = useStoreAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !loading) {
      if (user && role !== 'admin') {
        toast.error('Você não possui permissão para acessar o painel administrativo.');
        navigate('/conta', { replace: true });
      }
    }
  }, [user, role, loading, initialized, navigate]);

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  return <Outlet />;
}
