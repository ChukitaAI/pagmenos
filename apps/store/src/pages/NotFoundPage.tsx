import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-text-muted mb-4">404</h1>
      <p className="text-lg font-medium text-text mb-2">Página não encontrada</p>
      <p className="text-sm text-text-secondary mb-6">A página que você procura não existe.</p>
      <Link to="/" className="inline-flex bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors">
        Voltar ao início
      </Link>
    </div>
  );
}
